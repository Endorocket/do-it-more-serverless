import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { AWSError, Request } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as DateUtils from 'date-fns';

import { CreateGoalDTO } from '../model/dto/createGoalDTO';
import { CompleteGoalDTO } from '../model/dto/completeGoalDTO';
import { Indexes } from '../utils/indexes';
import { DatesUtil } from '../utils/dates';
import { ResponseType } from '../model/dto/responseType';
import { Status } from '../model/vo/responseVo';

export class GoalsService {
  constructor(private dynamodb: DocumentClient, private tableName: string) {
  }

  findGoalsByUsername(username: string): Request<DocumentClient.QueryOutput, AWSError> {
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

  async createGoal(createGoalDTO: CreateGoalDTO, username: string): Promise<void> {
    const now = new Date();
    const goalId: string = uuidv4();
    if (createGoalDTO.teamId) {

    }
    const createGoalParams = createGoalDTO.teamId
      ? {
        TableName: this.tableName,
        Item: {
          PK: Indexes.goalPK(username),
          SK: Indexes.goalSK(goalId),
          GoalId: goalId,
          GoalName: createGoalDTO.goalName,
          GoalType: createGoalDTO.goalType,
          Icon: createGoalDTO.icon,
          Frequency: createGoalDTO.frequency,
          DoneTimes: 0,
          TotalTimes: createGoalDTO.totalTimes,
          Points: createGoalDTO.points,
          GSI1PK: Indexes.goalGSI1PK(createGoalDTO.teamId),
          GSI1SK: Indexes.goalGSI1SK(username)
        },
        ReturnValues: 'ALL_OLD'
      }
      : {
        TableName: this.tableName,
        Item: {
          PK: Indexes.goalPK(username),
          SK: Indexes.goalSK(goalId),
          GoalId: goalId,
          GoalName: createGoalDTO.goalName,
          GoalType: createGoalDTO.goalType,
          Icon: createGoalDTO.icon,
          Frequency: createGoalDTO.frequency,
          DoneTimes: 0,
          TotalTimes: createGoalDTO.totalTimes,
          Points: createGoalDTO.points
        },
        ReturnValues: 'ALL_OLD'
      };
    const createGoalOutput = await this.dynamodb.put(createGoalParams).promise();
    console.log(createGoalOutput);
    const periodOfYear = DatesUtil.getPeriodOfYear(createGoalDTO.frequency, now);
    await this.createPeriod(goalId, now, periodOfYear);
  }

  async completeGoal(completeGoalDTO: CompleteGoalDTO, goalId: string, username: string): Promise<void> {
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
    await this.updateGoalDoneTimes(username, goalId, completeGoalDTO.times);

    const periodOfYear = DatesUtil.getPeriodOfYear(goal.Frequency, now);
    await this.updatePeriodDoneTimes(goalId, now, periodOfYear, completeGoalDTO.times);
  }

  private async updateGoalDoneTimes(username: string, goalId: string, doneTimes: number): Promise<void> {
    const updateGoalOutput = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        PK: Indexes.goalPK(username),
        SK: Indexes.goalSK(goalId)
      },
      UpdateExpression: 'ADD DoneTimes :times',
      ExpressionAttributeValues: {
        ':times': doneTimes
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    console.log(updateGoalOutput);
  }

  private async updatePeriodDoneTimes(goalId: string, now: Date, periodOfYear: number, doneTimes: number): Promise<void> {
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
        ':times': doneTimes
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    console.log(updateOutput);
  }

  async updatePeriods(username: string): Promise<void> {
    const now = new Date();
    const goals = await this.findGoalsByUsername(username).promise();
    for (const goal of goals.Items) {
      const periodOfYear = DatesUtil.getPeriodOfYear(goal.Frequency, now);
      const inactivePeriod = await this.checkPeriod(goal.GoalId, now, periodOfYear);
      if (inactivePeriod) {
        await this.resetGoalDoneTimes(username, goal.GoalId);
        await this.createPeriod(goal.GoalId, now, periodOfYear);
      }
    }
  }

  private async checkPeriod(goalId: string, now: Date, periodOfYear: number): Promise<boolean> {
    const periodOutput = await this.dynamodb.get({
      TableName: this.tableName,
      Key: {
        PK: Indexes.periodPK(goalId),
        SK: Indexes.periodSK(now.getFullYear(), periodOfYear)
      }
    }).promise();
    return !periodOutput.Item;
  }

  private async resetGoalDoneTimes(username: string, goalId: string): Promise<void> {
    const resetGoalDoneTimesOutput = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        PK: Indexes.goalPK(username),
        SK: Indexes.goalSK(goalId)
      },
      UpdateExpression: 'SET DoneTimes = :times',
      ExpressionAttributeValues: {
        ':times': 0
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    console.log(resetGoalDoneTimesOutput);
  }

  private async createPeriod(goalId: string, now: Date, periodOfYear: number): Promise<void> {
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

  async inviteToTeam(goalId: string, username: string, friendUsername: string): Promise<void> {
    const teamId: string = uuidv4();
    await this.addToTeam(teamId, username, 'MEMBER');
    await this.addToTeam(teamId, friendUsername, 'INVITED');
    await this.assignGoalToTeam(username, teamId, goalId);
  }

  private async addToTeam(teamId: string, username: string, status: string): Promise<void> {
    const createPeriodOutput = await this.dynamodb.put({
      TableName: this.tableName,
      Item: {
        PK: Indexes.teamPK(teamId),
        SK: Indexes.teamSK(username),
        Username: username,
        TeamId: teamId,
        Status: status,
        GSI1PK: Indexes.teamGSI1PK(username),
        GSI1SK: Indexes.teamGSI1SK(teamId),
      },
      ReturnValues: 'ALL_OLD'
    }).promise();
    console.log(createPeriodOutput);
  }

  private async assignGoalToTeam(username: string, teamId: string, goalId: string): Promise<void> {
    const resetGoalDoneTimesOutput = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        PK: Indexes.goalPK(username),
        SK: Indexes.goalSK(goalId)
      },
      UpdateExpression: 'SET GSI1PK = :gsi1PK, GSI1SK = :gsi1SK',
      ExpressionAttributeValues: {
        ':gsi1PK': Indexes.goalGSI1PK(teamId),
        ':gsi1SK': Indexes.goalGSI1SK(username)
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    console.log(resetGoalDoneTimesOutput);
  }

  async respondToTeamInvitation(username: string, teamId: string, invitationResponse: ResponseType): Promise<void> {
    if (invitationResponse === ResponseType.ACCEPT) {
      const goalsOutput = await this.getGoal(teamId).promise();
      const goalInfo = goalsOutput.Items[0];
      if (!goalInfo) {
        throw new Error(Status.NOT_FOUND);
      }
      await this.updateTeamInvitationStatus(username, teamId);
      await this.createGoal({
        goalName: goalInfo.GoalName,
        goalType: goalInfo.GoalType,
        icon: goalInfo.Icon,
        frequency: goalInfo.Frequency,
        totalTimes: goalInfo.TotalTimes,
        points: goalInfo.Points,
        teamId
      }, username);
    } else {
      const teamMembers = await this.dynamodb.query({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :teamIndex and begins_with(SK, :user)',
        ExpressionAttributeValues: {
          ':teamIndex': Indexes.teamPK(teamId),
          ':user': Indexes.USER_PREFIX,
        },
        Limit: 2
      }).promise();
      for (const teamMember of teamMembers.Items) {
        await this.removeFromTeam(teamId, teamMember.Username);
        if (teamMember.Username !== username) {
          await this.removeGS1FromGoal(teamId, teamMember.Username);
        }
      }
    }
  }

  private getGoal(teamId: string): Request<DocumentClient.QueryOutput, AWSError> {
    return this.dynamodb.query({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1PK and begins_with(GSI1SK, :gsi1SK)',
      ExpressionAttributeValues: {
        ':gsi1PK': Indexes.goalGSI1PK(teamId),
        ':gsi1SK': Indexes.GOAL_PREFIX,
      },
      Limit: 1
    });
  }

  private async updateTeamInvitationStatus(username: string, teamId: string): Promise<void> {
    const updateStatusOutput = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        PK: Indexes.teamPK(teamId),
        SK: Indexes.teamSK(username)
      },
      UpdateExpression: 'SET #invStatus = :status',
      ExpressionAttributeNames: {
        '#invStatus': 'Status'
      },
      ExpressionAttributeValues: {
        ':status': 'MEMBER'
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    console.log(updateStatusOutput);
  }

  private async removeFromTeam(teamId: string, username: string): Promise<void> {
    await this.dynamodb.delete({
      TableName: this.tableName,
      Key: {
        PK: Indexes.teamPK(teamId),
        SK: Indexes.teamSK(username)
      }
    }).promise();
  }

  private async removeGS1FromGoal(teamId: string, username: string): Promise<void> {
    const removeGSI1Output = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        GSI1PK: Indexes.goalGSI1PK(teamId),
        GSI1SK: Indexes.goalGSI1SK(username)
      },
      UpdateExpression: 'REMOVE GSI1PK, GSI1SK',
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    console.log(removeGSI1Output);
  }
}
