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
import { getStatusCodes, HttpMessage } from "../messages/message";

// set all routes that are handled via pagination - Requires a valid user reguardless of SUPER mode.
export const setListRoutes = (app: Application) => {
  // paginated retrieve websites from the database.
  app.get("/api/list/website", cors(), async (req, res) => {
    const { userId, offset, limit } = getBaseParamsList(req);
    let message = HttpMessage.Unauthorized;
    let data = null;

    if (typeof userId !== "undefined") {
      try {
        data = await getWebsitesPaging({
          userId,
          limit,
          offset,
          insights: true, // TODO: make insights optional
        });
        message = HttpMessage.Ok;
      } catch (e) {
        message = HttpMessage.Error;
      }
    }

    const code = getStatusCodes(message);

    res.status(code);

    res.json(
      responseModel({
        code,
        data,
        message,
      })
    );
  });

  // paginated retrieve analytics from the database. Limit default is set to 20.
  app.get("/api/list/analytics", cors(), async (req, res) => {
    const { userId, domain, limit, offset } = getBaseParamsList(req);
    let message = HttpMessage.Unauthorized;
    let data = null;

    if (typeof userId !== "undefined") {
      try {
        data = await getAnalyticsPaging({
          userId,
          limit,
          offset,
          domain,
        });
        message = HttpMessage.Ok;
      } catch (e) {
        message = HttpMessage.Error;
      }
    }

    const code = getStatusCodes(message);

    res.status(code);

    res.json(
      responseModel({
        code,
        data,
        message,
      })
    );
  });

  // paginated retrieve pages from the database.
  app.get("/api/list/pages", cors(), async (req: Request, res: Response) => {
    const { userId, domain, limit, offset } = getBaseParamsList(req);
    let message = HttpMessage.Unauthorized;
    let data = null;

    if (typeof userId !== "undefined") {
      try {
        data = await getPagesPaging({
          userId,
          limit,
          offset,
          domain: domain || undefined,
          insights: true,
        });
        message = HttpMessage.Ok;
      } catch (e) {
        message = HttpMessage.Error;
      }
    }

    const code = getStatusCodes(message);

    res.status(code);

    res.json(
      responseModel({
        code,
        data,
        message: HttpMessage[message],
      })
    );
  });

  // paginated retrieve scripts from the database. Limit default is set to 20.
  app.get("/api/list/scripts", cors(), async (req: Request, res: Response) => {
    const { userId, domain, limit, offset } = getBaseParamsList(req);
    let message = HttpMessage.Unauthorized;
    let data = null;

    if (typeof userId !== "undefined") {
      try {
        data = await getScriptsPaging({
          userId,
          limit,
          offset,
          domain,
        });
        message = HttpMessage.Ok;
      } catch (e) {
        message = HttpMessage.Error;
      }
    }

    const code = getStatusCodes(message);

    res.status(code);

    res.json(
      responseModel({
        code,
        data,
        message,
      })
    );
  });

  // list of issues
  app.get("/api/list/issue", cors(), async (req: Request, res: Response) => {
    const { userId, domain, pageUrl, limit, offset } = getBaseParamsList(req);
    let message = HttpMessage.Unauthorized;
    let data = null;

    if (typeof userId !== "undefined") {
      try {
        data = await getIssuesPaging({
          userId,
          limit,
          domain,
          pageUrl,
          offset,
        });
        message = HttpMessage.Ok;
      } catch (e) {
        message = HttpMessage.Error;
      }
    }

    const code = getStatusCodes(message);

    res.status(code);

    res.json(
      responseModel({
        code,
        data,
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
      let message = HttpMessage.Unauthorized;
      let data = null;

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
          message = HttpMessage.Ok;
        } catch (e) {
          message = HttpMessage.Error;
        }
      }
      const code = getStatusCodes(message);

      res.status(code);

      res.json(
        responseModel({
          code,
          data,
          message,
        })
      );
    }
  );
};
