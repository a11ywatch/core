import { emailMessager } from "@app/core/messagers";
import { UsersController } from "./users";

export const usersEmail = async (subject: string, html: string) => {
  const [users] = await UsersController().getAllUsers(true);

  for (const item of users) {
    const userId = item?.userId;
    const email = item?.email;
    const emailConfirmed = item?.emailConfirmed;

    if (email && html) {
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
