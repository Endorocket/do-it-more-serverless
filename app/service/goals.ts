import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { AWSError, Request } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { CreateGoalDTO } from '../model/dto/createGoalDTO';
import { CompleteGoalDTO } from '../model/dto/completeGoalDTO';
import { Indexes } from '../utils/indexes';
import { PeriodUtils } from '../utils/period';
import { ResponseType } from '../model/dto/responseType';
import { Status } from '../model/vo/responseVo';
import { Event, GoalEventModel, GoalInfo } from '../model/goalEvent';

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
    const periodOfYear = PeriodUtils.getPeriodOfYear(createGoalDTO.frequency, now);
    await this.createPeriod(goalId, now, periodOfYear);
  }

  async completeGoal(completeGoalDTO: CompleteGoalDTO, goalId: string, username: string): Promise<void> {
    const now = new Date();
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
    const periodOfYear = await this.updatePeriodIfStale(goal, now, username);
    await this.updateGoalDoneTimes(username, goalId, completeGoalDTO.times);
    await this.updatePeriodDoneTimes(goalId, now, periodOfYear, completeGoalDTO.times);
  }

  private async updatePeriodIfStale(goal: DocumentClient.AttributeMap, now: Date, username: string): Promise<number> {
    const periodOfYear = PeriodUtils.getPeriodOfYear(goal.Frequency, now);
    if (Indexes.periodSK(now.getFullYear(), periodOfYear) !== goal.CurrentPeriodPattern) {
      await this.createPeriod(goal.GoalId, now, periodOfYear);
      await this.updateCurrentPeriodPatternInGoal(username, goal.GoalId, now, periodOfYear);
    }
    return periodOfYear;
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
        '#eventIndex': `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDay()}`
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
      await this.updatePeriodIfStale(goal, now, username);
    }
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
    await this.validateGoal(username, goalId);
    await this.addToTeam(teamId, username, 'MEMBER');
    await this.addToTeam(teamId, friendUsername, 'INVITED');
    await this.assignGoalToTeam(username, teamId, goalId);
  }

  private async validateGoal(username: string, goalId: string): Promise<void> {
    const goalOutput = await this.dynamodb.get({
      TableName: this.tableName,
      Key: {
        PK: Indexes.goalPK(username),
        SK: Indexes.goalSK(goalId)
      },
    }).promise();
    const goalItem = goalOutput.Item;
    if (!goalItem) {
      throw new Error(Status.NOT_FOUND);
    }
    const goalAssignedToTeam: boolean = goalItem.GSI1PK !== undefined;
    if (goalAssignedToTeam) {
      throw new Error(Status.GOAL_ALREADY_ASSIGNED_TO_TEAM);
    }
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
    const assignGoalToTeamOutput = await this.dynamodb.update({
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
    console.log(assignGoalToTeamOutput);
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
        ':gsi1SK': Indexes.USER_PREFIX,
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
    const goal = await this.dynamodb.query({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :teamId and GSI1SK = :username',
      ExpressionAttributeValues: {
        ':teamId': Indexes.goalGSI1PK(teamId),
        ':username': Indexes.goalGSI1SK(username)
      },
      Limit: 1
    }).promise();
    console.log(goal);
    const goalId: string = goal.Items[0].GoalId;
    const removeGSI1Output = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        PK: Indexes.goalPK(username),
        SK: Indexes.goalSK(goalId)
      },
      UpdateExpression: 'REMOVE GSI1PK, GSI1SK',
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    console.log(removeGSI1Output);
  }

  private async updateCurrentPeriodPatternInGoal(username: string, goalId: string, now: Date, periodOfYear: number): Promise<void> {
    const updateCurrentPeriodPatternOutput = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        PK: Indexes.goalPK(username),
        SK: Indexes.goalSK(goalId)
      },
      UpdateExpression: 'SET CurrentPeriodPattern = :periodPattern, DoneTimes = :times',
      ExpressionAttributeValues: {
        ':periodPattern': Indexes.periodSK(now.getFullYear(), periodOfYear),
        ':times': 0
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();
    console.log(updateCurrentPeriodPatternOutput);
  }

  async getGoalEvents(username: string): Promise<GoalEventModel[]> {
    const goalEvents: GoalEventModel[] = [];
    const goalsFound = await this.findGoalsByUsername(username).promise();
    for (const item of goalsFound.Items) {
      const goalInfo: GoalInfo = {
        goalId: item.GoalId,
        goalName: item.GoalName,
        icon: item.Icon,
        type: item.GoalType,
        points: item.Points
      };
      const events: Event[] = await this.findEventsByGoalId(item.GoalId);
      goalEvents.push({ goalInfo, events });
    }
    return goalEvents;
  }

  private async findEventsByGoalId(goalId: string): Promise<Event[]> {
    const periodsFound = await this.dynamodb.query({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :goalId and begins_with(SK, :period)',
      ExpressionAttributeValues: {
        ':goalId': Indexes.periodPK(goalId),
        ':period': Indexes.PERIOD_PREFIX
      },
    }).promise();
    const events: Event[] = [];
    for (const periodItem of periodsFound.Items) {
      const periodEvents: Map<string, number> = periodItem.Events;
      periodEvents.forEach((times, date) => {
        events.push({ date, times });
      });
    }
    return events;
  }
}
