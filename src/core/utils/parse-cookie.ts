/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

interface AppCookie {
  jwt?: string;
  on?: string;
}

export function parseCookie(cookiesString?: string): AppCookie | null {
  if (!cookiesString) {
    return null;
  }
  return cookiesString
    .split(";")
    .map((cookieString) => cookieString.trim().split("="))
    .reduce(function (acc, curr) {
      acc[curr[0]] = curr[1];
      return acc;
    }, {});
}
