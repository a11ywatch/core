import { Application } from "express";
import cors from "cors";
import { createUser } from "@app/core/controllers/users/set";
import { verifyUser } from "@app/core/controllers/users/update";
import { getUserFromToken } from "@app/core/utils";
import { cookieConfigs } from "@app/config";
import { getUser } from "@app/core/controllers/users";

export const setAuthRoutes = (app: Application) => {
  app.post("/api/register", cors(), async (req, res) => {
    const { email, password, googleId } = req.body;
    try {
      const auth = await createUser({ email, password, googleId });

      res.cookie("on", auth.email, cookieConfigs);
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

      res.cookie("on", auth.email, cookieConfigs);
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

  app.post("/api/logout", cors(), async (_req, res) => {
    res.clearCookie("on");
    res.clearCookie("jwt");
    res.send(true);
  });

  // A NEW INSTANCE OF THE APP BASIC PING (RUNS ONCE ON APP START)
  app.post("/api/ping", cors(), async (req, res) => {
    const parsedToken = getUserFromToken(req.cookies.jwt);

    if (parsedToken) {
      const id = parsedToken?.payload?.keyid;
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
};
