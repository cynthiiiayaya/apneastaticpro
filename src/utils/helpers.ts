// Generate a random ID for tables
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Format seconds to mm:ss
export const formatTime = (seconds: number): string => {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format seconds to human readable
export const formatTimeToWords = (seconds: number): string => {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins === 0) {
    return `${secs} seconds`;
  } else if (mins === 1) {
    return secs === 0 ? '1 minute' : `1 minute ${secs} seconds`;
  } else {
    return secs === 0 ? `${mins} minutes` : `${mins} minutes ${secs} seconds`;
  }
};

// Validate breath cycle data
export const validateCycle = (breathe: number, hold: number): string | null => {
  if (isNaN(breathe) || isNaN(hold)) {
    return 'Breathe and hold times must be numbers';
  }
  
  if (breathe <= 0 || hold <= 0) {
    return 'Breathe and hold times must be greater than 0';
  }
  
  if (breathe > 300 || hold > 300) {
    return 'Breathe and hold times cannot exceed 5 minutes (300 seconds)';
  }
  
  return null;
};