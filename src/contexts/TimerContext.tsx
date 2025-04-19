import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { TimerPhase, TimerSettings, BreathCycle, CycleResult } from '../types';
import { supabase } from '../lib/supabase';
import { useTable } from './TableContext';
import { useUser } from './UserContext';

interface TimerContextType {
  phase: TimerPhase;
  currentCycleIndex: number;
  timeRemaining: number;
  isRunning: boolean;
  totalPhaseTime: number;
  progress: number;
  settings: TimerSettings;
  totalCycles: number;
  cycleResults: CycleResult[];
  isTapMode: boolean;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
  startTimer: (cycles: BreathCycle[]) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (saveAsCompleted?: boolean) => void;
  tapBreathHold: () => void;
  savePracticeRecord: () => Promise<void>;
}

const defaultSettings: TimerSettings = {
  countdownStart: 5,
  useVoice: true,
  volume: 0.7,
  useContinuousCountdown: true,
  useSpecificAnnouncements: false,
  announceTimes: [60, 30, 20, 10, 5]
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const { activeTable } = useTable();
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalPhaseTime, setTotalPhaseTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);
  const [cycleResults, setCycleResults] = useState<CycleResult[]>([]);
  const [userInteracted, setUserInteracted] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [isTapMode, setIsTapMode] = useState(false);
  
  const cyclesRef = useRef<BreathCycle[]>([]);
  const timerRef = useRef<number | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const phaseTransitionPending = useRef<boolean>(false);
  const shouldTransitionRef = useRef<boolean>(false);
  const announcedTimesRef = useRef<Set<number>>(new Set());
  const phaseStartTimeRef = useRef<number>(0);
  const currentResultsRef = useRef<CycleResult[]>([]);
  const isMountedRef = useRef(true); // Track if component is mounted
  const speechInitializedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pendingSpeechQueue = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const lastAnnouncedTimeRef = useRef<number | null>(null);
  const queuedAnnouncementsRef = useRef<Set<string>>(new Set());
  const holdTimeElapsedRef = useRef<number>(0);
  const holdTimerIntervalRef = useRef<number | null>(null);
  const settingsSyncTimeoutRef = useRef<number | null>(null);

  // Load settings from Supabase or localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (user) {
          // Try to load settings from Supabase
          const { data, error } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', user.id)
            .maybeSingle(); // Changed from .single() to .maybeSingle()

          if (error) {
            console.warn('Error loading settings from Supabase:', error);
            // If there's an error but we have settings in localStorage, use those temporarily
            const savedSettings = localStorage.getItem('timerSettings');
            if (savedSettings) {
              const parsedSettings = migrateSettings(JSON.parse(savedSettings));
              setSettings(parsedSettings);
              
              // Try to save the localStorage settings to Supabase for future use
              await saveSettingsToSupabase(parsedSettings);
            }
          } else if (data) {
            // Use settings from Supabase
            const supabaseSettings = migrateSettings(data.settings as Partial<TimerSettings>);
            setSettings(supabaseSettings);
            
            // Also update localStorage for offline use
            localStorage.setItem('timerSettings', JSON.stringify(supabaseSettings));
          } else {
            // No settings found in Supabase, check localStorage
            const savedSettings = localStorage.getItem('timerSettings');
            if (savedSettings) {
              const parsedSettings = migrateSettings(JSON.parse(savedSettings));
              setSettings(parsedSettings);
              
              // Save to Supabase for future use
              await saveSettingsToSupabase(parsedSettings);
            } else {
              // No settings found anywhere, use defaults and save to Supabase
              await saveSettingsToSupabase(defaultSettings);
            }
          }
        } else {
          // No user logged in, use localStorage only
          const savedSettings = localStorage.getItem('timerSettings');
          if (savedSettings) {
            setSettings(migrateSettings(JSON.parse(savedSettings)));
          } else {
            // No settings in localStorage, use defaults
            setSettings(defaultSettings);
          }
        }
        setSettingsLoaded(true);
      } catch (error) {
        console.error('Unexpected error loading settings:', error);
        // Use defaults in case of error
        setSettings(defaultSettings);
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, [user]);

  // Helper function to migrate old settings format to new format
  const migrateSettings = (parsedSettings: Partial<TimerSettings>): TimerSettings => {
    // Handle migration from old format to new format
    const migratedSettings: TimerSettings = {
      ...defaultSettings,
      ...parsedSettings,
      // Always ensure voice is enabled
      useVoice: true,
      // Ensure announceTimes exists and is an array
      announceTimes: Array.isArray(parsedSettings.announceTimes) 
        ? parsedSettings.announceTimes 
        : defaultSettings.announceTimes
    };
    
    // If it has the old announceMode property, migrate to new boolean properties
    if ((parsedSettings as any).announceMode) {
      migratedSettings.useContinuousCountdown = (parsedSettings as any).announceMode === 'continuous';
      migratedSettings.useSpecificAnnouncements = (parsedSettings as any).announceMode === 'specific';
    }
    
    return migratedSettings;
  };

  // Helper function to save settings to Supabase
  const saveSettingsToSupabase = async (settingsToSave: TimerSettings) => {
    if (!user) return;
    
    try {
      // Check if user already has settings
      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle(); // Changed from .single() to .maybeSingle()
      
      if (fetchError) {
        console.error('Error checking for existing settings:', fetchError);
        return;
      }
      
      if (data) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({ settings: settingsToSave })
          .eq('id', data.id);
          
        if (updateError) {
          console.error('Error updating settings in Supabase:', updateError);
        } else {
          console.log('Settings updated successfully in Supabase');
        }
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert([{ user_id: user.id, settings: settingsToSave }]);
          
        if (insertError) {
          console.error('Error inserting settings to Supabase:', insertError);
        } else {
          console.log('Settings saved successfully to Supabase');
        }
      }
    } catch (error) {
      console.error('Unexpected error saving settings to Supabase:', error);
    }
  };

  // Initialize audio context to request permissions
  const initAudioContext = () => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
          
          // Create and play a silent sound to request permission
          if (audioContextRef.current.state === 'suspended') {
            const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.start(0);
            source.stop(0.001);
          }
          
          setAudioPermissionGranted(audioContextRef.current.state === 'running');
          console.log(`Audio context initialized with state: ${audioContextRef.current.state}`);
          
          // Resume AudioContext if it's suspended (needed for some browsers)
          if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().then(() => {
              setAudioPermissionGranted(true);
              console.log('AudioContext resumed successfully');
            }).catch(err => {
              console.warn('Failed to resume AudioContext:', err);
            });
          }
        }
      } catch (e) {
        console.warn('Could not initialize AudioContext:', e);
      }
    }
  };

  // Initialize speech synthesis on component mount
  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;
    
    // Listen for any user interaction to enable audio
    const enableAudioOnUserInteraction = () => {
      if (!userInteracted) {
        console.log('User interaction detected - enabling audio');
        setUserInteracted(true);
        
        // Try to initialize audio context on user interaction
        initAudioContext();
        
        // Force resume AudioContext if it exists but is suspended
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            setAudioPermissionGranted(true);
            console.log('AudioContext resumed after user interaction');
            
            // Try to speak a test message to ensure permissions are granted
            if (speechSynthesisRef.current) {
              try {
                // Test audio with a silent message
                const testUtterance = new SpeechSynthesisUtterance('');
                testUtterance.volume = 0.01; // Nearly silent
                testUtterance.onend = () => console.log('Silent test speech completed');
                testUtterance.onerror = (e) => console.log(`Silent test speech error: ${e.error}`);
                speechSynthesisRef.current.speak(testUtterance);
                
                // Real audible test after a small delay
                setTimeout(() => {
                  if (speechSynthesisRef.current && isMountedRef.current) {
                    const realTestUtterance = new SpeechSynthesisUtterance('Audio initialized');
                    realTestUtterance.volume = settings.volume;
                    realTestUtterance.onend = () => console.log('Test speech completed successfully');
                    realTestUtterance.onerror = (e) => console.log(`Test speech error: ${e.error}`);
                    speechSynthesisRef.current.speak(realTestUtterance);
                  }
                }, 500);
              } catch (e) {
                console.warn('Error during speech test:', e);
              }
            }
          }).catch(err => {
            console.warn('Failed to resume AudioContext after user interaction:', err);
          });
        }
      }
    };
    
    // Add listeners to detect user interaction
    window.addEventListener('click', enableAudioOnUserInteraction);
    window.addEventListener('touchstart', enableAudioOnUserInteraction);
    window.addEventListener('keydown', enableAudioOnUserInteraction);
    
    // Initialize speech synthesis if available
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesisRef.current = window.speechSynthesis;
      
      // Force load voices (needed in some browsers)
      const voices = speechSynthesisRef.current.getVoices();
      console.log(`Initial voices loaded: ${voices.length}`);
      
      if (voices.length > 0) {
        speechInitializedRef.current = true;
        console.log('Speech initialized with voices already available');
      }
      
      // Set up event listener for when voices become available
      speechSynthesisRef.current.addEventListener('voiceschanged', () => {
        if (isMountedRef.current) {
          console.log('Voices changed event fired');
          const newVoices = speechSynthesisRef.current?.getVoices() || [];
          console.log(`Available voices after change: ${newVoices.length}`);
          speechInitializedRef.current = true;
        }
      });
      
      // Initial attempt to initialize without relying on the event
      setTimeout(() => {
        if (isMountedRef.current && speechSynthesisRef.current && !speechInitializedRef.current) {
          const voices = speechSynthesisRef.current.getVoices();
          console.log(`Voices available after timeout: ${voices.length}`);
          if (voices.length > 0) {
            speechInitializedRef.current = true;
            console.log('Speech synthesis initialized via timeout');
          }
        }
      }, 500);
    }
    
    // Clear any pending settings sync timeout
    if (settingsSyncTimeoutRef.current) {
      clearTimeout(settingsSyncTimeoutRef.current);
    }
    
    return () => {
      // Mark as unmounted first
      isMountedRef.current = false;
      
      // Remove event listeners
      window.removeEventListener('click', enableAudioOnUserInteraction);
      window.removeEventListener('touchstart', enableAudioOnUserInteraction);
      window.removeEventListener('keydown', enableAudioOnUserInteraction);
      
      // Clean up speech synthesis
      if (speechSynthesisRef.current) {
        try {
          speechSynthesisRef.current.cancel();
        } catch (e) {
          console.warn('Error canceling speech synthesis during cleanup:', e);
        }
      }
      
      // Clean up audio context
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          console.warn('Error closing audio context:', e);
        }
      }
    };
  }, [userInteracted, settings.volume]);

  // Function to process speech queue
  const processSpeechQueue = () => {
    if (isSpeakingRef.current || !speechSynthesisRef.current || !isMountedRef.current || 
        pendingSpeechQueue.current.length === 0) {
      return;
    }
    
    const textToSpeak = pendingSpeechQueue.current.shift();
    if (!textToSpeak) return;
    
    // Remove from queued announcements set
    queuedAnnouncementsRef.current.delete(textToSpeak);
    
    try {
      console.log(`Processing speech queue: "${textToSpeak}"`);
      isSpeakingRef.current = true;
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.volume = settings.volume;
      utterance.rate = 1.0;
      
      // Try to get an English voice
      if (speechSynthesisRef.current) {
        const voices = speechSynthesisRef.current.getVoices();
        console.log(`Available voices for speech: ${voices.length}`);
        
        // First try to find a local English voice
        let selectedVoice = voices.find(voice => 
          voice.lang.includes('en') && voice.localService === true
        );
        
        // If no local English voice, try any English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.includes('en'));
        }
        
        // If still no voice, use default
        if (selectedVoice) {
          console.log(`Selected voice: ${selectedVoice.name} (${selectedVoice.lang})`);
          utterance.voice = selectedVoice;
        } else {
          console.log('No suitable voice found, using default');
        }
      }
      
      utterance.onstart = () => {
        if (isMountedRef.current) {
          console.log(`Started speaking: "${textToSpeak}"`);
        }
      };
      
      utterance.onend = () => {
        if (isMountedRef.current) {
          console.log(`Finished speaking: "${textToSpeak}"`);
          isSpeakingRef.current = false;
          // Process next item in queue
          setTimeout(processSpeechQueue, 100);
        }
      };
      
      utterance.onerror = (event) => {
        if (isMountedRef.current) {
          console.warn(`Speech error for "${textToSpeak}": ${event.error}`);
          isSpeakingRef.current = false;
          // Try next item after error
          setTimeout(processSpeechQueue, 100);
        }
      };
      
      if (speechSynthesisRef.current && isMountedRef.current) {
        // Apply a workaround for Chrome's speech synthesis bug
        // Chrome sometimes doesn't speak if we don't pause and resume
        speechSynthesisRef.current.cancel();
        speechSynthesisRef.current.speak(utterance);
        
        // Workaround for Chrome's speech synthesis bug (important!)
        if (navigator.userAgent.includes('Chrome')) {
          window.setTimeout(() => {
            if (speechSynthesisRef.current?.speaking) {
              console.log('Applying Chrome speech synthesis workaround');
              const paused = speechSynthesisRef.current.paused;
              speechSynthesisRef.current.pause();
              window.setTimeout(() => {
                if (speechSynthesisRef.current && isMountedRef.current) {
                  speechSynthesisRef.current.resume();
                }
              }, 50);
            }
          }, 100);
        }
      }
    } catch (e) {
      console.error('Error during speech processing:', e);
      isSpeakingRef.current = false;
      // Try next item after error
      setTimeout(processSpeechQueue, 100);
    }
  };

  // Speak announcement with robust error handling
  const speakAnnouncement = (text: string) => {
    if (!speechSynthesisRef.current || !isMountedRef.current) {
      console.log('Cannot speak - speechSynthesis not available or component unmounted');
      return;
    }
    
    if (!userInteracted) {
      console.log('Cannot speak - waiting for user interaction');
      return;
    }
    
    // Prevent duplicate announcements by checking if this text is already queued
    if (queuedAnnouncementsRef.current.has(text)) {
      console.log(`Skipping duplicate announcement: "${text}"`);
      return;
    }
    
    console.log(`Queueing announcement: "${text}"`);
    
    // Add to set of queued announcements
    queuedAnnouncementsRef.current.add(text);
    
    // Add to queue and process
    pendingSpeechQueue.current.push(text);
    processSpeechQueue();
  };

  // Record hold time at end of hold phase
  const recordHoldTime = () => {
    if (phase !== 'hold' || currentCycleIndex >= cyclesRef.current.length) return;
    
    const currentCycle = cyclesRef.current[currentCycleIndex];
    let actualHoldTime: number;
    
    if (isTapMode) {
      // For tap mode, use the accumulated holdTimeElapsed
      actualHoldTime = holdTimeElapsedRef.current;
    } else {
      // For timed mode, calculate from the phase start time
      actualHoldTime = Math.round((Date.now() - phaseStartTimeRef.current) / 1000);
    }
    
    // Add to results
    const newResult: CycleResult = {
      cycleIndex: currentCycleIndex,
      breatheTime: currentCycle.breatheTime,
      holdTime: currentCycle.holdTime,
      actualHoldTime: actualHoldTime,
      wasTapMode: isTapMode
    };
    
    currentResultsRef.current.push(newResult);
  };

  // Handle "tap" to end breath hold (for max attempts)
  const tapBreathHold = () => {
    if (phase !== 'hold' || !isTapMode || !isRunning) return;
    
    // Record the actual hold time
    recordHoldTime();
    
    // Stop the elapsed time counter for tap mode
    if (holdTimerIntervalRef.current) {
      clearInterval(holdTimerIntervalRef.current);
      holdTimerIntervalRef.current = null;
    }
    
    // Move to next cycle or complete
    const nextCycleIndex = currentCycleIndex + 1;
    if (nextCycleIndex < cyclesRef.current.length) {
      // Move to next cycle
      const nextBreatheTime = cyclesRef.current[nextCycleIndex].breatheTime;
      setCurrentCycleIndex(nextCycleIndex);
      setPhase('breathe');
      setTimeRemaining(nextBreatheTime);
      setTotalPhaseTime(nextBreatheTime);
      setProgress(0);
      announcedTimesRef.current.clear(); // Reset announced times for new phase
      speakAnnouncement("Breathe");
      
      // Check if next cycle is tap mode
      setIsTapMode(!!cyclesRef.current[nextCycleIndex].tapMode);
    } else {
      // Complete the training
      setPhase('complete');
      setIsRunning(false);
      speakAnnouncement("Training complete");
      setCycleResults([...currentResultsRef.current]); // Set final results
      
      // Auto-save practice record when training is complete
      setTimeout(() => {
        if (user && activeTable) {
          savePracticeRecord();
        }
      }, 1000);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Effect to handle phase transitions when timer hits zero
  useEffect(() => {
    // Only proceed if we should transition (timer reached zero)
    if (!shouldTransitionRef.current || !isRunning) return;
    
    // Reset the transition flag
    shouldTransitionRef.current = false;
    
    // Proceed with transition
    if (phase === 'breathe') {
      // Transition to hold phase
      const nextCycle = cyclesRef.current[currentCycleIndex];
      const holdTime = nextCycle.holdTime;
      const isTapModeNext = !!nextCycle.tapMode;
      
      setPhase('hold');
      setTimeRemaining(holdTime);
      setTotalPhaseTime(holdTime);
      setProgress(0);
      setIsTapMode(isTapModeNext);
      announcedTimesRef.current.clear(); // Reset announced times for new phase
      phaseStartTimeRef.current = Date.now(); // Record start time for hold phase
      
      // For tap mode, start an upward timer to track elapsed time
      if (isTapModeNext) {
        holdTimeElapsedRef.current = 0;
        
        // Start interval that updates the elapsed time without triggering a transition
        if (holdTimerIntervalRef.current) {
          clearInterval(holdTimerIntervalRef.current);
        }
        
        holdTimerIntervalRef.current = window.setInterval(() => {
          // Increment elapsed time
          holdTimeElapsedRef.current += 1;
          // Update displayed time (for tap mode, we show elapsed time instead of remaining)
          setTimeRemaining(holdTimeElapsedRef.current);
        }, 1000);
        
        speakAnnouncement("Hold your breath. Tap when you need to breathe.");
      } else {
        speakAnnouncement("Hold your breath");
      }
    } else if (phase === 'hold' && !isTapMode) {
      // Only auto-transition for non-tap mode
      // Record the hold time for the current cycle
      recordHoldTime();
      
      // Move to next cycle or complete
      const nextCycleIndex = currentCycleIndex + 1;
      if (nextCycleIndex < cyclesRef.current.length) {
        // Move to next cycle
        const nextBreatheTime = cyclesRef.current[nextCycleIndex].breatheTime;
        setCurrentCycleIndex(nextCycleIndex);
        setPhase('breathe');
        setTimeRemaining(nextBreatheTime);
        setTotalPhaseTime(nextBreatheTime);
        setProgress(0);
        announcedTimesRef.current.clear(); // Reset announced times for new phase
        speakAnnouncement("Breathe");
        
        // Check if next cycle is tap mode
        setIsTapMode(!!cyclesRef.current[nextCycleIndex].tapMode);
      } else {
        // Complete the training
        setPhase('complete');
        setIsRunning(false);
        speakAnnouncement("Training complete");
        setCycleResults([...currentResultsRef.current]); // Set final results
        
        // Auto-save practice record when training is complete
        setTimeout(() => {
          if (user && activeTable) {
            savePracticeRecord();
          }
        }, 1000);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  }, [timeRemaining, phase, currentCycleIndex, isRunning, isTapMode, user, activeTable]);

  // Helper function to format time for announcement
  const formatTimeForAnnouncement = (seconds: number): string => {
    if (seconds === 60) return "1 minute";
    if (seconds > 60) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (secs === 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
      return `${minutes} minute${minutes > 1 ? 's' : ''} and ${secs} second${secs > 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  };

  // Timer tick function
  const tick = () => {
    // For tap mode during hold phase, don't decrease time
    if (isTapMode && phase === 'hold') {
      return;
    }
    
    setTimeRemaining((prevTime) => {
      const newTime = prevTime - 1;
      
      // Calculate progress percentage
      const progressValue = ((totalPhaseTime - newTime) / totalPhaseTime) * 100;
      setProgress(Math.min(progressValue, 100));

      // Handle announcements based on settings
      if (newTime > 0) {
        // Prevent multiple announcements for the same time value
        if (lastAnnouncedTimeRef.current !== newTime) {
          lastAnnouncedTimeRef.current = newTime;
          
          // For continuous countdown, only announce the number (e.g., "5")
          if (settings.useContinuousCountdown) {
            if (newTime <= settings.countdownStart && newTime > 0) {
              speakAnnouncement(newTime.toString());
              announcedTimesRef.current.add(newTime); // Mark as announced
            }
          } 
          
          // For specific time announcements, check if it's not already announced
          if (settings.useSpecificAnnouncements) {
            if (settings.announceTimes.includes(newTime) && !announcedTimesRef.current.has(newTime)) {
              announcedTimesRef.current.add(newTime);
              speakAnnouncement(formatTimeForAnnouncement(newTime));
            }
          }
        }
      }
      
      if (newTime === 0) {
        shouldTransitionRef.current = true;
      }
      
      return Math.max(newTime, 0);
    });
  };
  
  // Start timer with given cycles
  const startTimer = (trainingCycles: BreathCycle[]) => {
    if (trainingCycles.length === 0) return;
    
    // Mark that user has interacted - this helps with audio permissions
    setUserInteracted(true);
    
    // Initialize audio context if not already done
    initAudioContext();
    
    // Stop any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop any tap mode timer
    if (holdTimerIntervalRef.current) {
      clearInterval(holdTimerIntervalRef.current);
      holdTimerIntervalRef.current = null;
    }
    
    // Store cycles in ref for timer access
    cyclesRef.current = [...trainingCycles];
    setTotalCycles(trainingCycles.length);
    
    // Reset state for new timer
    setCurrentCycleIndex(0);
    setPhase('breathe');
    phaseTransitionPending.current = false;
    shouldTransitionRef.current = false;
    announcedTimesRef.current.clear(); // Reset announced times for new timer
    lastAnnouncedTimeRef.current = null; // Reset last announced time
    queuedAnnouncementsRef.current.clear(); // Reset queued announcements
    currentResultsRef.current = []; // Reset cycle results
    setCycleResults([]);
    
    // Check if first cycle is tap mode
    setIsTapMode(!!trainingCycles[0].tapMode);
    holdTimeElapsedRef.current = 0;
    
    const initialTime = trainingCycles[0].breatheTime;
    setTimeRemaining(initialTime);
    setTotalPhaseTime(initialTime);
    setProgress(0);
    setIsRunning(true);
    
    // Clear any pending speech and cancel current speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    pendingSpeechQueue.current = [];
    isSpeakingRef.current = false;
    
    // Announce the start with delay to ensure speech is ready
    setTimeout(() => {
      speakAnnouncement("Breathe");
    }, 500);
    
    // Start interval timer with 1 second intervals for accuracy
    timerRef.current = setInterval(tick, 1000);
  };
  
  // Pause timer
  const pauseTimer = () => {
    setIsRunning(false);
    speakAnnouncement("Paused");
    
    // Stop the main timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Also stop the tap mode elapsed time counter if active
    if (holdTimerIntervalRef.current) {
      clearInterval(holdTimerIntervalRef.current);
      holdTimerIntervalRef.current = null;
    }
  };
  
  // Resume timer
  const resumeTimer = () => {
    if (phase === 'complete' || phase === 'idle') return;
    
    setIsRunning(true);
    speakAnnouncement("Resuming");
    
    // Restart the main timer
    timerRef.current = setInterval(tick, 1000);
    
    // If in tap mode hold phase, restart the elapsed time counter
    if (isTapMode && phase === 'hold') {
      holdTimerIntervalRef.current = window.setInterval(() => {
        holdTimeElapsedRef.current += 1;
        setTimeRemaining(holdTimeElapsedRef.current);
      }, 1000);
    }
  };
  
  // Stop timer
  const stopTimer = (saveAsCompleted = false) => {
    // If we're in the middle of a session and saveAsCompleted is true,
    // save the current results and mark as complete
    if (saveAsCompleted && (phase === 'breathe' || phase === 'hold')) {
      // Record the current hold time if we're in hold phase
      if (phase === 'hold') {
        recordHoldTime();
      }
      
      // Set state to complete to show results
      setPhase('complete');
      setCycleResults([...currentResultsRef.current]);
      speakAnnouncement("Training complete");
    } else if (!saveAsCompleted) {
      // Reset to idle state
      setPhase('idle');
      setCurrentCycleIndex(0);
      currentResultsRef.current = [];
      setCycleResults([]);
    }
    
    // Common cleanup for both cases
    setIsRunning(false);
    setTimeRemaining(0);
    setProgress(0);
    phaseTransitionPending.current = false;
    shouldTransitionRef.current = false;
    announcedTimesRef.current.clear();
    lastAnnouncedTimeRef.current = null;
    queuedAnnouncementsRef.current.clear();
    setIsTapMode(false);
    holdTimeElapsedRef.current = 0;
    
    // Clear speech queue
    pendingSpeechQueue.current = [];
    
    if (speechSynthesisRef.current) {
      try {
        speechSynthesisRef.current.cancel();
        isSpeakingRef.current = false;
      } catch (e) {
        console.warn('Error canceling speech during stop:', e);
      }
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (holdTimerIntervalRef.current) {
      clearInterval(holdTimerIntervalRef.current);
      holdTimerIntervalRef.current = null;
    }
  };
  
  // Update timer settings
  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    // Always ensure voice is enabled
    const updatedSettings = { ...settings, ...newSettings, useVoice: true };
    setSettings(updatedSettings);
    
    // Save settings to localStorage for offline use
    localStorage.setItem('timerSettings', JSON.stringify(updatedSettings));
    
    // Clear any existing timeout to debounce saving to Supabase
    if (settingsSyncTimeoutRef.current) {
      clearTimeout(settingsSyncTimeoutRef.current);
    }
    
    // Save to Supabase with debounce
    settingsSyncTimeoutRef.current = window.setTimeout(() => {
      if (user) {
        saveSettingsToSupabase(updatedSettings);
      }
      settingsSyncTimeoutRef.current = null;
    }, 500); // 500ms debounce
  };
  
  // Save practice record to database
  const savePracticeRecord = async () => {
    if (!user || !activeTable || currentResultsRef.current.length === 0) {
      console.log("Cannot save practice record: missing user, active table, or results");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('practice_records')
        .insert([
          {
            user_id: user.id,
            table_id: activeTable.id,
            completed_at: new Date().toISOString(),
            results: JSON.stringify(currentResultsRef.current)
          }
        ]);
      
      if (error) {
        console.error("Error saving practice record:", error);
      } else {
        console.log("Practice record saved successfully");
      }
    } catch (error) {
      console.error("Exception saving practice record:", error);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (holdTimerIntervalRef.current) {
        clearInterval(holdTimerIntervalRef.current);
      }
      if (speechSynthesisRef.current) {
        try {
          speechSynthesisRef.current.cancel();
        } catch (e) {
          console.warn('Error during final cleanup:', e);
        }
      }
      if (settingsSyncTimeoutRef.current) {
        clearTimeout(settingsSyncTimeoutRef.current);
      }
    };
  }, []);
  
  const value = {
    phase,
    currentCycleIndex,
    timeRemaining,
    isRunning,
    totalPhaseTime,
    progress,
    settings,
    totalCycles,
    cycleResults,
    isTapMode,
    updateSettings,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    tapBreathHold,
    savePracticeRecord
  };
  
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};