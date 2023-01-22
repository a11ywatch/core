import { validateUID } from "../params/extracter";
import { frontendClientOrigin } from "../../core/utils/is-client";
import { getUser } from "../../core/controllers/users";
import { SUPER_MODE } from "../../config";
import { getUserFromToken } from "../../core/utils";
import { AUTH_ERROR } from "../../core/strings";
import type { FastifyInstance } from "fastify";
import type { FastifyContext } from "apollo-server-fastify";
import { collectionIncrement } from "../../core/utils/collection-upsert";
import { connect } from "../../database";

// validate external request
const domainAuthorizer = async (
  req: FastifyContext["request"]
): Promise<boolean> => {
  const isClient =
    frontendClientOrigin(req.headers["origin"]) ||
    frontendClientOrigin(req.headers["host"]) ||
    frontendClientOrigin(req.headers["referer"]);

  const usr = getUserFromToken(req.headers.authorization);
  const userId = usr?.payload?.keyid;
  const validClient = validateUID(userId) && isClient;

  if (validClient || SUPER_MODE) {
    // manual authorized clients
    const [authorizer] = connect("Authorizer");

    try {
      return !!(await authorizer.findOne({ id: userId }));
    } catch (e) {
      console.error(e);
    }
  }
};

// calculate cost by %
const calculateCredits = (_cost: number) => {
  return 100;
};

// set external webhook routes
export const setExternalRoutes = (app: FastifyInstance) => {
  app.put("/api/user/usage", async (req, res) => {
    if (await domainAuthorizer(req)) {
      const bodyData = req.body as { id: number; paymentCost: number };
      const userId = bodyData.id;
      const [user, collection] = await getUser({ id: userId });

      if (!user) {
        return res.status(404).send({
          data: null,
          message: `User not found`,
        });
      }
      // todo weight the payment cost into the uptime
      const uptime = (user.scanInfo.creditedUptime += calculateCredits(
        bodyData.paymentCost
      ));

      setImmediate(async () => {
        await collectionIncrement(
          {
            "scanInfo.creditedUptime": uptime, // add new uptime to collection
          },
          collection,
          { id: userId }
        );
      });

      res.send({
        data: { usage: uptime, userId },
        message: `User usage updated.`,
      });
    }

    res.status(401).send({ message: AUTH_ERROR, data: null });
  });
};
