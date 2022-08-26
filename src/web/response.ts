import { SUPER_MODE } from "../config/config";
import { responseModel } from "../core/models/response";
import { validateUID } from "./params/extracter";
import { HttpMessage, StatusCode } from "./messages/message";
import type { FastifyContext } from "apollo-server-fastify";

/*
 * Response wrapper for expres API
 * performs validation for allowed request.
 * This allows from moving between middleware coupling
 * and migrating between future web frameworks.
 *
 * @param res - Response
 * @param source - {callback, userId}
 * @return Promise<void>
 */
export const responseWrap = async (res: FastifyContext["reply"], source) => {
  const { callback, userId } = source ?? {};

  let message = HttpMessage.Ok;
  let code = StatusCode.Ok;
  let data = null;

  // prevent callback from running not authed
  if (!SUPER_MODE && !validateUID(userId)) {
    message = HttpMessage.Unauthorized;
    code = StatusCode.Unauthorized;
  } else if (typeof callback === "function") {
    try {
      data = await callback(); // must return datasource directly and not attached to the data property
    } catch (e) {
      message = e.message;
      code = StatusCode.Error; // TODO: parse rejection for error code or pass in on-rejection error code
    }
  }

  res.statusCode = code;

  res.send(
    responseModel({
      code,
      data,
      message,
    })
  );
};
