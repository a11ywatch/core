import { paramParser } from "../params/extracter";
import type { FastifyInstance } from "fastify";
import { frontendClientOrigin } from "../../core/utils/is-client";
import { connect } from "../../database/index";
import { ADMIN_PASSWORD, SUPER_MODE } from "../../config";

// set all ad friends network routes
export const setAdsRoutes = (app: FastifyInstance) => {
  // enable routes
  if (process.env.ADS_ENABLED === "true") {
    app.get("/ads/refs", async (req, res) => {
      const isClient =
        frontendClientOrigin(req.headers["origin"]) ||
        frontendClientOrigin(req.headers["host"]) ||
        frontendClientOrigin(req.headers["referer"]);

      // soft quick check if user has auth flags
      const softAuth = req.headers.authorization || req.cookies.jwt;

      if (isClient && (SUPER_MODE || softAuth)) {
        const [collection] = connect("Ads");

        const ad = await collection
          .aggregate([{ $sample: { size: 3 } }])
          .toArray();

        res.send(ad);
      }

      res.send([]);
    });

    // native ad handling
    app.post("/ads/refs", async (req, res) => {
      if ((req.body as any)?.password === ADMIN_PASSWORD) {
        const [collection] = connect("Ads");

        const title = paramParser(req, "title");
        const description = paramParser(req, "description");
        const imgSrc = paramParser(req, "imgSrc");
        const url = paramParser(req, "url");

        const ad = {
          title,
          description,
          imgSrc,
          url,
        };

        collection.insertOne(ad);

        res.send(ad);
      }

      res.status(403).send(false);
    });
  }
};
