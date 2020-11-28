import { Frequency, GoalType } from '../goal';

export interface CreateGoalDTO {
  goalName: string;
  goalType: GoalType;
  icon: string;
  frequency: Frequency;
  totalTimes: number;
  points: number;
  teamId?: string;
}
