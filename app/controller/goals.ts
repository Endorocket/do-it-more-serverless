import { GoalsService } from '../service/goals';
import { MessageUtil } from '../utils/message';
import { ResponseVO, Status } from '../model/vo/responseVo';
import { UserModel } from '../model/user';
import { GoalModel } from '../model/goal';
import { CreateGoalDTO } from '../model/dto/createGoalDTO';
import { CompleteGoalDTO } from '../model/dto/completeGoalDTO';
import { AuthUtil } from '../utils/auth';
import { UserService } from '../service/user';
import { InviteToTeamDTO } from '../model/dto/inviteToTeamDTO';
import { RespondToTeamInvitationDTO } from '../model/dto/respondToTeamInvitationDTO';

export class GoalsController {
  constructor(private goalsService: GoalsService, private userService: UserService) {
  }

  async findUserWithGoals(event: any): Promise<ResponseVO> {
    try {
      const username: string = AuthUtil.getUsernameClaim(event);

      const userFound = await this.userService.findUserByUsername(username).promise();
      console.log(userFound);

      const userData = userFound.Items[0];

      const goalsFound = await this.goalsService.findGoalsByUsername(username).promise();
      console.log(goalsFound);

      const goalsData: GoalModel[] = goalsFound.Items.map(item => {
        return {
          id: item.GoalId,
          name: item.GoalName,
          type: item.GoalType,
          frequency: item.Frequency,
          doneTimes: item.DoneTimes,
          totalTimes: item.TotalTimes,
          points: item.Points
        };
      });
      const progress = userData.Progress.map(singleProgress => {
        return {
          type: singleProgress.Type,
          achieved: singleProgress.Achieved,
          total: singleProgress.Total
        };
      });
      const result: UserModel = {
        username: userData.Username,
        avatar: userData.Avatar,
        level: userData.Level,
        progress,
        goals: goalsData
      };

      return MessageUtil.successWithData(result);
    } catch (err) {
      console.error(err);
      return MessageUtil.error(Status.ERROR, err.message);
    }
  }

  async createGoal(event: any): Promise<ResponseVO> {
    try {
      const username: string = AuthUtil.getUsernameClaim(event);
      console.log(event.body);
      const createGoalDTO: CreateGoalDTO = JSON.parse(event.body);

      await this.goalsService.createGoal(createGoalDTO, username);

      return MessageUtil.success();
    } catch (err) {
      console.error(err);
      return MessageUtil.error(Status.ERROR, err.message);
    }
  }

  async completeGoal(event: any): Promise<ResponseVO> {
    try {
      const username: string = AuthUtil.getUsernameClaim(event);
      const goalId: string = event.pathParameters.goalId;
      const completeGoalDTO: CompleteGoalDTO = JSON.parse(event.body);

      await this.goalsService.completeGoal(completeGoalDTO, goalId, username);

      return MessageUtil.success();
    } catch (err) {
      console.error(err);
      return MessageUtil.error(Status.ERROR, err.message);
    }
  }

  async updatePeriods(event: any): Promise<ResponseVO> {
    try {
      const username: string = AuthUtil.getUsernameClaim(event);
      await this.goalsService.updatePeriods(username);

      return MessageUtil.success();
    } catch (err) {
      console.error(err);
      return MessageUtil.error(Status.ERROR, err.message);
    }
  }

  async inviteToTeam(event: any): Promise<ResponseVO> {
    try {
      const username: string = AuthUtil.getUsernameClaim(event);
      const inviteToTeamDTO: InviteToTeamDTO = JSON.parse(event.body);

      await this.goalsService.inviteToTeam(inviteToTeamDTO.goalId, username, inviteToTeamDTO.friendUsername);

      return MessageUtil.success();
    } catch (err) {
      console.error(err);
      return MessageUtil.error(Status.ERROR, err.message);
    }
  }

  async respondToTeamInvitation(event: any): Promise<ResponseVO> {
    try {
      const username: string = AuthUtil.getUsernameClaim(event);
      const teamId: string = event.pathParameters.teamId;
      const respondToTeamInvitationDTO: RespondToTeamInvitationDTO = JSON.parse(event.body);

      await this.goalsService.respondToTeamInvitation(username, teamId, respondToTeamInvitationDTO.invitationResponse);

      return MessageUtil.success();
    } catch (err) {
      console.error(err);
      return MessageUtil.error(Status.ERROR, err.message);
    }
  }
}
