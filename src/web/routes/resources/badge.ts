import type { FastifyContext } from "apollo-server-fastify";
import { rawStatusBadge } from "../../../core/assets";
import { AnalyticsController } from "../../../core/controllers";
import type { Analytic } from "../../../types/types";

// get the status badge for a domain
export const statusBadge = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  const domain = (req.params as any)?.domain?.replace(".svg", "");
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

  res.header("Content-Type", "image/svg+xml");
  res.send(rawStatusBadge({ statusColor, score }));
};
