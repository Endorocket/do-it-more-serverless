import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { CreateUserDTO } from '../model/dto/createUserDTO';
import { Indexes } from '../utils/indexes';
import { GoalType } from '../model/goal';
import { UpdateProgressDTO } from '../model/dto/updateProgressDTO';
import { FriendStatus } from '../model/user';
import { Status } from '../model/vo/responseVo';
import { RespondToFriendInvitationDTO } from '../model/dto/respondToFriendInvitationDTO';
import { ResponseType } from '../model/dto/responseType';

export class UserService {
  constructor(private dynamodb: DocumentClient, private tableName: string) {
  }

  findUserByUsername(username: string): Request<DocumentClient.QueryOutput, AWSError> {
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

  createUser(createUserDTO: CreateUserDTO): Request<DocumentClient.PutItemOutput, AWSError> {
    const params: DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: {
        PK: Indexes.userPK(createUserDTO.username),
        SK: Indexes.userSK(createUserDTO.username),
        Username: createUserDTO.username,
        Avatar: createUserDTO.avatar,
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
        Level: updateProgressDTO.level,
        Progress: updateProgressDTO.progress
      },
      ConditionExpression: 'PK = :PK and SK = :SK',
      ExpressionAttributeValues: {
        ':PK': Indexes.userPK(username),
        ':SK': Indexes.userSK(username)
      },
    });
  }

  async inviteFriend(friendName: string, username: string): Promise<void> {
    const friendToInvite = await this.dynamodb.get({
      TableName: this.tableName,
      Key: {
        PK: Indexes.userPK(username),
        SK: Indexes.userSK(friendName)
      },
    }).promise();
    if (!friendToInvite.Item) {
      throw new Error(Status.NOT_FOUND);
    }
    await this.dynamodb.put({
      TableName: this.tableName,
      Item: {
        PK: Indexes.friendPK(username),
        SK: Indexes.friendSK(friendName),
        Status: FriendStatus.INVITED
      },
    }).promise();
    await this.dynamodb.put({
      TableName: this.tableName,
      Item: {
        PK: Indexes.friendPK(friendName),
        SK: Indexes.friendSK(username),
        Status: FriendStatus.INVITING
      },
    }).promise();
  }

  async respondToFriendInvitation(respondToFriendInvitationDTO: RespondToFriendInvitationDTO, username: string): Promise<void> {
    const friendToRespond = await this.dynamodb.get({
      TableName: this.tableName,
      Key: {
        PK: Indexes.userPK(respondToFriendInvitationDTO.friendUsername),
        SK: Indexes.userSK(respondToFriendInvitationDTO.friendUsername)
      },
    }).promise();
    if (!friendToRespond.Item) {
      throw new Error(Status.NOT_FOUND);
    }
    if (respondToFriendInvitationDTO.invitationResponse === ResponseType.ACCEPT) {
      await this.acceptFriendInvitation(username, respondToFriendInvitationDTO.friendUsername);
      await this.acceptFriendInvitation(respondToFriendInvitationDTO.friendUsername, username);
    } else {
      await this.deleteFriend(username, respondToFriendInvitationDTO.friendUsername);
      await this.deleteFriend(respondToFriendInvitationDTO.friendUsername, username);
    }
  }

  private async acceptFriendInvitation(username: string, friendName: string): Promise<void> {
    const acceptFriendOutput = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        PK: Indexes.friendPK(username),
        SK: Indexes.friendSK(friendName)
      },
      UpdateExpression: 'SET Status = :status',
      ExpressionAttributeValues: {
        ':status': 'ACCEPTED'
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    console.log(acceptFriendOutput);
  }

  private async deleteFriend(username: string, friendName: string): Promise<void> {
    await this.dynamodb.delete({
      TableName: this.tableName,
      Key: {
        PK: Indexes.friendPK(username),
        SK: Indexes.friendSK(friendName)
      }
    }).promise();
  }
}
