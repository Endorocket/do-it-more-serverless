export interface GoalModel {
  GoalId: string;
  GoalName: string;
  GoalType: GoalType;
  Frequency: Frequency;
  DoneTimes: number;
  TotalTimes: number;
  Points: number;
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
