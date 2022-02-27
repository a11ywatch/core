import { UsersController } from "@app/core/controllers";

const confirmEmail = async (req, res) => {
  const code = String(req.query?.code || req.body?.code);
  const validEmail = await UsersController().validateEmail(
    {
      code,
    },
    false
  );

  res.send(
    validEmail
      ? "Success, email verified"
      : "Link expired, please get a new link and try again."
  );
};

const unSubEmails = async (req, res) => {
  try {
    const email = req?.query?.email + "";
    const id = req?.query?.id;

    await UsersController().unsubscribeEmails({
      id,
      email,
    });

    res.json({
      sucess: "unsubscribed from email alerts",
    });
  } catch (e) {
    console.error(e);
    res.json({
      failed: "failed to unsubscribed from email alerts",
    });
  }
};

export { confirmEmail, unSubEmails };
