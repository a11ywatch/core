import { footer } from "../../html";

import {
  transporter,
  mailOptions,
  sendMailCallback,
  pluralize,
} from "../utils";
import { issuesResultsTemplate } from "../email_templates";
import { Website } from "../../types/schema";
import { DEV } from "../../config/config";
import { verifyUserSend } from "./verify";

// determine when a user last got alerted.
const updateLastAlertDate = async (userId, userCollection) => {
  try {
    await userCollection.findOneAndUpdate(
      { id: userId },
      { $set: { lastAlertDateStamp: new Date() } }
    );
  } catch (e) {
    console.error(e);
  }
};

// refactor to generic email sending [this is for single page scans]
const sendMail = async ({
  userId,
  data,
  confirmedOnly = false,
  sendEmail,
}: any) => {
  const [findUser, userCollection] = await verifyUserSend({
    userId,
    confirmedOnly: DEV ? false : confirmedOnly,
    sendEmail,
  });

  if (findUser) {
    await updateLastAlertDate(userId, userCollection);

    const { pageUrl, domain, issuesInfo } = data;

    const {
      errorCount,
      warningCount,
      totalIssues: tot,
    } = issuesInfo ?? { errorCount: 0, warningCount: 0, totalIssues: 0 };

    const totalIssues = Number(errorCount); // errors
    const totalWarnings = Number(warningCount);
    const total = Number(tot);

    const issuesTable = `${issuesResultsTemplate(
      {
        total,
        totalIssues,
        totalWarnings,
        pageUrl,
      },
      "h2",
      true,
      !findUser?.role
    )}`;

    try {
      await transporter?.sendMail(
        Object.assign({}, mailOptions, {
          to: findUser.email,
          subject: `[Report] ${totalIssues} ${pluralize(
            totalIssues,
            "issue"
          )} found with ${pageUrl || domain}.`,
          html: `${issuesTable}<br />${footer.marketing({
            userId,
            email: findUser.email,
          })}`,
        }),
        sendMailCallback
      );
    } catch (e) {
      console.error(e);
    }
  }
};

// Multi page report for scans of domain
const sendMailMultiPage = async ({
  userId,
  data,
  domain,
  sendEmail = true,
}: {
  userId: number;
  data: Website[];
  domain: string;
  sendEmail?: boolean;
}) => {
  const [user, userCollection] = await verifyUserSend({
    userId,
    confirmedOnly: true,
    sendEmail,
  });

  if (user) {
    try {
      await updateLastAlertDate(userId, userCollection);
    } catch (e) {
      console.error(e);
    }

    let total = 0;
    let totalWarnings = 0;
    let totalIssues = 0;
    // let totalNotices = 0;
    let issuesTable = "";

    let pageUrl = "";

    for (const page of data) {
      const issuesInfo = page?.issuesInfo;

      if (!domain) {
        pageUrl = page.domain;
      }

      if (issuesInfo?.totalIssues) {
        totalIssues = totalIssues + issuesInfo.errorCount;
        totalWarnings = totalWarnings + issuesInfo.warningCount;
      }
    }

    total = totalWarnings + totalIssues;

    issuesTable = `<br />${issuesResultsTemplate(
      {
        totalIssues,
        totalWarnings,
        total,
        pageUrl,
      },
      "h3",
      true,
      !user?.role
    )}`;

    // if errors exist send email
    if (Number(totalIssues) >= 1) {
      try {
        await transporter.sendMail(
          Object.assign({}, mailOptions, {
            to: user.email,
            subject: `[Report] ${totalIssues} ${pluralize(
              totalIssues,
              "issue"
            )} found with ${domain}.`,
            html: `
            <div style="margin-bottom: 12px; margin-top: 8px;">Login to see the full report.</div>
            ${issuesTable}<br />${footer.marketing({
              userId,
              email: user?.email,
            })}`,
          }),
          sendMailCallback
        );
      } catch (e) {
        console.error(e);
      }
    }
  }
};

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
  sendMail,
  // send multi page issues
  sendMailMultiPage,
};
