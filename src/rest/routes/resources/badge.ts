import { rawStatusBadge } from "@app/core/assets";
import { AnalyticsController } from "@app/core/controllers";
import { createHash } from "crypto";
import type { Request, Response } from "express";

export const statusBadge = async (req: Request, res: Response) => {
  const domain = req.params?.domain?.replace(".svg", "");
  const { adaScore: score } = await AnalyticsController().getWebsite(
    { domain },
    false
  );

  let statusColor = "#000";

  if (typeof score === "number") {
    if (score >= 90) {
      statusColor = "#3fb950";
    } else if (score >= 70) {
      statusColor = "#a4a61d";
    } else {
      statusColor = "#f85149";
    }
  }

  const etagHash = createHash("sha256");
  etagHash.update(score);

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("ETag", etagHash.digest("hex"));
  res.send(rawStatusBadge({ statusColor, score }));
};
