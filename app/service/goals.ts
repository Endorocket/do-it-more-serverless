import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { AWSError, Request } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as DateUtils from 'date-fns';

import { CreateGoalDTO } from '../model/dto/createGoalDTO';
import { CompleteGoalDTO } from '../model/dto/completeGoalDTO';
import { Indexes } from '../utils/indexes';
import { DatesUtil } from '../utils/dates';

export class GoalsService {
  constructor(private dynamodb: DocumentClient, private tableName: string) {
  }

  public findGoalsByUsername(username: string): Request<DocumentClient.QueryOutput, AWSError> {
    const params: DocumentClient.QueryInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :userPK and begins_with(SK, :userGoal)',
      ExpressionAttributeValues: {
        ':userPK': Indexes.userPK(username),
        ':userGoal': Indexes.GOAL_PREFIX,
      },
      Limit: 20
    };
    return this.dynamodb.query(params);
  }

  public findUserByUsername(username: string): Request<DocumentClient.QueryOutput, AWSError> {
    const params: DocumentClient.QueryInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :userPK and SK = :userSK',
      ExpressionAttributeValues: {
        ':userPK': Indexes.userPK(username),
        ':userSK': Indexes.userSK(username)
      },
      Limit: 1
    };
    return this.dynamodb.query(params);
  }

  public async createGoal(createGoalDTO: CreateGoalDTO, username: string): Promise<void> {
    const now = new Date();
    const goalId: string = uuidv4();
    const createGoalOutput = await this.dynamodb.put({
      TableName: this.tableName,
      Item: {
        PK: Indexes.goalPK(username),
        SK: Indexes.goalSK(goalId),
        GoalId: goalId,
        GoalName: createGoalDTO.GoalName,
        GoalType: createGoalDTO.GoalType,
        Frequency: createGoalDTO.Frequency,
        DoneTimes: 0,
        TotalTimes: createGoalDTO.TotalTimes,
        Points: createGoalDTO.Points
      },
      ReturnValues: 'ALL_OLD'
    }).promise();
    console.log(createGoalOutput);
    const periodOfYear = DatesUtil.getPeriodOfYear(createGoalDTO.Frequency, now);
    console.log(periodOfYear);
    const createPeriodOutput = await this.dynamodb.put({
      TableName: this.tableName,
      Item: {
        PK: Indexes.periodPK(goalId),
        SK: Indexes.periodSK(now.getFullYear(), periodOfYear),
        DoneTimes: 0,
        Events: {}
      },
      ReturnValues: 'ALL_OLD'
    }).promise();
    console.log(createPeriodOutput);
  }

  public async completeGoal(completeGoalDTO: CompleteGoalDTO, goalId: string, username: string): Promise<void> {
    const now = new Date();
    console.log(DateUtils.getHours(now));
    const goalOutput = await this.dynamodb.get({
      TableName: this.tableName,
      Key: {
        PK: Indexes.goalPK(username),
        SK: Indexes.goalSK(goalId)
      }
    }).promise();
    const goal = goalOutput.Item;
    if (!goal) {
      throw new Error('Goal not found');
    }
    const periodOfYear = DatesUtil.getPeriodOfYear(goal.Frequency, now);
    const updateOutput = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        PK: Indexes.periodPK(goalId),
        SK: Indexes.periodSK(now.getFullYear(), periodOfYear)
      },
      UpdateExpression: 'ADD DoneTimes :times, #events.#eventIndex :times',
      ExpressionAttributeNames: {
        '#events': 'Events',
        '#eventIndex': `${now.getFullYear()}-${now.getMonth()}-${now.getDay()}`
      },
      ExpressionAttributeValues: {
        ':times': completeGoalDTO.Times
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    console.log(updateOutput);
  }
}
