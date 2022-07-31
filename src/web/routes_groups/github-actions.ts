import { Application } from "express";
import cors from "cors";

export const setGithubActionRoutes = (app: Application) => {
  app.post("/api/github-action/event", cors(), async (_req, res) => {
    // const body = req.body;
    // console.log(body);
    res.send(true);
  });
};
