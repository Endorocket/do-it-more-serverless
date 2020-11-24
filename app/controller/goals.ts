import { GoalsService } from '../service/goals';
import { MessageUtil } from '../utils/message';
import { ResponseVO, Status } from '../model/vo/responseVo';
import { UserModel } from '../model/user';
import { GoalModel } from '../model/goal';
import { CreateGoalDTO } from '../model/dto/createGoalDTO';

export class GoalsController {
  constructor(private goalsService: GoalsService) {
  }

  async findUserWithGoals(event: any): Promise<ResponseVO> {
    const username: string = event.pathParameters.username;

    try {
      const userFound = await this.goalsService.findUserByUsername(username).promise();
      console.log(userFound);

      const userData = userFound.Items[0];

      const goalsFound = await this.goalsService.findGoalsByUsername(username).promise();
      console.log(goalsFound);

      const goalsData: GoalModel[] = goalsFound.Items.map(item => {
        return {
          GoalId: item.GoalId,
          GoalName: item.GoalName,
          GoalType: item.GoalType,
          Frequency: item.Frequency,
          DoneTimes: item.DoneTimes,
          TotalTimes: item.TotalTimes,
          Points: item.Points
        };
      });

      const result: UserModel = {
        Username: userData.Username,
        Email: userData.Email,
        Avatar: userData.Avatar,
        Level: userData.Level,
        Progress: userData.Progress,
        Goals: goalsData
      };

      return MessageUtil.successWithData(result);
    } catch (err) {
      console.error(err);
      return MessageUtil.error(Status.ERROR, err.message);
    }
  }

  async createGoal(event: any): Promise<ResponseVO> {
    try {
      console.log(event.body);
      const createGoalDTO: CreateGoalDTO = JSON.parse(event.body);
      const username: string = event.headers.app_user_name;

      await this.goalsService.createGoal(createGoalDTO, username).promise();

      return MessageUtil.success();
    } catch (err) {
      console.error(err);
      return MessageUtil.error(Status.ERROR, err.message);
    }
  }
}
