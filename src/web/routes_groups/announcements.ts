import { AnnouncementsController } from "@app/core/controllers";
import { Application } from "express";
import cors from "cors";

export const setAnnouncementsRoutes = (app: Application) => {
  app.get("/api/whats-new", cors(), async (_, res) => {
    try {
      const [announcements] = await AnnouncementsController().getAnnouncement(
        { _id: null },
        true
      );

      res.json({
        data: announcements ?? null,
        message: process.env.WHATS_NEW ?? "No new announcements",
      });
    } catch (e) {
      console.error(e);
      res.json({
        data: null,
        message: "No new announcements",
      });
    }
  });
};
