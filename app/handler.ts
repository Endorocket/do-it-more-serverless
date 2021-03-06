import { Handler } from 'aws-lambda';
import dotenv from 'dotenv';
import path from 'path';

const dotenvPath = path.join(__dirname, '../', `config/.env.${process.env.NODE_ENV}`);
dotenv.config({ path: dotenvPath });

import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { UserService } from './service/user';
import { GoalsService } from './service/goals';
import { AuthController } from './controller/auth';
import { UserController } from './controller/user';
import { GoalsController } from './controller/goals';

const dynamodb = new DocumentClient({ region: 'eu-central-1' });
const tableName = process.env.GOALS_TABLE;

const userService = new UserService(dynamodb, tableName);
const goalsService = new GoalsService(dynamodb, tableName);

const authController = new AuthController();
const userController = new UserController(userService);
const goalsController = new GoalsController(goalsService, userService);

export const preSignUpTrigger: Handler = (event: any) => {
  return authController.preSignUp(event);
};

export const postConfirmationTrigger: Handler = (event: any) => {
  return userController.createUser(event);
};

export const findUserWithGoals: Handler = (event: any) => {
  return goalsController.findUserWithGoals(event);
};

export const createGoal: Handler = (event: any) => {
  return goalsController.createGoal(event);
};

export const completeGoal: Handler = (event: any) => {
  return goalsController.completeGoal(event);
};

export const updatePeriods: Handler = (event: any) => {
  return goalsController.updatePeriods(event);
};

export const updateProgress: Handler = (event: any) => {
  return userController.updateProgress(event);
};

export const inviteFriend: Handler = (event: any) => {
  return userController.inviteFriend(event);
};

export const respondToFriendInvitation: Handler = (event: any) => {
  return userController.respondToFriendInvitation(event);
};

export const inviteToTeam: Handler = (event: any) => {
  return goalsController.inviteToTeam(event);
};

export const respondToTeamInvitation: Handler = (event: any) => {
  return goalsController.respondToTeamInvitation(event);
};

export const getFriendsAndTeams: Handler = (event: any) => {
  return userController.getFriendsAndTeams(event);
};

export const getGoalEvents: Handler = (event: any) => {
  return goalsController.getGoalEvents(event);
};
