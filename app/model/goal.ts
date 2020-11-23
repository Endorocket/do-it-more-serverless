export interface GoalModel {
  GoalId: string;
  GoalName: string;
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
