import { isSameDay } from "date-fns";
import { footer } from "@app/html";

import {
  transporter,
  mailOptions,
  realUser,
  sendMailCallback,
  pluralize,
} from "../utils";
import { issuesFoundTemplate } from "../email_templates";
import { getUser } from "../controllers/users";
import { Issue, Website } from "@app/schema";

interface VerifySend {
  userId?: number;
  confirmedOnly: boolean;
  sendEmail: boolean;
}

// filter errors from issues
const filterCb = (iss: Issue) => iss?.type === "error";

const verifyUserSend = async ({
  userId,
  confirmedOnly = false,
  sendEmail = false,
}: VerifySend) => {
  let user;
  let collection;

  if (realUser(userId) && sendEmail) {
    const [u, c] = await getUser({ id: userId });

    const alertsDisabled =
      !user || !user?.alertEnabled || (confirmedOnly && !user?.emailConfirmed);

    if (
      !alertsDisabled &&
      (!user.lastAlertDateStamp ||
        !isSameDay(user?.lastAlertDateStamp, new Date()))
    ) {
      user = u;
      collection = c;
    }
  }

  return [user, collection];
};

// refactor to generic email sending [this is for single page scans]
const sendMail = async ({
  userId,
  data = {
    pageUrl: "",
    issues: [],
    domain: "",
  },
  confirmedOnly = false,
}: any) => {
  const issueCount = data?.issues?.issues?.length;

  const [findUser, userCollection] = await verifyUserSend({
    userId,
    confirmedOnly,
    sendEmail: issueCount,
  });

  if (findUser) {
    try {
      await userCollection.findOneAndUpdate(
        { id: userId },
        { $set: { lastAlertDateStamp: new Date() } }
      );
    } catch (e) {
      console.error(e);
    }

    try {
      await transporter.sendMail(
        Object.assign({}, mailOptions, {
          to: findUser.email,
          subject: `[Report] ${issueCount} ${pluralize(
            issueCount,
            "issue"
          )} found with ${data?.pageUrl || data?.domain}.`,
          html: `${issuesFoundTemplate(data)}<br />${footer.marketing({
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
};

// Multi page report for scans of domain
const sendMailMultiPage = async ({
  userId,
  data,
}: {
  userId: number;
  data: Website[];
}) => {
  const [findUser, userCollection] = await verifyUserSend({
    userId,
    confirmedOnly: true,
    sendEmail: true,
  });

  if (findUser) {
    try {
      await userCollection.findOneAndUpdate(
        { id: userId },
        { $set: { lastAlertDateStamp: new Date() } }
      );
    } catch (e) {
      console.error(e);
    }

    let totalIssues = 0;
    let domain;
    let issuesTable = "";

    for (const page of data) {
      const pageIssues = page?.issues;
      // @ts-ignore
      const subIssues: Issue[] = pageIssues?.issues ?? [];

      const issueCount = pageIssues?.length;

      if (subIssues.some(filterCb)) {
        const errorIssues = subIssues.filter(filterCb);

        if (!domain) {
          domain = page.domain;
        }

        if (issueCount) {
          totalIssues = totalIssues + errorIssues.length;
        }

        issuesTable =
          issuesTable +
          `<br />${issuesFoundTemplate(
            {
              issues: errorIssues,
              pageUrl: page.url,
            },
            "h3",
            true
          )}`;
      }
    }

    try {
      await transporter.sendMail(
        Object.assign({}, mailOptions, {
          to: findUser.email,
          subject: `[Report] ${totalIssues} ${pluralize(
            totalIssues,
            "issue"
          )} found with ${domain}.`,
          html: `<div style="margin-bottom: 12px; margin-top: 8px;">Login to see full report.</div>
          ${issuesTable}<br />${footer.marketing({
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
