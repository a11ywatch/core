import { UsersController } from "@app/core/controllers";
import {
  crawlWebsite as crawl,
  scanWebsite as scan,
} from "@app/core/controllers/subdomains/update";

import { getUserFromToken, usageExceededThreshold } from "@app/core/utils";
import { TOKEN_EXPIRED_ERROR, RATE_EXCEEDED_ERROR } from "@app/core/strings";
import type { Request, Response } from "express";

const websiteCrawl = (req: Request, res?: Response) => {
  const { data } = req.body;
  // @ts-ignore
  const parentSub = !!req?.pubsub;

  if (data) {
    try {
      const { user_id, pages, domain } =
        typeof data === "string" ? JSON.parse(data) : data;

      setImmediate(async () => {
        if (pages?.length === 0) {
          await UsersController().sendWebsiteOffline({ id: user_id, domain });
        }

        for (const url of pages) {
          await crawl({
            url,
            userId: user_id,
            parentSub,
          });
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
  if (res) {
    res.send(false);
  }
};

const crawlWebsite = async (req, res) => {
  const url = req.query?.websiteUrl;
  const userId = req.query?.userId;

  try {
    await crawl({
      url,
      userId,
      pageInsights: false,
    });
  } catch (e) {
    console.error(e);
  }

  res.send(true);
};

const scanWebsite = async (req, res) => {
  const url = req.query?.websiteUrl ?? req.body?.websiteUrl;
  const userId = req.query?.userId ?? req.body?.userId;

  if (url) {
    try {
      const data = await scan({
        url,
        userId,
      });

      res.json(data);
    } catch (e) {
      console.log(e);
      res.json({
        message: "Error: Page not found",
        status: 404,
        success: false,
      });
    }
  } else {
    res.json({
      message:
        "Error: Url param not found. Add the websiteUrl param and try again",
      status: 400,
      success: false,
    });
  }
};

const websiteCrawlAuthed = async (req, res) => {
  const url = req.query?.url || req.body?.url;

  if (!url) {
    res.json({
      status: 400,
      message: "URL NOT FOUND",
      success: false,
    });
    return;
  }

  const user = getUserFromToken(req.headers?.authorization);

  if (!user) {
    res.json({
      status: 400,
      message: req.headers?.authorization
        ? TOKEN_EXPIRED_ERROR
        : "USER NOT FOUND",
      success: false,
    });
    return;
  }

  const { keyid, audience } = user?.payload;

  const [userData] = await UsersController({
    user,
  }).updateApiUsage({ id: keyid }, true);

  if (
    usageExceededThreshold({ audience, usage: userData?.apiUsage?.usage || 0 })
  ) {
    res.json({
      data: null,
      status: 17,
      message: RATE_EXCEEDED_ERROR,
      success: false,
    });
    return;
  }

  let data = {};

  try {
    data = await crawl({
      url: url?.includes("http") ? url : `http://${url}`,
      userId: keyid,
      apiData: true,
    });
  } catch (e) {
    console.log(e);
  }

  res.json(data);
};

export { scanWebsite, crawlWebsite, websiteCrawl, websiteCrawlAuthed };
