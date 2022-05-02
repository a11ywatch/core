import { getPayLoad } from "../../utils/query-payload";
import { ApolloError } from "apollo-server-errors";

export const user = async (_, { id, password }, context) => {
  const { models, ...ctx } = context;
  const { userId, audience } = getPayLoad(ctx, {
    id,
    password,
  });

  if (typeof userId !== undefined && userId !== null) {
    const [user] = await models.User.getUser({
      id: userId,
    });

    return {
      ...user,
      keyid: userId,
      activeSubscription: user?.paymentSubscription?.status === "active",
      loggedIn: !!ctx.user,
      accountType: audience ?? "",
      passwordRequired: !user?.password && !user.googleId,
    };
  }

  throw new ApolloError(
    "Authorization token not found. Please add your authorization header and try again.",
    "404"
  );
};
