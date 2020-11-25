export class AuthController {

  async preSignUp(event: any): Promise<any> {
    event.response = {
      autoConfirmUser: true,
      autoVerifyEmail: true,
      autoVerifyPhone: false
    };
    return event;
  }
}
