import { GoalModel, GoalType } from './goal';

export interface UserModel {
  Username: string;
  Email: string;
  Avatar: string;
  Level: number;
  Progress: Progress[];
  Goals: GoalModel[];
}

export interface Progress {
  Type: GoalType;
  Achieved: number;
  Total: number;
}

export enum FriendStatus {
  INVITING = 'INVITING',
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED'
}
