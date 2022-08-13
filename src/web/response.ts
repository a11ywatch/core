import { responseModel } from "@app/core/models";
import { Response } from "express";
import { getStatusCodes, HttpMessage } from "./messages/message";

// Response wrapper for expres API
export const responseWrap = async (res: Response, data: any = null) => {
  let message = HttpMessage.Unauthorized;
  const code = getStatusCodes(message);

  res.status(code);

  res.json(
    responseModel({
      code,
      data,
      message,
    })
  );
};
