import { RATE_EXCEEDED_ERROR } from "./strings";
import {
  updateUser,
  addWebsite,
  addPaymentSubscription,
  cancelSubscription,
  filterEmailDates,
  login,
  register,
  logout,
} from "./graph/mutations";
import { watcherCrawl } from "./actions/accessibility/watcher_crawl";
import { scanWebsite, crawlPage } from "../core/actions";
import { gqlRateLimiter } from "../web/limiters/scan";
import { getWebsite, WebsitesController } from "./controllers/websites";
import { websiteFormatter } from "./utils/shapes/website-gql";
import { UsersController } from "./controllers";
import { DEV, SUPER_MODE } from "../config/config";
import { CRAWLER_COMMENCED } from "./strings/success";
import { crawlingSet, getKey } from "../event/crawl-tracking";
import { StatusCode } from "../web/messages/message";

const defaultPayload = {
  keyid: undefined,
  audience: undefined,
};

// TODO: move to limiter control file
const scanRateLimitConfig = {
  max: 2,
  window: "10s",
};

const defaultScanLimit = {
  max: 3,
  window: "60s",
};

// [Deprecated]: Move all to OpenAPI | gRPC
export const Mutation = {
  updateUser,
  login,
  register,
  logout,
  addWebsite,
  crawlWebsite: async (_, { url }, context) => {
    if (!url) {
      return {
        website: null,
        code: StatusCode.NotFound,
        success: true,
        message: "A valid Url is required.",
      };
    }

    const { keyid } = context.user?.payload || defaultPayload;

    const canScan = !SUPER_MODE
      ? await UsersController().updateScanAttempt({
          userId: keyid,
        })
      : true;

    if (canScan) {
      const [website] = await getWebsite({ userId: keyid, url });

      if (crawlingSet.has(getKey(url, [], keyid))) {
        return {
          website: null,
          code: StatusCode.Accepted,
          success: true,
          message: "Scan already in progress...",
        };
      }

      const { subdomains, tld, ua, proxy } = website ?? {};

      setImmediate(async () => {
        await watcherCrawl({
          url: url,
          userId: keyid,
          subdomains: subdomains,
          tld: tld,
          scan: true,
          agent: ua,
          proxy: proxy,
        });
      });
      return {
        website: null,
        code: 200,
        success: true,
        message: CRAWLER_COMMENCED,
      };
    } else {
      throw new Error(RATE_EXCEEDED_ERROR);
    }
  },
  // run scans to the pagemind -> browser -> mav -> api
  scanWebsite: async (parent, args, context, info) => {
    const { url } = args;
    const { keyid } = context.user?.payload || defaultPayload;
    const unauth = typeof keyid === "undefined";

    const rateLimitConfig = !unauth ? defaultScanLimit : scanRateLimitConfig;

    let errorMessage;

    if (!SUPER_MODE) {
      const canScan = await UsersController().updateScanAttempt({
        userId: keyid,
      });

      // if the request did not come from the server update api usage
      if (!canScan) {
        errorMessage = RATE_EXCEEDED_ERROR;
      }

      // check rate limits for request. TODO: adjust r
      if (!errorMessage) {
        // apply rate limit on un-auth.
        errorMessage = await gqlRateLimiter(
          {
            parent,
            args,
            context,
            info,
          },
          rateLimitConfig
        );
      }

      if (errorMessage) {
        throw new Error(errorMessage);
      }
    }

    let data = {};

    if (!unauth) {
      data = await crawlPage(
        {
          url,
          userId: keyid,
          sendSub: true,
        },
        false
      );
    } else {
      data = await scanWebsite({
        url,
        noStore: true,
      });
    }

    return websiteFormatter(data);
  },
  removeWebsite: async (_, { url, deleteMany = false }, context) => {
    const { keyid } = context.user?.payload || defaultPayload;

    const websiteRemoved = await WebsitesController().removeWebsite({
      userId: keyid,
      url,
      deleteMany,
    });

    if (websiteRemoved && deleteMany) {
      return {
        ...websiteRemoved,
        url: `Success all websites and related items deleted.`,
        id: 0,
      };
    }

    return websiteRemoved;
  },
  updateWebsite: async (
    _,
    {
      userId,
      url,
      customHeaders,
      pageInsights,
      mobile,
      standard,
      ua,
      robots,
      subdomains,
      tld,
      ignore,
      rules,
      runners,
      proxy,
      sitemap,
    },
    context
  ) => {
    const { keyid, audience } = context.user?.payload || defaultPayload;

    return await WebsitesController().updateWebsite({
      userId: userId || keyid,
      url,
      pageHeaders: customHeaders,
      pageInsights,
      mobile,
      standard,
      ua,
      robots,
      subdomains,
      tld,
      ignore,
      rules,
      runners,
      proxy: DEV || audience ? proxy : undefined,
      sitemap,
    });
  },
  forgotPassword: async (_, { email }, _context) => {
    return await UsersController().forgotPassword({
      email,
    });
  },
  confirmEmail: async (_, { email }, context) => {
    const { keyid } = context.user?.payload || defaultPayload;

    return await UsersController().confirmEmail({
      email,
      keyid,
    });
  },
  resetPassword: async (_, { email, resetCode }, _context) => {
    return await UsersController().resetPassword({
      email,
      resetCode,
    });
  },
  toggleAlert: async (_, { alertEnabled }, context) => {
    const { keyid } = context.user?.payload || defaultPayload;

    return await UsersController().toggleAlert({
      keyid,
      alertEnabled,
    });
  },
  sortWebsites: async (_, { order }, context) => {
    const { keyid } = context.user?.payload || defaultPayload;

    return await WebsitesController().sortWebsites({
      userId: keyid,
      order,
    });
  },
  setPageSpeedKey: async (_, { pageSpeedApiKey }, context) => {
    return await UsersController().setPageSpeedKey({
      id: context.user?.payload?.keyid,
      pageSpeedApiKey,
    });
  },
  addPaymentSubscription,
  cancelSubscription,
  filterEmailDates,
};
