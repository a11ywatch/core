/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/
import { connect } from "@app/database";

const httpPattern = /^((http|https):\/\/)/;

export const getReport = async (url: string, timestamp?: string | number) => {
  try {
    const [collection] = await connect("Reports");

    let findBy;

    // find by domain if http not found
    if (!httpPattern.test(url)) {
      findBy = {
        "website.domain": url,
      };
    } else {
      findBy = typeof timestamp !== "undefined" ? { url, timestamp } : { url };
    }

    const report = await collection.findOne(findBy);

    if (!report) {
      return await collection.findOne({
        url,
      });
    }

    return report;
  } catch (e) {
    console.error(e);
  }
};
