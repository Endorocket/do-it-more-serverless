export class Indexes {
  static readonly USER_PREFIX = 'USER#';
  static readonly GOAL_PREFIX = 'GOAL#';
  static readonly PERIOD_PREFIX = 'PERIOD#';
  static readonly FRIEND_PREFIX = 'FRIEND#';

  static userPK(username: string): string {
    return Indexes.USER_PREFIX + username;
  }

  static userSK(username: string): string {
    return Indexes.USER_PREFIX + username;
  }

  static goalPK(username: string): string {
    return Indexes.USER_PREFIX + username;
  }

  static goalSK(goalId: string): string {
    return Indexes.GOAL_PREFIX + goalId;
  }

  static periodPK(goalId: string): string {
    return Indexes.GOAL_PREFIX + goalId;
  }

  static periodSK(year: number, periodOfYear: number): string {
    return `${Indexes.PERIOD_PREFIX}${year}#${periodOfYear}`;
  }

  static friendPK(username: string): string {
    return Indexes.USER_PREFIX + username;
  }

  static friendSK(friendName: string): string {
    return Indexes.FRIEND_PREFIX + friendName;
  }
}
