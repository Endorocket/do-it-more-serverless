import { GoalModel, GoalType } from './goal';

export interface UserModel {
  username: string;
  avatar: string;
  level: number;
  progress: Progress[];
  goals: GoalModel[];
}

export interface Progress {
  type: GoalType;
  achieved: number;
  total: number;
}

export enum FriendStatus {
  INVITING = 'INVITING',
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED'
}
