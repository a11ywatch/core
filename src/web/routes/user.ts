import { UsersController } from "../../core/controllers";
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

// unsub from emails if id matches emails
const unSubEmails = async (req, res) => {
  const email = paramParser(req, "email") + "";
  const id = paramParser(req, "id") || paramParser(req, "userId");

  await UsersController().unsubscribeEmails({
    id,
    email,
  });

  res.send({
    message: "Unsubscribed from email alerts.",
    success: true,
  });
};

export { confirmEmail, unSubEmails };
