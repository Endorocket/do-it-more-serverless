import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { AWSError, Request } from 'aws-sdk';

export class GoalsService {
  constructor(private dynamodb: DocumentClient, private tableName: string) {
  }

  public findGoalsByUsername(username: string): Request<DocumentClient.QueryOutput, AWSError> {
    const params: DocumentClient.QueryInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :userPK and begins_with(SK, :userGoal)',
      ExpressionAttributeValues: {
        ':userPK': `USER#${ username }`,
        ':userGoal': `GOAL#`,
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
        ':userPK': `USER#${ username }`,
        ':userSK': `USER#${ username }`
      },
      Limit: 1
    };

    return this.dynamodb.query(params);
  }
}
