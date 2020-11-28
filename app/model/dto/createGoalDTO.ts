import { Frequency, GoalType } from '../goal';

export interface CreateGoalDTO {
  goalName: string;
  goalType: GoalType;
  frequency: Frequency;
  totalTimes: number;
  points: number;
  teamId?: string;
}
