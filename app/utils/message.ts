import { ResponseVO, Status, StatusCode } from '../model/vo/responseVo';

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

  static error(status: Status = Status.ERROR, statusCode: StatusCode = StatusCode.ERROR, message: string = null): ResponseVO {
    return {
      statusCode,
      body: JSON.stringify({ status, message })
    };
  }
}
