/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import type { Issue } from "@app/types"

export interface Data {
  issues: [Issue] | []
  pageUrl: string
}

export interface IssuesFound {
  (data: Data): string
}

const issuesFoundTemplate: IssuesFound = (
  data = { issues: [], pageUrl: "" }
) => {
  let listData = ""

  if (data.issues?.length) {
    data.issues.some((item: Issue, i: number) => {
      if (i === 10) {
        return true
      }
      listData = `${listData}<tr><td>${item?.type}</td><td>${item?.context}</td><td>${item?.message}</td></tr>`
      return false
    })
  }

  const page = data?.pageUrl

  return `
    <style>
    #a11yIssues {
      font-family: system-ui, Arial, Helvetica, sans-serif;
      border-collapse: collapse;
      width: 100%;
    }

    #a11yIssues td, #a11yIssues th {
      border: 1px solid #ddd;
      padding: 8px;
    }

    #a11yIssues tr:nth-child(even){background-color: #f2f2f2;}

    #a11yIssues tr:hover {background-color: #ddd;}

    #a11yIssues th {
      padding-top: 12px;
      padding-bottom: 12px;
      text-align: left;
      background-color: #444c56;
      color: white;
    }
    </style>
    <h1>${data?.issues?.length} issues found for ${page}</h1>
    <div style="overflow-x:auto;">
    <table id="a11yIssues"><tr><th>Type</th><th>Message</th><th>Context</th></tr>${listData}</table>
    </div>
    <a href="https://www.a11ywatch.com/dashboard" style="font-weight: 800; font-size: 1.8em; display: block; background: #5c6bc0; padding: 8px; color: white; text-align: center; text-decoration: none; margin-bottom: 10px;">View Details</a>
    <a href="https://api.a11ywatch.com/api/get-website?q=${page}&download=true" style="font-weight: 800; font-size: 1.8em; display: block; background: #fff; padding: 8px; color: #ccc; text-align: center; text-decoration: none;">Download Report</a>
    <p style="margin-top:10px; margin-bottom: 10px;">If you want to stop receiving emails toggle the alert setting to off on the dashboard</p>
`.trim()
}

export { issuesFoundTemplate }
