import { SUPER_MODE } from "@app/config/config";
import { responseModel } from "@app/core/models";
import { Response } from "express";
import { validateUID } from "./params/extracter";
import { HttpMessage, StatusCode } from "./messages/message";

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
export const responseWrap = async (res: Response, source) => {
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
      // TODO: parse rejection for error code or pass in on-rejection error code
      code = StatusCode.Error;
    }
  }

  res.status(code);

  res.json(
    responseModel({
      code,
      data,
      message,
    })
  );
};
