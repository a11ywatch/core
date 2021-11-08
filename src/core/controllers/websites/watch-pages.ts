/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import fetch from "node-fetch";
import { initUrl } from "@a11ywatch/website-source-builder";
import { realUser } from "@app/core/utils";
import { emailMessager } from "@app/core/messagers";
import { crawlWebsite } from "@app/core/controllers/subdomains/update";
import { log } from "@a11ywatch/log";
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

    for (
      let websiteIterator = 0;
      websiteIterator < allWebPages.length;
      websiteIterator++
    ) {
      const { domain, userId, url, role } = getPageItem(
        allWebPages[websiteIterator]
      );

      if (!realUser(userId) || !domain) {
        log(`request did not run for - user id: ${userId} - domain: ${domain}`);
      } else {
        const [user] = await getUser({ id: userId }, true);

        // TODO: move should email determination upfront before heavy process the prior nightly jobs with 5 hour gap
        const sendEmail =
          user &&
          Array.isArray(user?.emailFilteredDates) &&
          !user?.emailFilteredDates.includes(getDay(subHours(new Date(), 5)));

        if (role === 0) {
          await crawlWebsite(
            {
              url,
              userId,
            },
            sendEmail
          );
        } else {
          await fetch(`${process.env.WATCHER_CLIENT_URL}/crawl`, {
            method: "POST",
            body: JSON.stringify({
              url: new String(initUrl(url, true)),
              userId: new Number(userId),
            }),
            headers: { "Content-Type": "application/json" },
          });
          // TODO: SEND EMAIL ONCE CRAWL FINISHED PREMIUM
        }
      }

      console.debug(["Watch Counter", websiteIterator, allWebPages.length]);

      if (websiteIterator === allWebPages.length - 1) {
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
        log("WEBSITE WATCHER FINISHED ALL WEBSITES");
      }
    }
  } catch (e) {
    log(e, { type: "error" });
  }
}
