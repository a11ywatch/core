import type { Request, Response } from "express";
import { getReport } from "@app/core/controllers/reports";
import { downloadToExcel, getUserFromToken } from "@app/core/utils";
import { Website } from "@app/types/types";
import { initUrl } from "@a11ywatch/website-source-builder";
import { retreiveUserByToken } from "@app/core/utils/get-user-data";
import { paramParser } from "@app/web/extracter";
// import { redisClient } from "@app/database/memory-client";

// TODO: Refactor usage
export const getWebsiteAPI = async (
  req: Request,
  res: Response,
  next?: any
) => {
  const q = paramParser(req, "q");
  const url = paramParser(req, "url");
  const pageUrl = paramParser(req, "pageUrl");
  const download = paramParser(req, "download");
  const slug = q || url || pageUrl;

  if (!slug) {
    res.status(404);
    res.send(false);
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
        return await downloadToExcel(req, res, next, data);
      } catch (e) {
        console.error(e);
      }
    } else {
      res.send("Error downloading report. Report not found.");
      return;
    }
  }

  res.json(data);
};

// get a report and include the authenticated user
export const getWebsiteReport = async (req: Request, res: Response) => {
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

  res.json(data);
};
