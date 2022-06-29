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
} from "./graph/mutations";
import { watcherCrawl } from "./actions/crawl/watcher_crawl";
import { scanWebsite, crawlPage } from "@app/core/actions";
import { gqlRateLimiter } from "@app/rest/limiters/scan";
import { frontendClientOrigin } from "./utils/is-client";
import { getWebsite } from "./controllers/websites";
import { websiteFormatter } from "./utils/shapes/website-gql";

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
    const { keyid } = context.user?.payload || defaultPayload;

    if (!url) {
      return {
        website: null,
        code: 404,
        success: true,
        message: CRAWLER_FINISHED,
      };
    }

    if (
      await context.models.User.updateScanAttempt({
        userId: keyid,
      })
    ) {
      let website;

      try {
        [website] = await getWebsite({ userId: keyid, url });
      } catch (e) {
        console.error(e);
      }

      setImmediate(async () => {
        // TODO: get website stats
        await watcherCrawl({
          urlMap: url,
          userId: keyid,
          scan: true,
          subdomains: website?.subdomains,
          tld: website?.tld,
        });
      });
      return {
        website: null,
        code: 200,
        success: true,
        message: CRAWLER_FINISHED,
      };
    } else {
      throw new Error(
        "You hit your scan limit for the day, please try again tomorrow."
      );
    }
  },
  // run scans to the pagemind -> browser -> mav -> api
  scanWebsite: async (parent, args, context, info) => {
    const { url } = args;
    const { keyid } = context.user?.payload || defaultPayload;
    const unauth = typeof keyid === "undefined";

    // coming from frontend origin
    const isClient = frontendClientOrigin(context?.res?.req?.headers?.origin);

    const rateLimitConfig = !unauth
      ? {
          max: 3,
          window: "10s",
        }
      : scanRateLimitConfig;

    let errorMessage;

    // if the request did not come from the server update api usage
    if (!isClient && !unauth) {
      const [_, __, canScan] = await context.models.User.updateApiUsage({
        userId: keyid,
      });
      if (!canScan) {
        errorMessage = RATE_EXCEEDED_ERROR;
      }
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

    let data;

    if (!unauth) {
      // TODO: INC API LIMITS
      data = (await crawlPage(
        {
          url,
          userId: keyid,
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
    const { keyid, audience } = context.user?.payload || defaultPayload;

    const websiteRemoved = await context.models.Website.removeWebsite({
      userId: keyid,
      url,
      deleteMany,
      audience,
    });

    if (websiteRemoved && deleteMany) {
      return {
        ...websiteRemoved,
        url: `Success ${websiteRemoved.count} items deleted`,
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

    return await context.models.Website.updateWebsite({
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
  forgotPassword: async (_, { email }, context) => {
    return await context.models.User.forgotPassword({
      email,
    });
  },
  confirmEmail: async (_, { email }, context) => {
    const { keyid } = context.user?.payload || defaultPayload;

    return await context.models.User.confirmEmail({
      email,
      keyid,
    });
  },
  resetPassword: async (_, { email, resetCode }, context) => {
    return await context.models.User.resetPassword({
      email,
      resetCode,
    });
  },
  toggleAlert: async (_, { alertEnabled }, context) => {
    const { keyid, audience } = context.user?.payload || defaultPayload;

    return await context.models.User.toggleAlert({
      keyid,
      audience,
      alertEnabled,
    });
  },
  toggleProfile: async (_, { profileVisible }, context) => {
    return await context.models.User.toggleProfile({
      keyid: context.user?.payload?.keyid,
      profileVisible,
    });
  },
  updateScript: async (
    _,
    { url, scriptMeta, editScript, newScript },
    context
  ) => {
    const { keyid, audience } = context.user?.payload || defaultPayload;

    return await context.models.Scripts.updateScript({
      userId: keyid,
      audience,
      scriptMeta,
      pageUrl: url,
      editScript,
      newScript,
    });
  },
  sortWebsites: async (_, { order }, context) => {
    const { keyid } = context.user?.payload || defaultPayload;

    return await context.models.Website.sortWebsites({
      userId: keyid,
      order,
    });
  },
  setPageSpeedKey: async (_, { pageSpeedApiKey }, context) => {
    return await context.models.User.setPageSpeedKey({
      id: context.user?.payload?.keyid,
      pageSpeedApiKey,
    });
  },
  addPaymentSubscription,
  cancelSubscription,
  filterEmailDates,
};
