import { isSameDay } from "date-fns";
import { connect } from "@app/database";
import { footer } from "@app/html";

import {
  transporter,
  mailOptions,
  realUser,
  sendMailCallback,
  pluralize,
} from "../utils";
import { issuesFoundTemplate } from "../email_templates";

export const emailMessager = {
  sendFollowupEmail: async ({
    email,
    emailConfirmed,
    subject = "",
    html,
  }: any) => {
    if (emailConfirmed && email && subject && html) {
      try {
        await transporter.sendMail(
          Object.assign({}, mailOptions, {
            to: email,
            subject: subject,
            html,
          }),
          sendMailCallback
        );
      } catch (e) {
        console.error(e);
      }
    }
  },
  // send issues related to domain email report
  sendMail: async ({
    userId,
    data = {
      pageUrl: "",
      issues: [],
      domain: "",
    },
    confirmedOnly = false,
  }: any) => {
    const issueCount = data?.issues?.length;
    if (realUser(userId) && issueCount) {
      const [userCollection] = await connect("Users");
      const findUser = await userCollection.findOne({ id: userId });

      if (
        !findUser ||
        !findUser?.alertEnabled ||
        (confirmedOnly && !findUser?.emailConfirmed)
      ) {
        return null;
      }

      const currentDate = new Date();

      if (
        !findUser.lastAlertDateStamp ||
        !isSameDay(findUser?.lastAlertDateStamp, currentDate)
      ) {
        try {
          await userCollection.findOneAndUpdate(
            { id: userId },
            { $set: { lastAlertDateStamp: currentDate } }
          );

          await transporter.sendMail(
            Object.assign({}, mailOptions, {
              to: findUser.email,
              subject: `[Report] ${issueCount} ${pluralize(
                issueCount,
                "issue"
              )} found with ${data?.pageUrl || data?.domain}.`,
              html: `<br /><h1>${issuesFoundTemplate(
                data
              )}<br />${footer.marketing({
                userId,
                email: findUser?.email,
              })}`,
            }),
            sendMailCallback
          );
        } catch (e) {
          console.error(e);
        }
      }
    }
  },
};
