export class AuthUtil {
  static getUsernameClaim(event: any): string {
    return event.requestContext.authorizer.claims['cognito:username'];
  }
}
