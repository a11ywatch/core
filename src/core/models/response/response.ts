import { HttpMessage, StatusCode } from "@app/web/messages/message";
import { ResponseParamsModel, ResponseModel } from "./types";

// response model for HTTP request
// TODO: refactor and filter code from body on OpenAPI
const responseModel = (
  { success = true, ...extra }: ResponseParamsModel = {
    success: true,
  }
): ResponseModel => {
  let message = extra?.message;
  let code = extra?.code ?? StatusCode.Ok;

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
