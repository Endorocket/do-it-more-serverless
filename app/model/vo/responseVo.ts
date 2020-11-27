export enum Status {
  OK = 'OK',
  NOT_FOUND = 'NOT_FOUND',
  ERROR = 'ERROR'
}

export enum StatusCode {
  SUCCESS = 200,
  NOT_FOUND = 403,
  ERROR = 500
}

export class ResponseVO {
  statusCode: number;
  body: string;
}
