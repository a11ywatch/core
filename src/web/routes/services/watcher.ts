import { UsersController } from "@app/core/controllers";
import { getUserFromToken } from "@app/core/utils";
import { imageDetect } from "@app/core/external";
import { TOKEN_EXPIRED_ERROR, RATE_EXCEEDED_ERROR } from "@app/core/strings";

import { StatusCode } from "@app/web/messages/message";
import { responseModel } from "@app/core/models";
import { FastifyContext } from "apollo-server-fastify";

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
  const user = getUserFromToken(req?.headers?.authorization);

  if (!user) {
    res.status(StatusCode.Unauthorized);

    res.send({
      data: null,
      message: req.headers?.authorization
        ? TOKEN_EXPIRED_ERROR
        : "USER NOT FOUND",
      success: false,
    });
    return;
  }

  const { keyid } = user?.payload;

  const [_, __, canScan] = await UsersController({
    user,
  }).updateApiUsage({ id: keyid });

  if (!canScan) {
    res.send({
      data: null,
      message: RATE_EXCEEDED_ERROR,
      success: false,
    });
    return;
  }

  let data = { status: false };

  data = await imageDetect({ img });

  res.send(responseModel({ code: StatusCode.Ok, data }));
};

export { detectImage };
