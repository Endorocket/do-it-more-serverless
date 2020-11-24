export enum Status {
  OK = 'OK',
  ERROR = 'ERROR'
}

export class ResponseVO {
  statusCode: number;
  body: string;
}
