import { GoalModel, GoalType } from './goal';

export interface FriendModel {
  username: string;
  avatar: string;
  level: number;
  progress: Progress[];
}

export interface UserModel extends FriendModel {
  goals?: GoalModel[];
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
