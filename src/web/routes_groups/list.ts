import { Request, Response, Application } from "express";
import cors from "cors";
import { getBaseParamsList } from "../extracter";
import { responseModel } from "../../core/models";
import { getWebsitesPaging } from "../../core/controllers/websites/find/get";
import { getIssuesPaging } from "../../core/controllers/issues/find";
import { getPagesPaging } from "../../core/controllers/pages/find/domains";
import { getAnalyticsPaging } from "../../core/controllers/analytics";
import { getScriptsPaging } from "../../core/controllers/scripts";
import { getPageSpeedPaging } from "../../core/controllers/page-speed/main";

// set all routes that are handled via pagination
export const setListRoutes = (app: Application) => {
  // paginated retreive websites from the database.
  app.get("/api/list/website", cors(), async (req, res) => {
    const { userId, offset, limit } = getBaseParamsList(req);
    let data;
    let code = 200;
    let message = "";

    if (typeof userId !== "undefined") {
      try {
        data = await getWebsitesPaging({
          userId,
          limit,
          offset,
          insights: true, // TODO: make insights optional
        });
        message = "Successfully retrieved websites.";
      } catch (e) {
        code = 400;
        message = `Failed to retrieved websites - ${e}`;
      }
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // paginated retreive analytics from the database. Limit default is set to 20.
  app.get("/api/list/analytics", cors(), async (req, res) => {
    const { userId, domain, limit, offset } = getBaseParamsList(req);
    let data;
    let code = 200;
    let message = "";

    if (typeof userId !== "undefined") {
      try {
        data = await getAnalyticsPaging({
          userId,
          limit,
          offset,
          domain,
        });
        message = "Successfully retrieved analytics.";
      } catch (e) {
        code = 400;
        message = `Failed to retrieved analytics - ${e}`;
      }
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // paginated retreive pages from the database.
  app.get("/api/list/pages", cors(), async (req: Request, res: Response) => {
    const { userId, domain, limit, offset } = getBaseParamsList(req);
    let data;
    let code = 200;
    let message = "";

    if (typeof userId !== "undefined") {
      try {
        data = await getPagesPaging({
          userId,
          limit,
          offset,
          domain: domain || undefined,
          insights: true,
        });
        if (data) {
          message = "Successfully retrieved pages.";
        }
      } catch (e) {
        code = 400;
        message = `Failed to retrieved pages - ${e}`;
      }
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // paginated retreive scripts from the database. Limit default is set to 20.
  app.get("/api/list/scripts", cors(), async (req: Request, res: Response) => {
    const { userId, domain, limit, offset } = getBaseParamsList(req);

    let data;
    let code = 200;
    let message = "";

    if (typeof userId !== "undefined") {
      try {
        data = await getScriptsPaging({
          userId,
          limit,
          offset,
          domain,
        });
        message = "Successfully retrieved scripts.";
      } catch (e) {
        code = 400;
        message = `Failed to retrieved scripts - ${e}`;
      }
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // list of issues
  app.get("/api/list/issue", cors(), async (req: Request, res: Response) => {
    const { userId, domain, pageUrl, limit, offset } = getBaseParamsList(req);

    let data;
    let code = 200;
    let message = "";

    if (typeof userId !== "undefined") {
      try {
        data = await getIssuesPaging({
          userId,
          limit,
          domain,
          pageUrl,
          offset,
        });
        message = "Successfully retrieved issues.";
      } catch (e) {
        code = 400;
        message = `Failed to retrieve issues - ${e}`;
      }
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // list of pagespeed collections
  app.get(
    "/api/list/pagespeed",
    cors(),
    async (req: Request, res: Response) => {
      const { userId, domain, pageUrl, limit, offset } = getBaseParamsList(req);

      let data;
      let code = 200;
      let message = "";

      if (typeof userId !== "undefined") {
        try {
          data = await getPageSpeedPaging({
            userId,
            limit,
            domain,
            pageUrl,
            offset,
            all: false,
          });
          message = "Successfully retrieved pagespeed.";
        } catch (e) {
          code = 400;
          message = `Failed to retrieve pagespeed - ${e}`;
        }
      }

      res.json(
        responseModel({
          code,
          data: data ? data : null,
          message,
        })
      );
    }
  );
};