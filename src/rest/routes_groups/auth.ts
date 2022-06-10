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
  let rawData = "";

  return new Promise((resolve, reject) => {
    const req = request(
      {
        method: "POST",
        hostname: "https://github.com",
        port: 443,
        headers: {
          accept: "application/json",
        },
        path: `/login/oauth/access_token?client_id=${clientID}&client_secret=${clientSecret}&code=${requestToken}`,
      },
      (r) => {
        r.setEncoding("utf8");

        r.on("data", (chunk) => {
          rawData += chunk;
        });
      }
    );
    req.on("error", (err) => {
      reject(err);
    });
    req.on("end", () => {
      let data;
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        console.error(e);
      }

      resolve(data);
    });
  });
};

export const setAuthRoutes = (app: Application) => {
  app.post("/api/register", cors(), async (req, res) => {
    const { email, password, googleId } = req.body;
    try {
      const auth = await createUser({ email, password, googleId });

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
    const { email, password, googleId } = req.body;
    try {
      const auth = await verifyUser({ email, password, googleId });

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

  // [WIP] Github Authentication
  app.get("/github/callback", async (req, res) => {
    const requestToken = req.query.code + "";
    const authentication = await oAuthGithub(requestToken);
    const accessToken = authentication?.data?.access_token;
    // TODO: perform auth and set to cookie. (Needs to redirect to add gql param to perform auth mutation)
    console.log(authentication, accessToken);

    res.redirect(
      authentication
        ? `${config.DOMAIN}/auth-redirect?access_token=${accessToken}`
        : `${config.DOMAIN}`
    );
  });
};
