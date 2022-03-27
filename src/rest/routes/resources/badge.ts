import { rawStatusBadge } from "@app/core/assets";
import { AnalyticsController } from "@app/core/controllers";
import { hashString } from "@app/core/utils";
import { Analytic } from "@app/types";
import type { Request, Response } from "express";

export const statusBadge = async (req: Request, res: Response) => {
  const domain = req.params?.domain?.replace(".svg", "");
  const page: Analytic = await AnalyticsController().getWebsite(
    { domain },
    false
  );

  let statusColor = "#000";

  let score = 0;

  if (page) {
    score = page?.adaScore;
    if (score && typeof score === "number") {
      if (score >= 90) {
        statusColor = "#3fb950";
      } else if (score >= 70) {
        statusColor = "#a4a61d";
      } else {
        statusColor = "#f85149";
      }
    }
  }

  const etagHash = hashString(score);

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("ETag", etagHash);
  res.send(rawStatusBadge({ statusColor, score }));
};
