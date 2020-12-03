import { UserService } from '../service/user';
import { ResponseVO, Status, StatusCode } from '../model/vo/responseVo';
import { CreateUserDTO } from '../model/dto/createUserDTO';
import { AuthUtils } from '../utils/auth';
import { UpdateProgressDTO } from '../model/dto/updateProgressDTO';
import { MessageUtils } from '../utils/message';
import { RespondToFriendInvitationDTO } from '../model/dto/respondToFriendInvitationDTO';

export class UserController {
  constructor(private userService: UserService) {
  }

  async createUser(event: any): Promise<ResponseVO> {
    console.log(event);
    const userAttributes = event.request.userAttributes;
    const createUserDTO: CreateUserDTO = {
      username: event.userName,
      avatar: userAttributes['custom:avatar']
    };
    await this.userService.createUser(createUserDTO).promise();

    return event;
  }

  async updateProgress(event: any): Promise<ResponseVO> {
    try {
      const username: string = AuthUtils.getUsernameClaim(event);
      const updateProgressDTO: UpdateProgressDTO = JSON.parse(event.body);

      await this.userService.updateProgress(updateProgressDTO, username).promise();

      return MessageUtils.success();
    } catch (err) {
      console.error(err);
      return MessageUtils.error(Status.ERROR, err.message);
    }
  }

  async inviteFriend(event: any): Promise<ResponseVO> {
    try {
      const username: string = AuthUtils.getUsernameClaim(event);
      const inviteFriendBody: { friendUsername: string } = JSON.parse(event.body);

      await this.userService.inviteFriend(inviteFriendBody.friendUsername, username);

      return MessageUtils.success();
    } catch (err) {
      console.error(err);
      if (err.message === Status.NOT_FOUND) {
        return MessageUtils.error(Status.NOT_FOUND, StatusCode.NOT_FOUND);
      }
      return MessageUtils.error(Status.ERROR, err.message);
    }
  }

  async respondToFriendInvitation(event: any): Promise<ResponseVO> {
    try {
      const username: string = AuthUtils.getUsernameClaim(event);
      const friendUsername: string = event.pathParameters.friendName;
      const respondToFriendInvitationDTO: RespondToFriendInvitationDTO = JSON.parse(event.body);

      await this.userService.respondToFriendInvitation(respondToFriendInvitationDTO, friendUsername, username);

      return MessageUtils.success();
    } catch (err) {
      console.error(err);
      if (err.message === Status.NOT_FOUND) {
        return MessageUtils.error(Status.NOT_FOUND, StatusCode.NOT_FOUND);
      }
      return MessageUtils.error(Status.ERROR, err.message);
    }
  }

  async getFriendsAndTeams(event: any): Promise<ResponseVO> {
    try {
      const username: string = AuthUtils.getUsernameClaim(event);

      const friendsAndTeams = await this.userService.getFriendsAndTeams(username);
      console.log(friendsAndTeams);

      return MessageUtils.successWithData(friendsAndTeams);
    } catch (err) {
      console.error(err);
      if (err.message === Status.NOT_FOUND) {
        return MessageUtils.error(Status.NOT_FOUND, StatusCode.NOT_FOUND);
      }
      return MessageUtils.error(Status.ERROR, err.message);
    }
  }
}
