import type { FastifyInstance } from "fastify";

export const setGithubActionRoutes = (app: FastifyInstance) => {
  app.post("/api/github-action/event", async (_req, res) => {
    // const body = req.body;
    // console.log(body);
    res.send(true);
  });
};
