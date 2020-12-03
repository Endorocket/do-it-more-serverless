export class AuthUtils {
  static getUsernameClaim(event: any): string {
    return event.requestContext.authorizer.claims['cognito:username'];
  }
}
