import { CRAWLER_FINISHED, RATE_EXCEEDED_ERROR } from "./strings";
import {
  updateUser,
  addWebsite,
  addPaymentSubscription,
  cancelSubscription,
  filterEmailDates,
  login,
  register,
  logout,
} from "../web/graph/mutations";
import { watcherCrawl } from "./actions/accessibility/watcher_crawl";
import { scanWebsite, crawlPage } from "../core/actions";
import { gqlRateLimiter } from "../web/limiters/scan";
import { getWebsite, WebsitesController } from "./controllers/websites";
import { websiteFormatter } from "./utils/shapes/website-gql";
import { ScriptsController, UsersController } from "./controllers";
import { SUPER_MODE } from "../config/config";

const defaultPayload = {
  keyid: undefined,
  audience: undefined,
};

// TODO: move to limiter control file
const scanRateLimitConfig = {
  max: 2,
  window: "14s",
};

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
        code: 404,
        success: true,
        message: "A valid Url is required.",
      };
    }

    const { keyid } = context.user?.payload || defaultPayload;

    const canScan = await UsersController().updateScanAttempt({
      userId: keyid,
    });

    if (canScan) {
      const [website] = await getWebsite({ userId: keyid, url });
      setImmediate(async () => {
        await watcherCrawl({
          url: url,
          userId: keyid,
          subdomains: website?.subdomains,
          tld: website?.tld,
          scan: true,
        });
      });
      return {
        website: null,
        code: 200,
        success: true,
        message: CRAWLER_FINISHED,
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

    const rateLimitConfig = !unauth
      ? {
          max: 3,
          window: "10s",
        }
      : scanRateLimitConfig;

    let errorMessage;

    const canScan = await UsersController().updateScanAttempt({
      userId: keyid,
    });

    // if the request did not come from the server update api usage
    if (!canScan) {
      errorMessage = RATE_EXCEEDED_ERROR;
    }

    // check rate limits for request. TODO: adjust r
    if (!errorMessage && !SUPER_MODE) {
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

    let data;

    if (!unauth) {
      data = (await crawlPage(
        {
          url,
          userId: keyid,
          sendSub: true,
        },
        false
      )) as any;
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
    { userId, url, customHeaders, pageInsights, mobile, standard, ua, robots },
    context
  ) => {
    const { keyid } = context.user?.payload || defaultPayload;

    return await WebsitesController().updateWebsite({
      userId: userId || keyid,
      url,
      pageHeaders: customHeaders,
      pageInsights,
      mobile,
      standard,
      ua,
      robots,
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
  resetPassword: async (_, { email, resetCode }, context) => {
    return await UsersController().resetPassword({
      email,
      resetCode,
    });
  },
  toggleAlert: async (_, { alertEnabled }, context) => {
    const { keyid } = context.user?.payload || defaultPayload;

    return UsersController().toggleAlert({
      keyid,
      alertEnabled,
    });
  },
  toggleProfile: async (_, { profileVisible }, context) => {
    return UsersController().toggleProfile({
      keyid: context.user?.payload?.keyid,
      profileVisible,
    });
  },
  updateScript: async (
    _,
    { url, scriptMeta, editScript, newScript },
    context
  ) => {
    const { keyid } = context.user?.payload || defaultPayload;

    return await ScriptsController().updateScript({
      userId: keyid,
      scriptMeta,
      pageUrl: url,
      editScript,
      newScript,
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
