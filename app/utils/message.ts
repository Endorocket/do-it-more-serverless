import { ResponseBodyVO, ResponseVO } from '../model/vo/ResponseVo';

enum StatusCode {
  success = 200,
}

class Result {
  private readonly statusCode: number;
  private readonly responseBodyVO: ResponseBodyVO;

  constructor(statusCode: number, responseBodyVO: ResponseBodyVO) {
    this.statusCode = statusCode;
    this.responseBodyVO = responseBodyVO;
  }

  /**
   * Serverless: According to the API Gateway specs, the body content must be stringified
   */
  bodyToString(): ResponseVO {
    return {
      statusCode: this.statusCode,
      body: JSON.stringify(this.responseBodyVO),
    };
  }
}

export class MessageUtil {
  static success(data: object): ResponseVO {
    const result = new Result(StatusCode.success, { code: 0, message: 'success', data });

    return result.bodyToString();
  }

  static error(code: number = 1000, message: string): ResponseVO {
    const result = new Result(StatusCode.success, { code, message });

    console.log(result.bodyToString());
    return result.bodyToString();
  }
}
