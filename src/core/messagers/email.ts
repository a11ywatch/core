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

const updateLastScanDate = async (userId, userCollection) => {
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
    const [user, collection] = await getUser({ id: userId });

    const alertsDisabled =
      !user || !user?.alertEnabled || (confirmedOnly && !user?.emailConfirmed);

    if (
      !alertsDisabled &&
      (!user.lastAlertDateStamp ||
        !isSameDay(user?.lastAlertDateStamp, new Date()))
    ) {
      userResponse = user;
      collectionResponse = collection;
    }
  }

  return [userResponse, collectionResponse];
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
  sendEmail,
}: any) => {
  const [findUser, userCollection] = await verifyUserSend({
    userId,
    confirmedOnly,
    sendEmail,
  });

  if (findUser) {
    try {
      await updateLastScanDate(userId, userCollection);
    } catch (e) {
      console.error(e);
    }

    const issueCount = data?.issues?.length;

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
  domain,
}: {
  userId: number;
  data: Website[];
  domain: string;
}) => {
  const [findUser, userCollection] = await verifyUserSend({
    userId,
    confirmedOnly: true,
    sendEmail: true,
  });

  if (findUser) {
    try {
      await updateLastScanDate(userId, userCollection);
    } catch (e) {
      console.error(e);
    }

    let totalIssues = 0;
    let issuesTable = "";

    for (const page of data) {
      const pageIssues = page?.issues;
      // @ts-ignore
      const subIssues: Issue[] = pageIssues?.issues ?? [];

      const issueCount = subIssues?.length;

      if (subIssues.some(filterCb)) {
        const errorIssues = subIssues.filter(filterCb);

        if (issueCount) {
          totalIssues = totalIssues + subIssues.length;
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

    // if errors exist send email
    if (Number(totalIssues) >= 1) {
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
