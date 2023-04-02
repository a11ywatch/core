import dns from "dns";
import { paramParser, validateUID } from "../params/extracter";
import { frontendClientOrigin } from "../../core/utils/is-client";
import { websitesCollection } from "../../database/index";
import { SUPER_MODE } from "../../config";
import { getUserFromToken, asyncRandomGenerate } from "../../core/utils";
import { AUTH_ERROR } from "../../core/strings";
import type { FastifyInstance } from "fastify";
import type { FastifyContext } from "apollo-server-fastify";

// validate reqeust todo: move to top level util
const validateUserRequest = (req: FastifyContext["request"]): number => {
  const isClient =
    frontendClientOrigin(req.headers["origin"]) ||
    frontendClientOrigin(req.headers["host"]) ||
    frontendClientOrigin(req.headers["referer"]);

  // soft quick check if user has auth flags
  const softAuth = req.headers.authorization || req.cookies.jwt;

  const usr = getUserFromToken(req.headers.authorization || req.cookies.jwt);
  const userId = usr?.payload?.keyid;

  if (validateUID(userId) && isClient && (SUPER_MODE || softAuth)) {
    return userId;
  }
};

const verifiedProps = {
  message: "Domain verified!",
  data: { verified: true },
};

// set all dns verifiycation routes
export const setDnsVerifyRoutes = (app: FastifyInstance) => {
  app.get("/api/website/dns", async (req, res) => {
    const userId = validateUserRequest(req);

    // check to see if dns if verified
    if (typeof userId !== "undefined") {
      const domain = paramParser(req, "domain");

      if (!domain) {
        return res.status(422).send({
          data: { verifed: false },
          message: `Website params missing :domain`,
        });
      }

      const website = await websitesCollection.findOne({ domain, userId });

      if (!website) {
        return res.status(404).send({
          data: { verifed: false },
          message: `Website not found`,
        });
      }

      res.send({
        data: { verifed: website.verified },
        message: `Website ${website.verified ? "verified" : "not verified"}`,
      });
    }

    res.status(401).send({ message: AUTH_ERROR, data: null });
  });

  // get dns code for verification
  app.post("/api/website/dns", async (req, res) => {
    const userId = validateUserRequest(req);

    if (typeof userId !== "undefined") {
      const domain = paramParser(req, "domain");

      if (!domain) {
        return res.status(422).send({
          data: { verifed: false },
          message: `Website body missing :domain`,
        });
      }

      const params = { domain, userId };
      const website = await websitesCollection.findOne(params);

      if (!website) {
        return res.status(404).send({
          data: { verifed: false },
          message: `Website not found`,
        });
      }

      const verificationCode =
        website.verificationCode || (await asyncRandomGenerate());

      if (!website.verified) {
        if (!website.verificationCode) {
          await websitesCollection.updateOne(params, {
            $set: { verificationCode },
          });
        } else if (await resolveDnsRecord(domain, website.verificationCode)) {
          await websitesCollection.updateOne(params, {
            $set: { verified: true },
            // verificationCode: "" todo unset property
          });

          return res.status(200).send(verifiedProps);
        }

        return res.status(200).send({
          message: `Add the Txt Record ${verificationCode}`,
          data: { verified: false, txtRecord: verificationCode },
        });
      } else {
        return res.status(200).send(verifiedProps);
      }
    }

    res.status(401).send({ message: AUTH_ERROR });
  });
};

// resolve dns match for domain
const resolveDnsRecord = (domain: string, record: string) => {
  return new Promise((resolve) => {
    dns.resolveTxt(domain, (err, addresses) => {
      if (err) {
        resolve(false);
      } else {
        resolve(addresses.flat().includes(record));
      }
    });
  });
};
