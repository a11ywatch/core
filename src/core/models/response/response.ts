import { SUCCESS } from "@app/core/strings";
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

  if (!message) {
    message = SUCCESS;
  }

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

  // proper shape
  return {
    data,
    success,
    code,
    message,
    ...n,
  };
};

export { responseModel };
