export class Indexes {
  static readonly USER_PREFIX = 'USER#';
  static readonly GOAL_PREFIX = 'GOAL#';

  static userPK(username: string): string {
    return Indexes.USER_PREFIX + username;
  }

  static userSK(username: string): string {
    return Indexes.USER_PREFIX + username;
  }

  static goalSK(goalId: string): string {
    return Indexes.GOAL_PREFIX + goalId;
  }
}
