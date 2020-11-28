export interface GoalModel {
  id: string;
  name: string;
  type: GoalType;
  frequency: Frequency;
  doneTimes: number;
  totalTimes: number;
  points: number;
}

export enum GoalType {
  HEALTH = 'HEALTH',
  PHYSICAL = 'PHYSICAL',
  MENTAL = 'MENTAL',
  CULTURAL = 'CULTURAL'
}

export enum Frequency {
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  DAILY = 'DAILY'
}
