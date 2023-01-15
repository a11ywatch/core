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
    { domain, bypass: true },
    false
  );

  const score = page?.accessScore ?? 0;
  let statusColor = "#000";

  // validate score on page find
  if (page) {
    if (score >= 90) {
      statusColor = "#3fb950";
    } else if (score >= 70) {
      statusColor = "#a4a61d";
    } else {
      statusColor = "#f85149";
    }
  }

  res.header("Content-Type", "image/svg+xml");
  res.header("Cache-Control", "max-age=604800, stale-while-revalidate=86400");
  res.send(rawStatusBadge({ statusColor, score }));
};
