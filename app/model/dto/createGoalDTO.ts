import { Frequency, GoalType } from '../goal';

export interface CreateGoalDTO {
  GoalName: string;
  GoalType: GoalType;
  Frequency: Frequency;
  TotalTimes: number;
  Points: number;
}
