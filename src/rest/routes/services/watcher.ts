import { UsersController } from "@app/core/controllers";
import { getUserFromToken } from "@app/core/utils";
import { imageDetect } from "@app/core/external";
import { TOKEN_EXPIRED_ERROR, RATE_EXCEEDED_ERROR } from "@app/core/strings";
import type { Request, Response } from "express";

const detectImage = async (req: Request, res: Response) => {
  const img = req.body?.imageBase64;

  if (!img) {
    res.json({
      data: null,
      status: 400,
      message: "IMAGE NOT FOUND",
      success: false,
    });
    return;
  }

  // TODO: MOVE TO MIDDLEWARE
  const user = getUserFromToken(req.headers?.authorization);

  if (!user) {
    res.json({
      data: null,
      status: 400,
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
    res.json({
      data: null,
      status: 17,
      message: RATE_EXCEEDED_ERROR,
      success: false,
    });
    return;
  }

  let data = { status: false };

  try {
    data = await imageDetect({ img });
  } catch (e) {
    console.error(e);
  }

  res.json(data);
};

export { detectImage };
