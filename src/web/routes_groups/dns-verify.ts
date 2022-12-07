import { randomBytes } from "crypto";
import dns from "dns";
import { paramParser, validateUID } from "../params/extracter";
import { frontendClientOrigin } from "../../core/utils/is-client";
import { connect } from "../../database/index";
import { SUPER_MODE } from "../../config";
import { getUserFromToken } from "../../core/utils";
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
  // check to see if dns if verified
  return null;
};

const verifiedProps = {
  message: "Domain verified!",
  data: { verified: true },
};

// set all ad friends network routes
export const setDnsVerifyRoutes = (app: FastifyInstance) => {
  app.get("/api/website/dns", async (req, res) => {
    const userId = validateUserRequest(req);

    // check to see if dns if verified
    if (validateUID(userId)) {
      const domain = paramParser(req, "domain");
      const [collection] = connect("Websites");
      const website = await collection.findOne({ domain, userId });

      res.send({
        data: { verifed: website.verified },
        message: `Website ${website.verified ? "verified" : "not verified"}`,
      });
    }

    res.send({ message: AUTH_ERROR, data: null });
  });

  // get dns code for verification
  app.post("/api/website/dns", async (req, res) => {
    const userId = validateUserRequest(req);

    if (validateUID(userId)) {
      const domain = paramParser(req, "domain");
      const [collection] = connect("Websites");

      const params = { domain, userId };
      const website = await collection.findOne(params);

      const verificationCode =
        website.verificationCode || randomBytes(4).toString("hex");

      if (!website.verified) {
        if (!website.verificationCode) {
          await collection.updateOne(params, {
            verificationCode,
          });
        } else if (await resolveDnsRecord(domain, website.verificationCode)) {
          await collection.updateOne(params, {
            verified: true,
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

    res.status(403).send({ message: AUTH_ERROR });
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
