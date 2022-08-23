import { FastifyContext } from "apollo-server-fastify";
import { initUrl } from "@a11ywatch/website-source-builder";
import { downloadToExcel, getUserFromToken } from "../../../core/utils";
import { getReport } from "../../../core/controllers/reports";
import { retreiveUserByToken } from "../../../core/utils/get-user-data";
import { paramParser } from "../../params/extracter";
import { StatusCode } from "../../messages/message";
import { responseModel } from "../../../core/models";
import { URL_NOT_FOUND } from "../../../core/strings/errors";
import type { Website } from "@app/types/types";
// import { redisClient } from "@app/database/memory-client";

// TODO: Refactor usage
export const getWebsiteAPI = async (
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

  try {
    const report = await getReport(query, userId);

    if (report?.website) {
      data = report.website;
    }
  } catch (e) {
    console.error(e);
  }

  // download report to excel
  if (download) {
    if (data) {
      try {
        return await downloadToExcel(req, res, data);
      } catch (e) {
        console.error(e);
      }
    } else {
      res.send("Error downloading report. Report not found.");
      return;
    }
  }

  res.send(data);
};

// get a report and include the authenticated user
export const getWebsiteReport = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  const q = paramParser(req, "q");
  const url = paramParser(req, "url");
  const pageUrl = paramParser(req, "pageUrl");
  const slug = q || url || pageUrl;

  if (!slug) {
    res.status(404);
    res.send(false);
    return;
  }

  let userId;

  try {
    const [user] = await retreiveUserByToken(req.headers.authorization);
    if (user) {
      userId = user.id;
    }
  } catch (_) {}

  const query = initUrl(decodeURIComponent(slug + ""));

  let data: Website = null;

  try {
    const report = await getReport(query, userId);
    if (report?.website) {
      data = report.website;
    }
  } catch (e) {
    console.error(e);
  }

  res.send(data);
};
