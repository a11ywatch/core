import type { Request, Response } from "express";
import { getReport } from "@app/core/controllers/reports";
import { downloadToExcel } from "@app/core/utils";
import { Website } from "@app/types";
import { redisClient } from "@app/database/memory-client";

const getWebsite = async (req: Request, res: Response, next?: any) => {
  const { q, timestamp, download } = req.query;
  let data: Website;

  try {
    const memReport = await redisClient.get(decodeURIComponent(q + ""));

    if (memReport) {
      data = JSON.parse(memReport);
      if (typeof data.issue === "string") {
        data.issue = JSON.parse(data.issue);
      }
    }
  } catch (e) {
    console.error(e);
  }

  if (!data) {
    try {
      const report = await getReport(q + "", timestamp && Number(timestamp));

      if (report?.website) {
        data = report.website;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // download report to excel
  if (download) {
    try {
      return await downloadToExcel(req, res, next, data);
    } catch (e) {
      console.error(e);
    }
  }

  res.json(data);
};

export { getWebsite };
