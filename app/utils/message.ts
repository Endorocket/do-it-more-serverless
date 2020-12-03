import { ResponseVO, Status, StatusCode } from '../model/vo/responseVo';

export class MessageUtils {
  static successWithData(data: object): ResponseVO {
    return {
      statusCode: StatusCode.SUCCESS,
      headers: MessageUtils.getResponseHeaders(),
      body: JSON.stringify(data)
    };
  }

  static success(status: Status = Status.OK): ResponseVO {
    return {
      statusCode: StatusCode.SUCCESS,
      headers: MessageUtils.getResponseHeaders(),
      body: JSON.stringify(status)
    };
  }

  static error(status: Status = Status.ERROR, statusCode: StatusCode = StatusCode.ERROR, message: string = null): ResponseVO {
    return {
      statusCode,
      headers: MessageUtils.getResponseHeaders(),
      body: JSON.stringify({ status, message })
    };
  }

  private static getResponseHeaders(): object {
    return {
      'Access-Control-Allow-Origin': '*'
    };
  }
}
