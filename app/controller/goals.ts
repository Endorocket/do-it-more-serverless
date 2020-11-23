import { GoalsService } from '../service/goals';
import { MessageUtil } from '../utils/message';
import { ResponseVO } from '../model/vo/responseVo';
import { UserModel } from '../model/user';
import { GoalModel } from '../model/goal';

export class GoalsController {
  constructor(private goalsService: GoalsService) {
  }

  async findUserWithGoals(event: any): Promise<ResponseVO> {
    const username: string = event.pathParameters.username;

    try {
      const userFound = await this.goalsService.findUserByUsername(username).promise();
      const userData = userFound.Items[0];
      console.log(userData);

      const goalsFound = await this.goalsService.findGoalsByUsername(username).promise();
      const goalsData: GoalModel[] = goalsFound.Items.map(item => {
        return {
          GoalId: item.GoalId,
          GoalName: item.GoalName,
          DoneTimes: item.DoneTimes,
          TotalTimes: item.TotalTimes,
          Points: item.Points
        };
      });
      console.log(goalsData);

      const result: UserModel = {
        Username: userData.Username,
        Email: userData.Email,
        Avatar: userData.Avatar,
        Level: userData.Level,
        Progress: userData.Progress,
        Goals: goalsData
      };

      return MessageUtil.success(result);
    } catch (err) {
      console.error(err);

      return MessageUtil.error(err.code, err.message);
    }
  }
}
