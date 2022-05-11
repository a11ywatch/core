import { CRAWLER_FINISHED } from "./strings";
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
import { watcherCrawl } from "./utils/watcher_crawl";
import { scanWebsite, crawlPage } from "@app/core/actions";
import { gqlRateLimiter } from "@app/rest/limiters/scan";

const defaultPayload = {
  keyid: undefined,
  audience: undefined,
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
      setImmediate(async () => {
        await watcherCrawl({ urlMap: url, userId: keyid, scan: true });
      });
      return {
        website: null,
        code: 200,
        success: true,
        message: CRAWLER_FINISHED,
      };
    } else {
      throw new Error(
        "You hit your scan limit for the day, please try again tomorrow"
      );
    }
  },
  scanWebsite: async (parent, args, context, info) => {
    const { url } = args;
    const { keyid } = context.user?.payload || defaultPayload;
    const unauth = typeof keyid === "undefined";

    // apply rate limit on unauth and assign if truthy
    let errorMessage =
      unauth &&
      (await gqlRateLimiter(
        {
          parent,
          args,
          context,
          info,
        },
        {
          max: 2,
          window: "14s",
        }
      ));

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    if (!unauth) {
      // TODO: INC API LIMITS
      const page = (await crawlPage(
        {
          url,
          userId: keyid,
        },
        false
      )) as any;

      const { website } = page?.data ?? {};
      const { issues, ...props } = website ?? {};

      // TODO: REFACTOR API TO RETURN MODEL FOR WEBSITE
      return {
        ...page,
        website: {
          ...props,
          issue: issues?.issues ?? [], // refactor api
        },
      };
    }

    return await scanWebsite({
      url,
      noStore: true,
    });
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
    { userId, url, customHeaders, pageInsights },
    context
  ) => {
    const { keyid } = context.user?.payload || defaultPayload;

    return await context.models.Website.updateWebsite({
      userId: userId || keyid,
      url,
      pageHeaders: customHeaders,
      pageInsights,
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
  addPaymentSubscription,
  cancelSubscription,
  filterEmailDates,
};
