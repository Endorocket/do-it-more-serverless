export enum Status {
  OK = 'OK',
  NOT_FOUND = 'NOT_FOUND',
  ERROR = 'ERROR',
  GOAL_ALREADY_ASSIGNED_TO_TEAM = 'GOAL_ALREADY_ASSIGNED_TO_TEAM'
}

export enum StatusCode {
  SUCCESS = 200,
  NOT_FOUND = 403,
  ERROR = 500
}

export class ResponseVO {
  statusCode: number;
  headers: object;
  body: string;
}
