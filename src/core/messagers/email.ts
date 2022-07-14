import { isSameDay } from "date-fns";
import { footer } from "@app/html";

import {
  transporter,
  mailOptions,
  realUser,
  sendMailCallback,
  pluralize,
} from "../utils";
import { issuesResultsTemplate } from "../email_templates";
import { getUser } from "../controllers/users";
import { Issue, Website } from "@app/schema";
import { DEV } from "@app/config";
import { getEmailAllowedForDay } from "@app/core/utils/filters";

interface VerifySend {
  userId?: number;
  confirmedOnly: boolean;
  sendEmail: boolean;
}

// filter errors from issues
const filterCb = (iss: Issue) => iss?.type === "error";
const filterWarningsCb = (iss: Issue) => iss?.type === "warning";

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

const verifyUserSend = async ({
  userId,
  confirmedOnly = false, // confirmed only requires user id - non marketing sending.
  sendEmail = false, // conditional to determine email sending. Without having to use conditionals.
}: VerifySend) => {
  let userResponse;
  let collectionResponse;

  // if the boolean is true the email send is allowed. TODO: remove from section.
  if (sendEmail && realUser(userId)) {
    try {
      const [user, collection] = await getUser({ id: userId });

      const userAlertsDisabled = !user || !user?.alertEnabled; // user alerts set to disabled.
      const confirmedOnlyUsers = confirmedOnly && !user?.emailConfirmed; // user email is not confirmed.

      const alertsDisabled = userAlertsDisabled || confirmedOnlyUsers; // if  user alerts disabled or email confirmed do not send.

      // if not the same day from last email
      if (!alertsDisabled && getEmailAllowedForDay(user)) {
        if (
          !user.lastAlertDateStamp ||
          !isSameDay(user?.lastAlertDateStamp, new Date())
        ) {
          userResponse = user;
          collectionResponse = collection;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  return [userResponse, collectionResponse];
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
    try {
      await updateLastAlertDate(userId, userCollection);
    } catch (e) {
      console.error(e);
    }

    const { pageUrl, domain, issues = [], issuesInfo } = data;

    let totalIssues = 0; // errors
    let totalWarnings = 0;
    let total = 0;

    // if issues object exist, use direct value.
    if (issuesInfo) {
      totalIssues = issuesInfo.errorCount;
      totalWarnings = issuesInfo.warningCount;

      total = issuesInfo.totalIssues;
    } else {
      const issueCount = issues?.length;
      // TODO: remove back compat support
      if (issueCount) {
        const errorIssues = issues.filter(filterCb);
        const warningIssues = issues.filter(filterWarningsCb);

        totalIssues = errorIssues.length;
        totalWarnings = warningIssues.length;

        total = totalIssues + totalWarnings;
      }
    }

    // issuesInfo not returning count
    console.debug(
      `IssueInfo from cron with errors: ${totalIssues} and warnings: ${totalWarnings}`,
      issuesInfo
    );

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
      const issues = page?.issues ?? [];
      const issueCount = issues?.length;

      if (!domain) {
        pageUrl = page.url;
      }
      const errorIssues = issues.filter(filterCb);
      const warningIssues = issues.filter(filterWarningsCb);

      if (issueCount) {
        totalIssues = totalIssues + errorIssues.length;
        totalWarnings = totalWarnings + warningIssues.length;
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
