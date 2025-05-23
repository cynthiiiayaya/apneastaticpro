import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { useTimer } from '../contexts/TimerContext';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useTimer();
  const navigate = useNavigate();
  
  const [countdownStart, setCountdownStart] = useState(settings.countdownStart);
  const [useContinuousCountdown, setUseContinuousCountdown] = useState(
    settings.useContinuousCountdown !== undefined ? settings.useContinuousCountdown : true
  );
  const [useSpecificAnnouncements, setUseSpecificAnnouncements] = useState(
    settings.useSpecificAnnouncements !== undefined ? settings.useSpecificAnnouncements : false
  );
  const [announceTimes, setAnnounceTimes] = useState(
    Array.isArray(settings.announceTimes) 
      ? [...settings.announceTimes]
      : [60, 30, 20, 10, 5]
  );
  
  const handleSave = () => {
    // Only sort the times when saving, not during editing
    const sortedTimes = [...announceTimes].sort((a, b) => b - a);
    
    // Save settings first
    updateSettings({
      countdownStart,
      useVoice: true,
      volume: settings.volume,
      useContinuousCountdown,
      useSpecificAnnouncements,
      announceTimes: sortedTimes,
    });
    
    // Wait a small amount of time to ensure settings are saved before navigating
    setTimeout(() => {
      navigate(-1); // Go back to previous page
    }, 100);
  };

  // Test the voice announcement
  const testVoice = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance("This is a voice test. 3, 2, 1...");
      utterance.volume = settings.volume;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Add a new announcement time
  const addAnnounceTime = () => {
    setAnnounceTimes(prev => {
      // Default to 30 seconds if not already present
      const newTime = prev.includes(30) ? 15 : 30;
      return [...prev, newTime];
    });
  };

  // Remove an announcement time
  const removeAnnounceTime = (time: number) => {
    setAnnounceTimes(prev => prev.filter(t => t !== time));
  };

  // Update a specific announcement time
  const updateAnnounceTime = (index: number, newValue: number) => {
    setAnnounceTimes(prev => {
      const updated = [...prev];
      updated[index] = newValue;
      return updated; // No sorting during editing
    });
  };
  
  return (
    <div>
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-ocean-300 hover:text-ocean-100"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-ocean-100 mt-2">Settings</h1>
      </div>
      
      <div className="bg-ocean-800/50 backdrop-blur rounded-lg shadow-lg border border-ocean-700/30 overflow-hidden">
        <div className="p-6 space-y-8">
          <h2 className="text-xl font-semibold text-ocean-100 mb-4">Timer Settings</h2>
          
          {/* Announcement types */}
          <div className="space-y-4">
            <h3 className="text-ocean-100 font-medium">Announcement Types</h3>
            
            {/* Continuous countdown toggle */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <div 
                  className="text-ocean-300 hover:text-seagreen-400"
                  onClick={() => setUseContinuousCountdown(!useContinuousCountdown)}
                >
                  {useContinuousCountdown ? 
                    <CheckSquare size={20} className="text-seagreen-400" /> : 
                    <Square size={20} />
                  }
                </div>
                <span className="text-ocean-100">Continuous Countdown</span>
              </label>
              
              {useContinuousCountdown && (
                <div className="mt-3 ml-7">
                  <label className="block text-ocean-200 mb-2">
                    Start Countdown (seconds before phase end)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={countdownStart}
                    onChange={(e) => setCountdownStart(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-ocean-400 text-sm mt-1">
                    <span>Off</span>
                    <span>{countdownStart} seconds</span>
                    <span>20s</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Specific time announcements toggle */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <div 
                  className="text-ocean-300 hover:text-seagreen-400"
                  onClick={() => setUseSpecificAnnouncements(!useSpecificAnnouncements)}
                >
                  {useSpecificAnnouncements ? 
                    <CheckSquare size={20} className="text-seagreen-400" /> : 
                    <Square size={20} />
                  }
                </div>
                <span className="text-ocean-100">Specific Time Announcements</span>
              </label>
              
              {useSpecificAnnouncements && (
                <div className="mt-3 ml-7">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-ocean-200">Announcement Times</label>
                    <button
                      onClick={addAnnounceTime}
                      className="text-seagreen-400 hover:text-seagreen-300 flex items-center text-sm"
                    >
                      <Plus size={14} className="mr-1" />
                      Add Time
                    </button>
                  </div>
                  
                  {announceTimes.length === 0 ? (
                    <p className="text-ocean-400 text-sm">No announcement times set.</p>
                  ) : (
                    <div className="space-y-2">
                      {announceTimes.map((time, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="600"
                            value={time}
                            onChange={(e) => updateAnnounceTime(index, parseInt(e.target.value) || 0)}
                            className="flex-1 bg-ocean-950 border border-ocean-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                          />
                          <div className="text-ocean-400 text-sm min-w-24">
                            {formatTimeToWords(time)}
                          </div>
                          <button
                            onClick={() => removeAnnounceTime(time)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Remove time"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-ocean-400 text-xs mt-2">
                    Set specific times (in seconds) for voice announcements
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={testVoice}
              className="mt-2 px-3 py-1 bg-ocean-700 hover:bg-ocean-600 text-white rounded text-sm"
            >
              Test Voice
            </button>
          </div>
        </div>
        
        <div className="border-t border-ocean-700 p-4 bg-ocean-800/50 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-seagreen-600 hover:bg-seagreen-500 text-white rounded flex items-center"
          >
            <Save size={16} className="mr-1" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function for formatting time
const formatTimeToWords = (seconds: number): string => {
  if (seconds === 60) return "1 minute";
  if (seconds > 60) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${minutes} minute${minutes > 1 ? 's' : ''} ${secs} sec${secs > 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
};

export default SettingsPage;