import { Handler } from 'aws-lambda';
import dotenv from 'dotenv';
import path from 'path';

const dotenvPath = path.join(__dirname, '../', `config/.env.${ process.env.NODE_ENV }`);
dotenv.config({ path: dotenvPath });

import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { GoalsService } from './service/goals';
import { GoalsController } from './controller/goals';

const dynamodb = new DocumentClient({ region: 'eu-central-1' });
const tableName = process.env.GOALS_TABLE;

const goalsService = new GoalsService(dynamodb, tableName);
const goalsController = new GoalsController(goalsService);

export const findGoal: Handler = (event: any) => {
  return goalsController.findUserWithGoals(event);
};
