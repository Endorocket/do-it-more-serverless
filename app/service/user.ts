import { AWSError, Request } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { CreateUserDTO } from '../model/dto/createUserDTO';
import { Indexes } from '../utils/indexes';
import { GoalType } from '../model/goal';
import { UpdateProgressDTO } from '../model/dto/updateProgressDTO';
import { FriendModel, FriendStatus } from '../model/user';
import { Status } from '../model/vo/responseVo';
import { RespondToFriendInvitationDTO } from '../model/dto/respondToFriendInvitationDTO';
import { ResponseType } from '../model/dto/responseType';
import { TeamGoal, TeamMember, TeamModel } from '../model/team';
import { FriendsAndTeamsModel } from '../model/friendsAndTeams';
import { PeriodUtils } from '../utils/period';

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
    const progress = updateProgressDTO.progress.map(singleProgress => {
      return {
        Type: singleProgress.type,
        Achieved: singleProgress.achieved,
        Total: singleProgress.total
      };
    });
    return this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        PK: Indexes.userPK(username),
        SK: Indexes.userSK(username)
      },
      UpdateExpression: 'SET #level = :level, Progress = :progress',
      ExpressionAttributeNames: {
        '#level': 'Level'
      },
      ExpressionAttributeValues: {
        ':level': updateProgressDTO.level,
        ':progress': progress
      }
    });
  }

  async inviteFriend(friendName: string, username: string): Promise<void> {
    const friendToInvite = await this.dynamodb.get({
      TableName: this.tableName,
      Key: {
        PK: Indexes.userPK(friendName),
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
        Username: friendName,
        Status: FriendStatus.INVITED
      },
    }).promise();
    await this.dynamodb.put({
      TableName: this.tableName,
      Item: {
        PK: Indexes.friendPK(friendName),
        SK: Indexes.friendSK(username),
        Username: username,
        Status: FriendStatus.INVITING
      },
    }).promise();
  }

  async respondToFriendInvitation(respondToFriendInvitationDTO: RespondToFriendInvitationDTO, friendUsername: string, username: string): Promise<void> {
    const friendToRespond = await this.dynamodb.get({
      TableName: this.tableName,
      Key: {
        PK: Indexes.userPK(friendUsername),
        SK: Indexes.userSK(friendUsername)
      },
    }).promise();
    if (!friendToRespond.Item) {
      throw new Error(Status.NOT_FOUND);
    }
    if (respondToFriendInvitationDTO.invitationResponse === ResponseType.ACCEPT) {
      await this.acceptFriendInvitation(username, friendUsername);
      await this.acceptFriendInvitation(friendUsername, username);
    } else {
      await this.deleteFriend(username, friendUsername);
      await this.deleteFriend(friendUsername, username);
    }
  }

  private async acceptFriendInvitation(username: string, friendName: string): Promise<void> {
    const acceptFriendOutput = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        PK: Indexes.friendPK(username),
        SK: Indexes.friendSK(friendName)
      },
      UpdateExpression: 'SET #invStatus = :status',
      ExpressionAttributeNames: {
        '#invStatus': 'Status'
      },
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

  async getFriendsAndTeams(username: string): Promise<FriendsAndTeamsModel> {
    const friendModels: FriendModel[] = await this.getFriends(username);
    const teamModels: TeamModel[] = await this.getTeams(username);
    return {
      friends: friendModels,
      teams: teamModels
    };
  }

  private async getFriends(username: string): Promise<FriendModel[]> {
    const friends = await this.dynamodb.query({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :username and begins_with(SK, :friend)',
      ExpressionAttributeValues: {
        ':username': Indexes.friendPK(username),
        ':friend': Indexes.FRIEND_PREFIX
      }
    }).promise();
    const friendModels: FriendModel[] = [];
    for (const friendItem of friends.Items) {
      const friendData = await this.findUserByUsername(friendItem.Username).promise();
      const friendDetails = friendData.Items[0];
      const progress = friendDetails.Progress.map(singleProgress => {
        return {
          type: singleProgress.Type,
          achieved: singleProgress.Achieved,
          total: singleProgress.Total
        };
      });
      friendModels.push({
        username: friendItem.Username,
        status: friendItem.Status,
        avatar: friendDetails.Avatar,
        level: friendDetails.Level,
        progress
      });
    }
    return friendModels;
  }

  private async getTeams(username: string): Promise<TeamModel[]> {
    const teams = await this.dynamodb.query({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :username and begins_with(GSI1SK, :team)',
      ExpressionAttributeValues: {
        ':username': Indexes.teamGSI1PK(username),
        ':team': Indexes.TEAM_PREFIX
      }
    }).promise();
    const teamModels: TeamModel[] = [];
    for (const teamItem of teams.Items) {
      const teamId: string = teamItem.TeamId;
      const teamInfo: TeamModel = await this.getTeamInfo(teamId);
      teamModels.push(teamInfo);
    }
    return teamModels;
  }

  private async getTeamInfo(teamId: string): Promise<TeamModel> {
    const now = new Date();
    const usersInTeam = await this.dynamodb.query({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :teamId and begins_with(SK, :user)',
      ExpressionAttributeValues: {
        ':teamId': Indexes.teamPK(teamId),
        ':user': Indexes.USER_PREFIX
      }
    }).promise();
    const goalsInTeam = await this.dynamodb.query({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :teamId and begins_with(GSI1SK, :user)',
      ExpressionAttributeValues: {
        ':teamId': Indexes.goalGSI1PK(teamId),
        ':user': Indexes.USER_PREFIX
      }
    }).promise();
    const teamMembersByUsername: Map<string, TeamMember> = new Map<string, TeamMember>();
    for (const userInTeam of usersInTeam.Items) {
      const username: string = userInTeam.Username;
      const avatar: string = await this.getAvatar(username);
      teamMembersByUsername.set(username, {
        name: username,
        avatar,
        status: userInTeam.Status
      });
    }
    let goal: TeamGoal;
    for (const goalInTeam of goalsInTeam.Items) {
      const username: string = goalInTeam.PK.split('#')[1];
      const teamMember = teamMembersByUsername.get(username);
      const periodOfYear = PeriodUtils.getPeriodOfYear(goalInTeam.Frequency, now);
      if (Indexes.periodSK(now.getFullYear(), periodOfYear) !== goalInTeam.CurrentPeriodPattern) {
        teamMember.doneTimes = 0;
      } else {
        teamMember.doneTimes = goalInTeam.DoneTimes;
      }
      teamMember.totalTimes = goalInTeam.TotalTimes;
      if (goal === undefined) {
        goal = {
          name: goalInTeam.GoalName,
          icon: goalInTeam.Icon,
          type: goalInTeam.GoalType,
          frequency: goalInTeam.Frequency
        };
      }
    }
    return {
      id: teamId,
      goal,
      members: Array.from(teamMembersByUsername.values())
    };
  }

  private async getAvatar(username: string): Promise<string> {
    const userAvatar = await this.dynamodb.get({
      TableName: this.tableName,
      Key: {
        PK: Indexes.userPK(username),
        SK: Indexes.userSK(username)
      },
      ProjectionExpression: 'Avatar'
    }).promise();
    return userAvatar.Item.Avatar;
  }
}
