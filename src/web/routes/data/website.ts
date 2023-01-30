import { FastifyContext } from "apollo-server-fastify";
import { initUrl } from "@a11ywatch/website-source-builder";
import { createObjectCsvStringifier } from "csv-writer";
import { downloadToExcel, getUserFromToken } from "../../../core/utils";
import { getReport } from "../../../core/controllers/reports";
import { paramParser } from "../../params/extracter";
import { StatusCode } from "../../messages/message";
import { responseModel } from "../../../core/models";
import { URL_NOT_FOUND } from "../../../core/strings/errors";
import type { Website } from "../../../types/types";

const csvStringifier = createObjectCsvStringifier({
  header: [
    { id: "code", title: "CODE" },
    { id: "type", title: "TYPE" },
    { id: "message", title: "MESSAGE" },
    { id: "context", title: "CONTEXT" },
    { id: "selector", title: "SELECTOR" },
    { id: "recurrence", title: "RECURRENCE" },
  ],
});

const csvHeader = csvStringifier.getHeaderString().trim();

// TODO: Refactor usage
export const getWebsiteReport = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  const download = paramParser(req, "download");
  const csv = paramParser(req, "csv");

  const slug =
    paramParser(req, "q") ||
    paramParser(req, "url") ||
    paramParser(req, "pageUrl");

  if (!slug) {
    res.status(StatusCode.BadRequest);
    return res.send(
      responseModel({
        success: false,
        code: StatusCode.BadRequest,
        message: URL_NOT_FOUND,
      })
    );
  }

  const usr = getUserFromToken(req.headers.authorization);
  const userId = usr?.payload?.keyid;

  const query = initUrl(decodeURIComponent(slug));
  let data: Website;

  const report = await getReport(query, userId);

  if (report?.website) {
    data = report.website;
  }

  // send output as csv
  if (req.headers["content-type"] === "text/csv" || csv) {
    res.header("Content-Type", "text/csv");
    res.header(
      "Content-Disposition",
      "attachment; filename=" +
        `${encodeURIComponent(data.url)}-${data.lastScanDate}-audit.csv`
    );

    return res.status(StatusCode.Ok).send(
      Buffer.from(
        `${csvHeader}\n${csvStringifier.stringifyRecords(
          // @ts-ignore
          data?.issue?.length ? data.issue : data?.issues
        )}`
      )
    );
  }

  // download report to excel
  if (download) {
    if (data) {
      return await downloadToExcel(req, res, data);
    } else {
      return res.send("Error downloading report. Report not found.");
    }
  }

  res.send(data);
};
