import { Frequency, GoalType } from '../goal';

export class CreateGoalDTO {
  GoalName: string;
  GoalType: GoalType;
  Frequency: Frequency;
  TotalTimes: number;
  Points: number;
}
