import { randomBytes } from "crypto";

import { EMAIL_ERROR, GENERAL_ERROR } from "../../../strings";
import {
  transporter,
  mailOptions,
  saltHashPassword,
  signJwt,
  sendMailCallback,
} from "../../../utils";
import { getUser } from "../find";

export const resetPassword = async ({ email, resetCode }) => {
  if (!email) {
    throw new Error(EMAIL_ERROR);
  }
  const [user, collection] = await getUser({ email });

  if (user?.resetCode === resetCode) {
    try {
      const resetCode = randomBytes(4).toString("hex");
      const salthash = saltHashPassword(resetCode);

      const signedToken = signJwt({
        email,
        keyid: user.id,
        role: user.role || 0,
      });

      await collection.findOneAndUpdate(
        { id: user.id },
        {
          $set: {
            password: salthash.passwordHash,
            salt: salthash.salt,
            jwt: signedToken,
          },
        }
      );

      await transporter.sendMail(
        {
          ...mailOptions,
          to: user.email,
          subject: `A11yWatch - Temporary Password.`,
          html: `
          <div>
            <p style="margin-bottom: 13px; font-size: 1rem;">View your new temporary password below.</p>
            <h1 style="font-weight:400;"><b>${resetCode}</b></h1>
            <p style="margin-top: 13px; font-size: 0.85rem;">Go to the profile screen to change your password using the reset-code afterwards.</p>
          </div>
          `,
        },
        sendMailCallback
      );

      return { jwt: signedToken };
    } catch (e) {
      console.error(e);
    }
  } else {
    throw new Error(GENERAL_ERROR);
  }
};
