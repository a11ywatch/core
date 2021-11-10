/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import fetch from "node-fetch";
import { emailMessager } from "@app/core/messagers";
import { crawlWebsite } from "@app/core/controllers/subdomains/update";
import { getWebsitesWithUsers } from "../websites";
import { getUser } from "../users";
import { getPageItem } from "./utils";
import { getDay, subHours } from "date-fns";

export async function websiteWatch(): Promise<void> {
  try {
    await fetch(`${process.env.MAV_CLIENT_URL}/api/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const allWebPages = await getWebsitesWithUsers();

    for await (const website of allWebPages) {
      const { userId, url } = getPageItem(website);
      const [user] = await getUser({ id: userId }, true);

      const sendEmail =
        user && Array.isArray(user?.emailFilteredDates)
          ? !user.emailFilteredDates.includes(getDay(subHours(new Date(), 5)))
          : true;

      await crawlWebsite(
        {
          url,
          userId,
        },
        sendEmail
      ).catch((reason) => {
        console.log(reason);
      });

      console.debug(["Watch", website, allWebPages.length]);

      if (website.id === allWebPages[allWebPages.length - 1].id) {
        console.log("CRAWLER JOB COMPLETE..");
        await emailMessager.sendFollowupEmail({
          emailConfirmed: true,
          email: process.env.EMAIL_MAIN_LEAD,
          subject: `CRAWLER FINISHED ENV:${process.env.NODE_ENV}`,
          html: `<h1>All ${allWebPages.length} pages crawled </h1>`,
        });
        await fetch(`${process.env.MAV_CLIENT_URL}/api/clear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  } catch (e) {
    console.log(e, { type: "error" });
  }
}
