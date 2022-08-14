import { createUser } from "@app/core/controllers/users/set";
import { verifyUser } from "@app/core/controllers/users/update";
import { getUserFromToken } from "@app/core/utils";
import { config, cookieConfigs } from "@app/config";
import { getUser } from "@app/core/controllers/users";
import { request } from "https";
import { StatusCode } from "../messages/message";
import type { FastifyInstance } from "fastify";
import { validateUID } from "../params/extracter";

const clientID = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;

// Authenticate with github @param requestToken string
const onAuthGithub = (requestToken: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    // TODO: shape with ttsc
    const data = JSON.stringify({
      client_id: clientID,
      client_secret: clientSecret,
      code: requestToken,
    });

    const req = request(
      {
        method: "POST",
        hostname: "github.com",
        port: 443,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
        path: `/login/oauth/access_token`,
      },
      (res) => {
        res.setEncoding("utf8");

        let resd = "";

        res.on("data", (chunk) => {
          resd += chunk;
        });

        res.on("end", () => {
          resolve(resd);
        });
      }
    );

    req.write(data);

    req.on("error", (err) => {
      console.error("Error: ", err.message);
      reject(err);
    });

    req.end();
  });
};

// set all authentication routes
export const setAuthRoutes = (app: FastifyInstance) => {
  app.post("/api/register", async (req, res) => {
    try {
      const auth = await createUser(req.body);

      res.setCookie("jwt", auth.jwt, cookieConfigs).send(auth);
    } catch (e) {
      res.status(StatusCode.BadRequest);
      res.send({
        data: null,
        message: e?.message,
      });
    }
  });
  app.post("/api/login", async (req, res) => {
    try {
      const auth = await verifyUser(req.body);

      res.setCookie("jwt", auth.jwt, cookieConfigs).send(auth);
    } catch (e) {
      res.status(StatusCode.BadRequest);
      res.send({
        data: null,
        message: e?.message,
      });
    }
  });

  app.post("/api/logout", (_req, res) => {
    res.setCookie("jwt", "", cookieConfigs);
    res.clearCookie("jwt");
    res.send();
  });

  // A NEW INSTANCE OF THE APP BASIC PING (RUNS ONCE ON APP START)
  app.post("/api/ping", async (req, res) => {
    const usr = getUserFromToken(req.cookies.jwt);

    const id = usr?.payload?.keyid;

    if (validateUID(id)) {
      const [user, collection] = await getUser({ id });

      if (user) {
        await collection.updateOne(
          { id },
          {
            $set: {
              lastLoginDate: new Date(),
            },
          }
        );
      }
    }

    res.status(200).send();
  });

  app.get("/github/callback", async (req, res) => {
    const requestToken = (req.query as any).code + "";
    let authentication;

    try {
      authentication = await onAuthGithub(requestToken);
    } catch (e) {
      console.error(e);
    }

    res.redirect(
      authentication
        ? `${config.DOMAIN}/auth-redirect?${authentication}`
        : config.DOMAIN
    );
  });
};
