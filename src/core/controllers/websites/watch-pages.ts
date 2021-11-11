/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import fetcher from "node-fetch";
import { emailMessager } from "@app/core/messagers";
import { crawlWebsite } from "@app/core/controllers/subdomains/update";
import { getWebsitesWithUsers } from "../websites";
import { getUser } from "../users";
import { getPageItem } from "./utils";
import { getDay, subHours } from "date-fns";

const fetchOptions = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
};

const cleanupWatcher = async (allWebPages: any[] = []) => {
  await emailMessager.sendFollowupEmail({
    emailConfirmed: true,
    email: process.env.EMAIL_MAIN_LEAD,
    subject: `CRAWLER FINISHED ENV:${process.env.NODE_ENV}`,
    html: `<h1>All ${allWebPages.length} pages crawled </h1>`,
  });
  await fetcher(`${process.env.MAV_CLIENT_URL}/api/clear`, fetchOptions);
};

export async function websiteWatch(): Promise<void> {
  let allWebPages = [];
  let pageCounter = 0;

  try {
    allWebPages = await getWebsitesWithUsers();
  } catch (e) {
    console.error(e);
  }

  try {
    await fetcher(`${process.env.MAV_CLIENT_URL}/api/init`, fetchOptions);

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
      );

      pageCounter++;
      console.log(`Watcher page ${pageCounter}, of ${allWebPages.length}`);

      if (pageCounter === allWebPages.length) {
        console.log("CRAWLER JOB COMPLETE..");
        await cleanupWatcher(allWebPages);
      }
    }
  } catch (e) {
    console.error(e);
    await cleanupWatcher(allWebPages);
  }
}
