import { EMAIL_ERROR } from "../../../strings";
import { saltHashPassword, signJwt } from "../../../utils";
import { getNextSequenceValue } from "../../counters";
import { getUser } from "../find";
import { AuthParams } from "../types";

const verifyUser = async ({
  password,
  email,
  googleId,
  githubId,
}: AuthParams) => {
  if (!email) {
    throw new Error(EMAIL_ERROR);
  }
  if (email && !password && !googleId && !githubId) {
    throw new Error("A password is required to login.");
  }

  const [user, collection] = await getUser({ email });

  if (!user) {
    throw new Error(EMAIL_ERROR);
  }

  if (!googleId && !user?.password) {
    throw new Error(
      user.googleId
        ? "Password not found, try using your google login or reset the password."
        : "Account reset password required, please reset the password by going to https://a11ywatch.com/reset-password to continue."
    );
  }

  const salthash = password && saltHashPassword(password, user?.salt);
  const passwordMatch = user?.password === salthash?.passwordHash;
  const shouldValidatePassword = user?.password && !googleId;

  if (shouldValidatePassword && passwordMatch === false) {
    throw new Error(EMAIL_ERROR);
  }

  if (user?.googleId && !shouldValidatePassword && user.googleId !== googleId) {
    throw new Error("GoogleID is not tied to user.");
  }

  if (user?.githubId && !shouldValidatePassword && user.githubId !== githubId) {
    throw new Error("GithubId is not tied to user.");
  }

  let id = user?.id;
  let updateCollectionProps = {};

  if (user?.id === null) {
    id = await getNextSequenceValue("Users");
    updateCollectionProps = { id };
  }

  const jwt = signJwt({
    email: email || user?.email,
    role: user?.role,
    keyid: id,
  });

  updateCollectionProps = {
    ...updateCollectionProps,
    jwt,
    lastLoginDate: new Date(),
  };

  if (googleId) {
    updateCollectionProps = { ...updateCollectionProps, googleId };
  }

  if (githubId) {
    updateCollectionProps = { ...updateCollectionProps, githubId };
  }

  await collection.updateOne({ email }, { $set: updateCollectionProps });

  return {
    ...user,
    jwt,
  };
};

export { verifyUser };
