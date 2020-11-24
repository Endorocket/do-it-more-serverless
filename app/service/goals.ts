import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { AWSError, Request } from 'aws-sdk';
import { CreateGoalDTO } from '../model/dto/createGoalDTO';
import { v4 as uuidv4 } from 'uuid';

export class GoalsService {
  constructor(private dynamodb: DocumentClient, private tableName: string) {
  }

  private static readonly USER_PREFIX = 'USER#';
  private static readonly GOAL_PREFIX = 'GOAL#';

  private static userPK(username: string): string {
    return GoalsService.USER_PREFIX + username;
  }

  private static userSK(username: string): string {
    return GoalsService.USER_PREFIX + username;
  }

  private static goalSK(goalId: string): string {
    return GoalsService.GOAL_PREFIX + goalId;
  }

  public findGoalsByUsername(username: string): Request<DocumentClient.QueryOutput, AWSError> {
    const params: DocumentClient.QueryInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :userPK and begins_with(SK, :userGoal)',
      ExpressionAttributeValues: {
        ':userPK': GoalsService.userPK(username),
        ':userGoal': GoalsService.GOAL_PREFIX,
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
        ':userPK': GoalsService.userPK(username),
        ':userSK': GoalsService.userSK(username)
      },
      Limit: 1
    };
    return this.dynamodb.query(params);
  }

  public createGoal(createGoalDTO: CreateGoalDTO, username: string): Request<DocumentClient.PutItemOutput, AWSError> {
    const goalId: string = uuidv4();
    const params: DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: {
        PK: GoalsService.userPK(username),
        SK: GoalsService.goalSK(goalId),
        GoalId: goalId,
        GoalName: createGoalDTO.GoalName,
        GoalType: createGoalDTO.GoalType,
        Frequency: createGoalDTO.Frequency,
        DoneTimes: 0,
        TotalTimes: createGoalDTO.TotalTimes,
        Points: createGoalDTO.Points
      }
    };
    return this.dynamodb.put(params);
  }
}