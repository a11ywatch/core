import { rawStatusBadge } from "@app/core/assets";
import { AnalyticsController } from "@app/core/controllers";
import { Analytic } from "@app/types/types";
import type { Request, Response } from "express";

// get the status badge for a domain
export const statusBadge = async (req: Request, res: Response) => {
  const domain = req.params?.domain?.replace(".svg", "");
  const page: Analytic = await AnalyticsController().getWebsite(
    { domain },
    false
  );

  let score = 0;
  let statusColor = "#000";

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

  res.setHeader("Content-Type", "image/svg+xml");
  res.send(rawStatusBadge({ statusColor, score }));
};
