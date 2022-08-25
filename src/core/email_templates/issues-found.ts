import { getHostName } from "@a11ywatch/website-source-builder";
import type { Issue } from "../../types/types";
import { pluralize } from "../utils";

export interface Data {
  issues: Issue[] | [];
  pageUrl: string;
}

export interface IssuesFound {
  (data: Data, headingElement?: string, hideFooter?: boolean): string;
}

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
    freeAccount?: boolean
  ): string;
}

// return issues as in table form
export const issuesResultsTemplate: IssuesResultsFound = (
  data,
  headingElement = "h1",
  hideFooter = false,
  freeAccount = true
) => {
  const {
    total,
    totalIssues,
    totalWarnings,
    totalNotices = 0,
    score: hs,
    pageUrl,
  } = data;

  let hostName;

  try {
    hostName = getHostName(pageUrl);
  } catch (e) {
    console.error(e);
  }

  const targetUrl = encodeURIComponent(pageUrl);

  const tcellBase = `color: #333; font-size:14px; line-height:18px; font-family: system-ui,Helvetica,Arial,san-serif;`;
  const tcellStyle = `style="${tcellBase}; padding-left:4px; padding-right:4px; height:14px; padding:0"`;
  const tcellStyleImg = `style="${tcellBase}; height:14px; width:14px; padding:0; display: inline"`;
  const tcellStyleEnd = `style="${tcellBase}; text-align:right;padding-left:16px; width:1%"`;
  const thStyles = `style="border: 1px solid #ddd; padding: 6px; padding-top: 12px; padding-bottom: 12px; text-align: left"`;

  // TODO: use warnings that are impacted.
  const score = hs ?? 100 - totalIssues * 2;

  return `
    <${headingElement || "h1"}>${total} ${pluralize(
    total,
    "issue"
  )} found for ${pageUrl}</${headingElement || "h1"}>
    ${
      hideFooter
        ? ""
        : `<div style="margin-bottom: 12px; margin-top: 8px;">Login to see full report.</div>`
    }
    <div style="display:inline-block">
      <div style="overflow:auto; padding-top: 8px; padding-bottom:8px; border: 1px solid #ccc; border-radius: 1px; width:47.5%; display: inline-block; min-height: 185px">
        <div class="a11y-view" style="font-family: system-ui, Arial; background:#fff; padding-left:16px; padding-right:16px">
          <h3 style="margin-bottom: 6px; font-weight: 800">Health</h3>
          <h4 style="margin-bottom: 6px; font-weight: 800">${score}</h4>
          <p>
           ${
             freeAccount
               ? `Health score reflects the errors on the current url.`
               : `Health score reflects the proportion of URLs that don't have errors.`
           }
          </p>
        </div>
      </div>
      <div style="overflow:auto; padding-top: 8px;padding-bottom:8px; border: 1px solid #ccc; border-radius: 1px; width:47.5%; display: inline-block; min-height: 185px">
        <div class="a11y-view" style="font-family: system-ui, Arial; background:#fff; padding-left:16px; padding-right:16px">
          <h3 style="margin-bottom: 6px; font-weight: 800">Issues</h3>
          <h4 style="margin-bottom: 6px; font-weight: 800">${total}</h4>
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

    ${
      freeAccount
        ? `
    <div style="padding-top: 6px; padding-bottom: 6px">
      <a href="https://a11ywatch.com/payments" style="color: rgb(37, 99, 235); padding: 0.2em">Upgrade your account</a> to get site-wide monitoring and much more.
    </div>
    `
        : ""
    }
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
