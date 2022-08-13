import { Request, Response, Application } from "express";
import cors from "cors";

import { getBaseParamsList } from "../params/extracter";
import { getWebsitesPaging } from "../../core/controllers/websites/find/get";
import { getIssuesPaging } from "../../core/controllers/issues/find";
import { getPagesPaging } from "../../core/controllers/pages/find/domains";
import { getAnalyticsPaging } from "../../core/controllers/analytics";
import { getScriptsPaging } from "../../core/controllers/scripts";
import { getPageSpeedPaging } from "../../core/controllers/page-speed/main";
import { responseWrap } from "../response";

// set all routes that are handled via pagination - Requires a valid user reguardless of SUPER mode.
export const setListRoutes = (app: Application) => {
  // paginated retrieve websites from the database.
  app.get("/api/list/website", cors(), async (req, res) => {
    const { userId, offset, limit } = getBaseParamsList(req);

    await responseWrap(res, {
      callback: () =>
        getWebsitesPaging({
          userId,
          limit,
          offset,
          insights: true, // TODO: make insights optional
        }),
      userId,
    });
  });

  // paginated retrieve analytics from the database. Limit default is set to 20.
  app.get("/api/list/analytics", cors(), async (req, res) => {
    const { userId, domain, limit, offset } = getBaseParamsList(req);

    await responseWrap(res, {
      callback: () =>
        getAnalyticsPaging({
          userId,
          limit,
          offset,
          domain,
        }),
      userId,
    });
  });

  // paginated retrieve pages from the database.
  app.get("/api/list/pages", cors(), async (req: Request, res: Response) => {
    const { userId, domain, limit, offset } = getBaseParamsList(req);

    await responseWrap(res, {
      callback: () =>
        getPagesPaging({
          userId,
          limit,
          offset,
          domain,
          insights: true,
        }),
      userId,
    });
  });

  // paginated retrieve scripts from the database. Limit default is set to 20.
  app.get("/api/list/scripts", cors(), async (req: Request, res: Response) => {
    const { userId, domain, limit, offset } = getBaseParamsList(req);

    await responseWrap(res, {
      callback: () =>
        getScriptsPaging({
          userId,
          limit,
          offset,
          domain,
        }),
      userId,
    });
  });

  // list of issues
  app.get("/api/list/issue", cors(), async (req: Request, res: Response) => {
    const { userId, domain, pageUrl, limit, offset } = getBaseParamsList(req);

    await responseWrap(res, {
      callback: () =>
        getIssuesPaging({
          userId,
          limit,
          domain,
          pageUrl,
          offset,
        }),
      userId,
    });
  });

  // list of pagespeed collections
  app.get(
    "/api/list/pagespeed",
    cors(),
    async (req: Request, res: Response) => {
      const { userId, domain, pageUrl, limit, offset } = getBaseParamsList(req);

      await responseWrap(res, {
        callback: () =>
          getPageSpeedPaging({
            userId,
            limit,
            domain,
            pageUrl,
            offset,
            all: false,
          }),
        userId,
      });
    }
  );
};
