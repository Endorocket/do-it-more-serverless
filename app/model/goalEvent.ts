import { GoalType } from './goal';

export class GoalEventModel {
  goalInfo: GoalInfo;
  events: Event[];
}

export class GoalInfo {
  goalId: string;
  goalName: string;
  icon: string;
  type: GoalType;
  points: number;
}

export class Event {
  date: string;
  times: number;
}
