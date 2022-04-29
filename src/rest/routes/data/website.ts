import type { Request, Response } from "express";
import { getReport } from "@app/core/controllers/reports";
import { downloadToExcel } from "@app/core/utils";
import { Website } from "@app/types";
import { redisClient } from "@app/database/memory-client";

// TODO: Refactor usage
const getWebsite = async (req: Request, res: Response, next?: any) => {
  const { q, timestamp, download } = req.query;

  if (!q) {
    res.send(false);
    return;
  }

  let data: Website;

  let query = decodeURI(q + "");

  try {
    const memReport = await redisClient.get(query);

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
      const report = await getReport(
        decodeURI(q + ""),
        timestamp && Number(timestamp)
      );

      if (report?.website) {
        data = report.website;
      }
    } catch (e) {
      console.error(e);
    }
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

export { getWebsite };
