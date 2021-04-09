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
      if (i === 4) {
        return true
      }
      listData = `${listData}<tr><td>${item?.type}</td><td>${item?.context}</td><td>${item?.message}</td></tr>`
      return false
    })
  }

  const page = data?.pageUrl
  return `<div>
    <h1>${data?.issues?.length} issues found for ${page}</h1>
    <table><tr><th>Type</th><th>Message</th><th>Context</th></tr>${listData}</table>
    <a href="https://www.a11ywatch.com/dashboard" style="font-weight: 800; font-size: 1.8em; display: block; background: #5c6bc0; padding: 8px; color: white; text-align: center; text-decoration: none; margin-bottom: 10px;">View Details</a>
    <a href="https://api.a11ywatch.com/api/get-website?q=${page}&download=true" style="font-weight: 800; font-size: 1.8em; display: block; background: #fff; padding: 8px; color: #ccc; text-align: center; text-decoration: none;">Download Report</a>
    <p style="margin-top:10; margin-bottom: 10px;">If you want to stop receiving emails toggle the alert setting to off on the dashboard</p>
  </div>
`
}

export { issuesFoundTemplate }
