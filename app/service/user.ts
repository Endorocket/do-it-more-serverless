import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { CreateUserDTO } from '../model/dto/createUserDTO';
import { Indexes } from '../utils/indexes';
import { GoalType } from '../model/goal';
import { UpdateProgressDTO } from '../model/dto/updateProgressDTO';

export class UserService {
  constructor(private dynamodb: DocumentClient, private tableName: string) {
  }

  createUser(createUserDTO: CreateUserDTO): Request<DocumentClient.PutItemOutput, AWSError> {
    const params: DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: {
        PK: Indexes.userPK(createUserDTO.Username),
        SK: Indexes.userSK(createUserDTO.Username),
        Email: createUserDTO.Email,
        Avatar: createUserDTO.Avatar,
        Level: 1,
        Progress: [
          {
            Type: GoalType.HEALTH,
            Achieved: 20,
            Total: 30
          },
          {
            Type: GoalType.PHYSICAL,
            Achieved: 0,
            Total: 30
          },
          {
            Type: GoalType.MENTAL,
            Achieved: 0,
            Total: 30
          },
          {
            Type: GoalType.CULTURAL,
            Achieved: 0,
            Total: 30
          }
        ]
      }
    };
    return this.dynamodb.put(params);
  }

  updateProgress(updateProgressDTO: UpdateProgressDTO, username: string): Request<DocumentClient.PutItemOutput, AWSError> {
    return this.dynamodb.put({
      TableName: this.tableName,
      Item: {
        Level: updateProgressDTO.Level,
        Progress: updateProgressDTO.Progress
      },
      ConditionExpression: 'PK = :PK and SK = :SK',
      ExpressionAttributeValues: {
        ':PK': Indexes.userPK(username),
        ':SK': Indexes.userSK(username)
      },
    });
  }
}
