import { HttpMessage, StatusCode } from "@app/web/messages/message";
import { ResponseParamsModel, ResponseModel } from "./types";

// response model for HTTP request
const responseModel = (params?: ResponseParamsModel): ResponseModel => {
  let {
    success = true,
    message,
    code = StatusCode.Ok,
    ...extra
  } = params ?? {};

  // determine success on code
  if (code >= StatusCode.BadRequest) {
    success = false;
  }

  const { data = null, ...n } = extra ?? {};

  // TODO: remove for actually messages being used
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
