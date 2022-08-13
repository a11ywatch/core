import { UsersController } from "@app/core/controllers";
import { paramParser } from "../params/extracter";

const confirmEmail = async (req, res) => {
  const code = paramParser(req, "code") + "";

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
    const email = paramParser(req, "email") + "";
    const id = paramParser(req, "id") || paramParser(req, "userId");

    await UsersController().unsubscribeEmails({
      id,
      email,
    });

    res.json({
      message: "Unsubscribed from email alerts.",
      success: true,
    });
  } catch (e) {
    console.error(e);
    res.json({
      success: false,
      message: "Failed to unsubscribed from email alerts",
    });
  }
};

export { confirmEmail, unSubEmails };
