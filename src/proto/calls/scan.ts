import { crawlMultiSite } from "@app/core/actions";
import { emailMessager } from "@app/core/messagers";
import { domainName } from "@app/core/utils";
import { crawlEmitter } from "@app/event";

// scan finished from crawl, either single page or all pages in a list
export const scan = async (call, callback) => {
  const { pages = [], user_id: userId, domain, full } = call?.request ?? {};

  // the collection of issues found for page scans.
  const data =
    (await crawlMultiSite({
      pages,
      userId,
    })) ?? [];

  // a full site wide-scan performed. Send scan event including email.
  if (full) {
    const sendEmail = crawlEmitter.emit(
      `crawl-${domainName(domain)}-${userId || 0}`,
      domain,
      data
    );

    if (!sendEmail) {
      await emailMessager.sendMailMultiPage({
        userId,
        data,
        domain,
        sendEmail, // if the event did not emit send email from CRON job.
      });
    }
  }

  callback(null, {});
};
