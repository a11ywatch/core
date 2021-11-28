/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

const stripUrlEndingSlash = (url: string): string => {
  let cleanUrlParse = url;

  if (url[url.length - 1] === "/") {
    cleanUrlParse = cleanUrlParse.slice(0, -1);
  }
  return cleanUrlParse;
};

export { stripUrlEndingSlash };
