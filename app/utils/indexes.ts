export class Indexes {
  static readonly USER_PREFIX = 'USER#';
  static readonly GOAL_PREFIX = 'GOAL#';
  static readonly PERIOD_PREFIX = 'PERIOD#';
  static readonly FRIEND_PREFIX = 'FRIEND#';
  static readonly TEAM_PREFIX = 'TEAM#';

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

  static goalGSI1PK(teamId: string): string {
    return Indexes.TEAM_PREFIX + teamId;
  }

  static goalGSI1SK(goalId: string): string {
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

  static teamPK(teamId: string): string {
    return Indexes.TEAM_PREFIX + teamId;
  }

  static teamSK(username: string): string {
    return Indexes.USER_PREFIX + username;
  }

  static teamGSI1PK(username: string): string {
    return Indexes.USER_PREFIX + username;
  }

  static teamGSI1SK(teamId: string): string {
    return Indexes.TEAM_PREFIX + teamId;
  }
}
