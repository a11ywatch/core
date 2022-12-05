import type { FastifyContext } from "apollo-server-fastify";
import { getUserFromToken } from "../../../core/utils";
import { imageDetect } from "../../../core/external";
import { TOKEN_EXPIRED_ERROR } from "../../../core/strings";
import { StatusCode } from "../../../web/messages/message";
import { responseModel } from "../../../core/models";

const detectImage = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  const img = (req.body as any)?.imageBase64;

  if (!img) {
    res.status(StatusCode.BadRequest);
    res.send({
      data: null,
      message: "Request body property 'imageBase64' expected",
      success: false,
    });
    return;
  }

  // TODO: MOVE TO MIDDLEWARE
  const user = getUserFromToken(req.headers.authorization);

  if (!user) {
    res.status(StatusCode.Unauthorized);

    res.send({
      data: null,
      message: req.headers.authorization
        ? TOKEN_EXPIRED_ERROR
        : "USER NOT FOUND",
      success: false,
    });
    return;
  }

  const data = await imageDetect({ img });

  res.send(responseModel({ code: StatusCode.Ok, data }));
};

export { detectImage };
