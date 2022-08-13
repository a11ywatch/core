import { HttpMessage } from "@app/web/messages/message";
import { ApiResponse, ResponseParamsModel, ResponseModel } from "./types";

// response models
// TODO: refactor
const responseModel = (
  { statusCode, success = true, ...extra }: ResponseParamsModel = {
    statusCode: ApiResponse.Success,
    success: true,
  }
): ResponseModel => {
  let message = extra?.message;
  let code = extra?.code;

  if (!code) {
    // for gQL
    switch (statusCode) {
      case ApiResponse.NotFound:
        code = 404;
        break;
      case ApiResponse.BadRequest:
        code = 400;
        break;
      default:
        code = 200;
        break;
    }
  }

  // determine success on code
  if (code > 400) {
    success = false;
  }

  const { data = null, ...n } = extra ?? {};

  if (typeof message === "number") {
    message = HttpMessage[message];
  }

  // proper shape
  return {
    ...n,
    data,
    success,
    code,
    message,
  };
};

export { responseModel };
