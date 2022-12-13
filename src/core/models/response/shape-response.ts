import { HttpMessage, StatusCode } from "../../../web/messages/message";
import { ResponseParamsModel, ResponseModel } from "./types";

// response model based on exact params
export const shapeResponse = (params?: ResponseParamsModel): ResponseModel => {
  let { success = true, message, code = StatusCode.Ok, data } = params ?? {};

  // determine success on code
  if (code >= StatusCode.BadRequest) {
    success = false;
  }

  // TODO: remove for actually messages being used
  if (typeof message === "number") {
    message = HttpMessage[message];
  }

  // proper shape
  return {
    data,
    success,
    code,
    message,
  };
};
