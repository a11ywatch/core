import { Application } from "express";
import cors from "cors";
import { createUser } from "@app/core/controllers/users/set";
import { verifyUser } from "@app/core/controllers/users/update";
import { getUserFromToken } from "@app/core/utils";
import { config, cookieConfigs } from "@app/config";
import { getUser } from "@app/core/controllers/users";
import { request } from "https";

const clientID = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;

// Authenticate with github @param requestToken string
const oAuthGithub = (requestToken: string): Promise<any> => {
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
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            data = JSON.parse(data);
          } catch (_) {}
          resolve(data);
        });
      }
    );

    req.write(data);

    req.on("error", (err) => {
      console.log("Error: ", err.message);
      reject(err);
    });

    req.end();
  });
};

export const setAuthRoutes = (app: Application) => {
  app.post("/api/register", cors(), async (req, res) => {
    try {
      const auth = await createUser(req.body);

      res.cookie("jwt", auth.jwt, cookieConfigs);

      res.json(auth);
    } catch (e) {
      res.json({
        data: null,
        message: e?.message,
      });
    }
  });
  app.post("/api/login", cors(), async (req, res) => {
    try {
      const auth = await verifyUser(req.body);

      res.cookie("jwt", auth.jwt, cookieConfigs);

      res.json(auth);
    } catch (e) {
      console.error(e);
      res.json({
        data: null,
        message: e?.message,
      });
    }
  });

  app.post("/api/logout", cors(), (_req, res) => {
    res.cookie("jwt", "", cookieConfigs);
    res.clearCookie("jwt");
    res.end();
  });

  // A NEW INSTANCE OF THE APP BASIC PING (RUNS ONCE ON APP START)
  app.post("/api/ping", cors(), async (req, res) => {
    const usr = getUserFromToken(req.cookies.jwt);

    const id = usr?.payload?.keyid;

    if (typeof id !== "undefined") {
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
      res.send(true);
    } else {
      // un-authed user
      res.send(true);
    }
  });

  app.get("/github/callback", async (req, res) => {
    const requestToken = req.query.code + "";
    let authentication;

    try {
      authentication = await oAuthGithub(requestToken);
    } catch (e) {
      console.error(e);
    }

    res.redirect(
      authentication
        ? `${config.DOMAIN}/auth-redirect?${authentication}`
        : `${config.DOMAIN}`
    );
  });
};
