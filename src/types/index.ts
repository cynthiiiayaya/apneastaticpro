export interface BreathCycle {
  breatheTime: number; // in seconds
  holdTime: number; // in seconds
  tapMode?: boolean; // if true, holdTime is just an estimate, user will tap to end
}

export interface TrainingTable {
  id: string;
  name: string;
  cycles: BreathCycle[];
  createdAt: number;
}

export interface TimerSettings {
  countdownStart: number; // seconds before phase end to start countdown
  useVoice: boolean;
  volume: number; // 0 to 1
  useContinuousCountdown: boolean; // use continuous countdown
  useSpecificAnnouncements: boolean; // use specific time announcements
  announceTimes: number[]; // array of times in seconds to announce (e.g. [60, 30, 20, 10])
}

export type TimerPhase = 'breathe' | 'hold' | 'idle' | 'complete';

export interface CycleResult {
  cycleIndex: number;
  breatheTime: number;
  holdTime: number;
  actualHoldTime: number;
  wasTapMode?: boolean;
}

export interface PracticeRecord {
  id: string;
  tableId: string;
  tableName: string;
  completedAt: number;
  results: CycleResult[];
}