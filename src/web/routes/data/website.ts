import { FastifyContext } from "apollo-server-fastify";
import { initUrl } from "@a11ywatch/website-source-builder";
import { downloadToExcel, getUserFromToken } from "../../../core/utils";
import { getReport } from "../../../core/controllers/reports";
import { paramParser } from "../../params/extracter";
import { StatusCode } from "../../messages/message";
import { responseModel } from "../../../core/models";
import { URL_NOT_FOUND } from "../../../core/strings/errors";
import type { Website } from "../../../types/types";

// TODO: Refactor usage
export const getWebsiteReport = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  const download = paramParser(req, "download");
  const slug =
    paramParser(req, "q") ||
    paramParser(req, "url") ||
    paramParser(req, "pageUrl");

  if (!slug) {
    res.status(StatusCode.BadRequest);
    res.send(
      responseModel({
        success: false,
        code: StatusCode.BadRequest,
        message: URL_NOT_FOUND,
      })
    );
    return;
  }

  const usr = getUserFromToken(req.headers.authorization);
  const userId = usr?.payload?.keyid;

  const query = initUrl(decodeURIComponent(slug));
  let data: Website;

  const report = await getReport(query, userId);

  if (report?.website) {
    data = report.website;
  }

  // download report to excel
  if (download) {
    if (data) {
      return await downloadToExcel(req, res, data);
    } else {
      res.send("Error downloading report. Report not found.");
      return;
    }
  }

  res.send(data);
};
