import { GoalType } from './goal';

export interface TeamModel {
  id: string;
  goal: TeamGoal;
  members: TeamMember[];
}

export interface TeamGoal {
  name: string;
  icon: string;
  type: GoalType;
}

export interface TeamMember {
  name: string;
  avatar: string;
  status: string;
  doneTimes?: number;
  totalTimes?: number;
}
