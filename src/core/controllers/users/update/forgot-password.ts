import { logoSvg } from "../../../../html";

import { EMAIL_ERROR, GENERAL_ERROR } from "../../../strings";
import {
  transporter,
  mailOptions,
  sendMailCallback,
  asyncRandomGenerate,
} from "../../../utils";
import { getUser } from "../find";

export const forgotPassword = async ({ email }) => {
  if (!email) {
    throw new Error(EMAIL_ERROR);
  }

  const [user, collection] = await getUser({ email }).catch((_) => {
    return [];
  });

  if (user) {
    const resetCode = await asyncRandomGenerate();
    await collection.findOneAndUpdate({ id: user.id }, { $set: { resetCode } });
    transporter.sendMail(
      {
        from: mailOptions.from,
        text: mailOptions.text,
        to: user.email,
        subject: `A11yWatch - Password reset.`,
        html: `${logoSvg}<br />
          <h1>Reset your password to A11yWatch</h1>
          <p style="font-size: 1rem;">Use the code below to reset your password.</p>
          <h2 style="margin-top: 18px; font-weight: bold; font-size: 2.3rem;">${resetCode}</h2>
          <p style="margin-top: 13px; font-size: 0.85rem;">If you enter the correct reset code you will receive an email with your temporary password.</p>
          `,
      },
      sendMailCallback
    );

    return { email: "true" };
  } else {
    throw new Error(GENERAL_ERROR);
  }
};
