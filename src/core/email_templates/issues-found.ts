import { getHostName } from "@a11ywatch/website-source-builder";
import type { Issue } from "@app/types";
import { pluralize } from "../utils";

export interface Data {
  issues: Issue[] | [];
  pageUrl: string;
}

export interface IssuesFound {
  (data: Data, headingElement?: string, hideFooter?: boolean): string;
}

// return issues as in table form
const issuesFoundTemplate: IssuesFound = (
  data = { issues: [], pageUrl: "" },
  headingElement = "h1",
  hideFooter = false
) => {
  let listData = "";
  const tdStyles = `style="border: 1px solid #ddd; padding: 6px;"`;
  const errorIssues = data?.issues || []; // display with limits for email generation

  if (errorIssues?.length) {
    // loop until
    errorIssues.some((item: Issue, i: number) => {
      if (i === 10) {
        return true;
      }
      listData = `${listData}<tr><td ${tdStyles}><code>${
        item?.context ?? "N/A"
      }</code></td><td ${tdStyles}>${item?.message ?? "N/A"}</td></tr>`;
      return false;
    });
  }

  const page = data?.pageUrl;
  const thStyles = `style="border: 1px solid #ddd; padding: 6px; padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #444c56; color: white;"`;

  const target = page; // TODO: use domain only
  let hostName;

  try {
    hostName = getHostName(target);
  } catch (e) {
    console.error(e);
  }

  const targetUrl = encodeURIComponent(target);
  const issueCount = data?.issues?.length;

  return `
    ${
      hideFooter
        ? `<head>
      <style>
        tr:nth-child(even){background-color: #f2f2f2;}
        tr:hover {background-color: #ddd;}
      </style>
    </head>`
        : ""
    }
    <${headingElement || "h1"}>${issueCount} ${pluralize(
    issueCount,
    "issue"
  )} found for ${page}</${headingElement || "h1"}>
    ${
      hideFooter
        ? ""
        : `<div style="margin-bottom: 12px; margin-top: 8px;">Login to see full report.</div>`
    }
    <div style="overflow:auto;">
      <table class="a11y-view" style="font-family: system-ui, Arial; border-collapse: collapse; table-layout: auto; width: 100%;">
        <tr>
          <th ${thStyles}>Element</th>
          <th ${thStyles}>Recommendation</th>
        </tr>
        ${listData}
      </table>
    </div>
    <a href="https://a11ywatch.com" style="font-weight: 800; font-size: 1.8em; display: block; background: #5c6bc0; padding: 8px; color: white; text-align: center; text-decoration: none;">View Full Details</a>
    <a href="https://a11ywatch.com/reports/${targetUrl}" style="font-weight: 800; font-size: 1.8em; display: block; background: #111; padding: 8px; color: #fff; text-align: center; text-decoration: none;">View Report</a>
    <a href="https://api.a11ywatch.com/api/get-website?q=${hostName}&download=true" style="font-weight: 800; font-size: 1.8em; display: block; background: #fff; padding: 8px; color: #000; text-align: center; text-decoration: none;">Download Report</a>
    ${
      hideFooter
        ? ""
        : `<p style="margin-top:10px; margin-bottom: 10px;">If you want to stop receiving emails toggle the alert setting to off on the dashboard</p>`
    }
`.trim();
};

export interface IssuesResultsFound {
  (
    data: {
      totalIssues: number;
      totalWarnings: number;
      total: number;
      totalNotices?: number;
      pageUrl: string;
      score?: number;
    },
    headingElement?: string,
    hideFooter?: boolean,
    freeAcount?: boolean
  ): string;
}

// return issues as in table form
export const issuesResultsTemplate: IssuesResultsFound = (
  data,
  headingElement = "h1",
  hideFooter = false,
  freeAcount = true
) => {
  const page = data?.pageUrl;

  const target = page; // TODO: use domain only
  let hostName;

  try {
    hostName = getHostName(target);
  } catch (e) {
    console.error(e);
  }

  const {
    totalIssues,
    totalWarnings,
    total,
    totalNotices = 0,
    score: hs,
  } = data;

  const targetUrl = encodeURIComponent(target);
  const issueCount = total;
  const tcellBase = `color: #333; font-size:14px; line-height:18px; font-family: system-ui,Helvetica,Arial,san-serif;`;
  const tcellStyle = `style="${tcellBase}; padding-left:4px; padding-right:4px; height:14px; padding:0"`;
  const tcellStyleImg = `style="${tcellBase}; height:14px; width:14px; padding:0; display: inline"`;
  const tcellStyleEnd = `style="${tcellBase}; text-align:right;padding-left:16px; width:1%"`;
  const thStyles = `style="border: 1px solid #ddd; padding: 6px; padding-top: 12px; padding-bottom: 12px; text-align: left"`;

  // TODO: use warnings that are impacted.
  const score = hs ?? 100 - totalIssues * 2;

  return `
    <${headingElement || "h1"}>${issueCount} ${pluralize(
    issueCount,
    "issue"
  )} found for ${page}</${headingElement || "h1"}>
    ${
      hideFooter
        ? ""
        : `<div style="margin-bottom: 12px; margin-top: 8px;">Login to see full report.</div>`
    }
    <div style="display:inline-block">
      <div style="overflow:auto; padding-top: 8px; padding-bottom:8px; border: 1px solid #ccc; border-radius: 1px; width:47.5%; display: inline-block; height: 150px">
        <div class="a11y-view" style="font-family: system-ui, Arial; background:#fff; padding-left:16px; padding-right:16px">
          <h3 style="margin-bottom: 6px; font-weight: 800">Health</h3>
          <h4 style="margin-bottom: 6px; font-weight: 800">${score}</h4>
          <p>
           ${
             freeAcount
               ? `Health Score reflects the errors on the current url, <a href={"https://a11ywatch.com/payments"}>upgrade</a> your account to get site-wide monitoring and much more.`
               : `Health Score reflects the proportion of URLs that don't have errors.`
           }
          </p>
        </div>
      </div>
      <div style="overflow:auto; padding-top: 8px;padding-bottom:8px; border: 1px solid #ccc; border-radius: 1px; width:47.5%; display: inline-block; height: 150px">
        <div class="a11y-view" style="font-family: system-ui, Arial; background:#fff; padding-left:16px; padding-right:16px">
          <h3 style="margin-bottom: 6px; font-weight: 800">Issues</h3>
          <table style="padding-top: 24px; border-collapse:separate; border-spacing:0; width:100%">
            <tbody>
              <tr ${thStyles}>
                <td ${tcellStyleImg}><img src="https://a11ywatch.com/img/emailer/error.png" alt="critical" style="height:14px;width:14px;vertical-align:middle"></td>
                <td ${tcellStyle}>Errors</td>
                <td ${tcellStyleEnd}>${totalIssues}</td>
              </tr>
              <tr ${thStyles}>
                <td ${tcellStyleImg}><img src="https://a11ywatch.com/img/emailer/warning.png" alt="warning" style="height:14px;width:14px;vertical-align:middle"></td>
                <td ${tcellStyle}>Warnings</td>
                <td ${tcellStyleEnd}>${totalWarnings}</td>
              </tr>
              <tr ${thStyles}>
                <td ${tcellStyleImg}><img src="https://a11ywatch.com/img/emailer/notices.png" alt="notice" style="height:14px;width:14px;vertical-align:middle"></td>
                <td ${tcellStyle}>Notices</td>
                <td ${tcellStyleEnd}>${totalNotices}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div style="padding-top: 12px; padding-bottom: 12px">
      <div style="padding-top: 12px; padding-bottom: 12px; border: 1px solid #ccc; margin-bottom: 6px; border-radius: 2px">
        <a href="https://a11ywatch.com" style="font-weight: 800; font-size: 1.8em; display: block; padding: 8px; text-align: center; text-decoration: none">View Full Details</a>
      </div>
      <div style="padding-top: 12px; padding-bottom: 12px; border: 1px solid #ccc; margin-bottom: 6px; border-radius: 2px">
        <a href="https://a11ywatch.com/reports/${targetUrl}" style="font-weight: 800; font-size: 1.8em; display: block; padding: 8px; text-align: center; text-decoration: none">View Report</a>
      </div>
      <div style="padding-top: 12px; padding-bottom: 12px; border: 1px solid #ccc; margin-bottom: 6px; border-radius: 2px">
        <a href="https://api.a11ywatch.com/api/get-website?q=${hostName}&download=true" style="font-weight: 800; font-size: 1.8em; display: block; padding: 8px; text-align: center; text-decoration: none">Download Report</a>
      </div>
    </div>
    ${
      hideFooter
        ? ""
        : `<p style="margin-top:10px; margin-bottom: 10px;">If you want to stop receiving emails toggle the alert setting to off on the dashboard</p>`
    }
`.trim();
};

export { issuesFoundTemplate };
