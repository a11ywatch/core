import type { Request, Response } from "express";
import { getReport } from "@app/core/controllers/reports";
import { downloadToExcel } from "@app/core/utils";
import { Website } from "@app/types";

const getWebsite = async (req: Request, res: Response, next?: any) => {
  const { q, timestamp, download } = req.query;
  let data: Website = {};

  try {
    // TODO: REDIS TEMP STORAGE OF SCANS FREE
    const report = await getReport(q + "", timestamp && Number(timestamp));

    if (report?.website) {
      data = report.website;
    }
  } catch (e) {
    console.error(e);
  }

  if (download) {
    try {
      await downloadToExcel(req, res, next, data);
    } catch (e) {
      console.error(e);
    }
  } else {
    res.json(data);
  }
};

export { getWebsite };
