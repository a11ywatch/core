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
