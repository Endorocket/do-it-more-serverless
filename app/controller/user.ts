import { UserService } from '../service/user';
import { ResponseVO, Status, StatusCode } from '../model/vo/responseVo';
import { CreateUserDTO } from '../model/dto/createUserDTO';
import { AuthUtil } from '../utils/auth';
import { UpdateProgressDTO } from '../model/dto/updateProgressDTO';
import { MessageUtil } from '../utils/message';

export class UserController {
  constructor(private userService: UserService) {
  }

  async createUser(event: any): Promise<ResponseVO> {
    console.log(event);
    const userAttributes = event.request.userAttributes;
    const createUserDTO: CreateUserDTO = {
      Username: event.userName,
      Email: userAttributes.email,
      Avatar: userAttributes['custom:avatar']
    };
    await this.userService.createUser(createUserDTO).promise();

    return event;
  }

  async updateProgress(event: any): Promise<ResponseVO> {
    try {
      const username: string = AuthUtil.getUsernameClaim(event);
      const updateProgressDTO: UpdateProgressDTO = JSON.parse(event.body);

      await this.userService.updateProgress(updateProgressDTO, username).promise();

      return MessageUtil.success();
    } catch (err) {
      console.error(err);
      return MessageUtil.error(Status.ERROR, err.message);
    }
  }

  async inviteFriend(event: any): Promise<ResponseVO> {
    try {
      const username: string = AuthUtil.getUsernameClaim(event);
      const inviteFriendBody: { friendName: string } = JSON.parse(event.body);

      await this.userService.inviteFriend(inviteFriendBody.friendName, username);

      return MessageUtil.success();
    } catch (err) {
      console.error(err);
      if (err.message === Status.NOT_FOUND) {
        return MessageUtil.error(Status.NOT_FOUND, StatusCode.NOT_FOUND);
      }
      return MessageUtil.error(Status.ERROR, err.message);
    }
  }
}
