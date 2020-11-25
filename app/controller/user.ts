import { UserService } from '../service/user';
import { ResponseVO} from '../model/vo/responseVo';
import { CreateUserDTO } from '../model/dto/createUserDTO';

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
}
