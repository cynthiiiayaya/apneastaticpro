import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, Hand as HandStop } from 'lucide-react';
import { useTimer } from '../contexts/TimerContext';
import { formatTime } from '../utils/helpers';
import StopConfirmationDialog from './StopConfirmationDialog';

const Timer: React.FC = () => {
  const { 
    phase, 
    timeRemaining, 
    isRunning, 
    progress,
    currentCycleIndex,
    totalCycles,
    pauseTimer, 
    resumeTimer, 
    stopTimer,
    tapBreathHold,
    isTapMode
  } = useTimer();
  
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const wakeLockRef = useRef<any>(null);
  
  // Wake Lock API to prevent screen from sleeping
  useEffect(() => {
    const requestWakeLock = async () => {
      if (isRunning && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock is active');

          wakeLockRef.current.addEventListener('release', () => {
            console.log('Wake Lock was released');
            wakeLockRef.current = null;
          });
        } catch (err) {
          console.error(`Error requesting Wake Lock: ${err}`);
        }
      }
    };

    const releaseWakeLock = () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
          .then(() => {
            wakeLockRef.current = null;
            console.log('Wake Lock released');
          })
          .catch((err: any) => {
            console.error(`Error releasing Wake Lock: ${err}`);
          });
      }
    };

    if (isRunning) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Cleanup: make sure to release wake lock when component unmounts
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
          .catch((err: any) => {
            console.error(`Error releasing Wake Lock during cleanup: ${err}`);
          });
      }
    };
  }, [isRunning]);

  // Reacquire wake lock when page visibility changes (e.g., user switches tabs and returns)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isRunning && !wakeLockRef.current && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock reacquired after visibility change');
        } catch (err) {
          console.error(`Error reacquiring Wake Lock: ${err}`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning]);
  
  // Determine the color based on the current phase
  const getPhaseColor = () => {
    switch (phase) {
      case 'breathe':
        return {
          bg: 'bg-seagreen-500',
          text: 'text-seagreen-500',
          ring: 'ring-seagreen-500',
        };
      case 'hold':
        return {
          bg: 'bg-ocean-500',
          text: 'text-ocean-500',
          ring: 'ring-ocean-500',
        };
      case 'complete':
        return {
          bg: 'bg-purple-500',
          text: 'text-purple-500',
          ring: 'ring-purple-500',
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-gray-500',
          ring: 'ring-gray-500',
        };
    }
  };
  
  const colors = getPhaseColor();
  
  // Display appropriate message based on the current phase
  const getPhaseMessage = () => {
    switch (phase) {
      case 'breathe':
        return 'BREATHE';
      case 'hold':
        return isTapMode ? 'HOLD - TAP WHEN DONE' : 'HOLD';
      case 'complete':
        return 'COMPLETE';
      default:
        return 'READY';
    }
  };
  
  const handleStopClick = () => {
    if (phase === 'complete') {
      // If already complete, just stop
      stopTimer();
    } else {
      // Show confirmation dialog
      pauseTimer(); // Pause timer while dialog is shown
      setShowStopConfirmation(true);
    }
  };
  
  if (phase === 'idle') {
    return null;
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-6">
      {/* Phase indicator */}
      <div className={`${colors.text} text-2xl font-bold mb-4 text-center`}>
        {getPhaseMessage()}
      </div>
      
      {/* Current cycle indicator */}
      {phase !== 'complete' && (
        <div className="text-ocean-300 mb-2">
          Cycle {currentCycleIndex + 1} of {totalCycles}
        </div>
      )}
      
      {/* Timer display */}
      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mb-8">
        {/* Background circle */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          
          {/* Progress arc - only show for non-tap mode or breathe phase */}
          {(progress > 0 && (!isTapMode || phase !== 'hold')) && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={colors.bg}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 45 * progress / 100} ${2 * Math.PI * 45 * (100 - progress) / 100}`}
              strokeDashoffset="0"
              transform="rotate(-90 50 50)"
            />
          )}
          
          {/* Full circle for tap mode during hold phase */}
          {(isTapMode && phase === 'hold') && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={colors.bg}
              strokeWidth="8"
              strokeOpacity="0.7"
              strokeDasharray="3 2"
            />
          )}
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          {(isTapMode && phase === 'hold') ? (
            <div 
              className="w-full h-full rounded-full flex items-center justify-center bg-ocean-800 border-4 border-ocean-500 cursor-pointer hover:bg-ocean-700 active:bg-ocean-600 transition-colors"
              onClick={tapBreathHold}
            >
              <div className="flex flex-col items-center">
                <span className="text-3xl mb-2">{formatTime(timeRemaining)}</span>
                <HandStop size={24} className="text-ocean-300 mb-1" />
                <span className="text-sm text-ocean-300">TAP WHEN DONE</span>
              </div>
            </div>
          ) : (
            <>
              <span className="text-5xl font-bold">{formatTime(timeRemaining)}</span>
              <span className={`text-lg mt-2 ${phase === 'breathe' ? 'text-seagreen-400' : 'text-ocean-400'}`}>
                {phase === 'breathe' ? 'BREATHE' : phase === 'hold' ? 'HOLD' : 'COMPLETE'}
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Control buttons */}
      <div className="flex gap-4">
        {isRunning ? (
          <button 
            onClick={pauseTimer}
            className="bg-ocean-700 hover:bg-ocean-600 text-white p-4 rounded-full"
          >
            <Pause size={24} />
          </button>
        ) : (
          <button 
            onClick={resumeTimer}
            className="bg-seagreen-600 hover:bg-seagreen-500 text-white p-4 rounded-full"
          >
            <Play size={24} />
          </button>
        )}
        
        <button 
          onClick={handleStopClick}
          className="bg-red-700 hover:bg-red-600 text-white p-4 rounded-full"
        >
          <Square size={24} />
        </button>
        
        {phase === 'complete' && (
          <button 
            onClick={() => stopTimer()}
            className="bg-purple-700 hover:bg-purple-600 text-white p-4 rounded-full"
          >
            <RotateCcw size={24} />
          </button>
        )}
        
        {(isTapMode && phase === 'hold') && (
          <button 
            onClick={tapBreathHold}
            className="bg-ocean-600 hover:bg-ocean-500 text-white p-4 rounded-full"
          >
            <HandStop size={24} />
          </button>
        )}
      </div>
      
      {/* Stop confirmation dialog */}
      <StopConfirmationDialog 
        isOpen={showStopConfirmation} 
        onClose={() => setShowStopConfirmation(false)} 
      />
    </div>
  );
};

export default Timer;