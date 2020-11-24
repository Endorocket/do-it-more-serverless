import { ResponseVO, Status } from '../model/vo/responseVo';

enum StatusCode {
  SUCCESS = 200,
  ERROR = 500
}

export class MessageUtil {
  static successWithData(data: object): ResponseVO {
    return {
      statusCode: StatusCode.SUCCESS,
      body: JSON.stringify(data)
    };
  }

  static success(status: Status = Status.OK): ResponseVO {
    return {
      statusCode: StatusCode.SUCCESS,
      body: JSON.stringify(status)
    };
  }

  static error(status: Status = Status.ERROR, message: string = null): ResponseVO {
    return {
      statusCode: StatusCode.ERROR,
      body: JSON.stringify({ status, message })
    };
  }
}
