import React from 'react';

interface TimeInputProps {
  value: number; // Total time in seconds
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const TimeInput: React.FC<TimeInputProps> = ({ 
  value, 
  onChange, 
  label,
  min = 1,
  max = 300,
  disabled = false
}) => {
  // Convert total seconds to minutes and seconds
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = parseInt(e.target.value, 10) || 0;
    const newTotalSeconds = (newMinutes * 60) + seconds;
    
    // Ensure total is within bounds
    const boundedValue = Math.min(Math.max(newTotalSeconds, min), max);
    onChange(boundedValue);
  };
  
  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSeconds = parseInt(e.target.value, 10) || 0;
    // Ensure seconds are between 0-59
    const boundedSeconds = Math.min(Math.max(newSeconds, 0), 59);
    const newTotalSeconds = (minutes * 60) + boundedSeconds;
    
    // Ensure total is within bounds
    const boundedValue = Math.min(Math.max(newTotalSeconds, min), max);
    onChange(boundedValue);
  };

  return (
    <div>
      <label className="block text-ocean-300 text-sm mb-1">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="w-1/2">
          <input
            type="number"
            min="0"
            max="5"
            value={minutes}
            onChange={handleMinutesChange}
            className={`w-full bg-ocean-950 border border-ocean-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-seagreen-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder="Min"
            disabled={disabled}
          />
          <div className="text-xs text-ocean-400 mt-1">Minutes</div>
        </div>
        <div className="w-1/2">
          <input
            type="number"
            min="0"
            max="59"
            value={seconds}
            onChange={handleSecondsChange}
            className={`w-full bg-ocean-950 border border-ocean-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-seagreen-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder="Sec"
            disabled={disabled}
          />
          <div className="text-xs text-ocean-400 mt-1">Seconds</div>
        </div>
      </div>
    </div>
  );
};

export default TimeInput;