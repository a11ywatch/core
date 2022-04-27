import { emailMessager } from "@app/core/messagers";
import { UsersController } from "./users";

// send an email to a user using an html template
export const usersEmail = async (subject: string, html: string) => {
  const [users] = await UsersController().getAllUsers(true);

  if (!html) {
    return new Error("html template required for email follow up.");
  }

  for (const item of users) {
    const userId = item?.userId;
    const email = item?.email;
    const emailConfirmed = item?.emailConfirmed;

    if (email) {
      await emailMessager.sendFollowupEmail({
        emailConfirmed,
        userId,
        email,
        subject,
        html,
      });
    }
  }
};
