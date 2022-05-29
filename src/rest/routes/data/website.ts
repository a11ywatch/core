import type { Request, Response } from "express";
import { getReport } from "@app/core/controllers/reports";
import { downloadToExcel } from "@app/core/utils";
import { Website } from "@app/types";
import { initUrl } from "@a11ywatch/website-source-builder";
import { retreiveUserByToken } from "@app/core/utils/get-user-data";
// import { redisClient } from "@app/database/memory-client";

// TODO: Refactor usage
export const getWebsiteAPI = async (
  req: Request,
  res: Response,
  next?: any
) => {
  const { q, download } = req.query;

  if (!q) {
    res.status(404);
    res.send(false);
    return;
  }

  let data: Website;
  let query = initUrl(decodeURIComponent(q + ""));

  try {
    const report = await getReport(query);

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
  const { q } = req.query;

  if (!q) {
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

  let data: Website;
  let query = initUrl(decodeURIComponent(q + ""));

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
