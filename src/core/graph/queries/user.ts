import { UsersController } from "../../controllers";
import { getPayLoad } from "../../utils/query-payload";

export const user = async (_, { id, password }, ctx) => {
  const { userId, audience } = getPayLoad(ctx, {
    id,
    password,
  });

  if (typeof userId !== undefined && userId !== null) {
    let user;
    try {
      [user] = await UsersController().getUser({
        id: userId,
      });
    } catch (e) {
      console.error(e);
    }

    if (!user) {
      return null;
    }

    // remove non gql types
    const { googleId, githubId, emailConfirmed, ...props } = user ?? {};

    return {
      ...props,
      emailConfirmed: !!emailConfirmed, // temp fix
      keyid: userId,
      activeSubscription: user?.paymentSubscription?.status === "active",
      loggedIn: !!ctx.user,
      accountType: audience + "" || "",
      passwordRequired: !user?.password && !googleId && !githubId, // password not found [TODO: change to simply check not password]
    };
  }

  throw new Error(
    "Authorization token not found. Please add your authorization header and try again."
  );
};
