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
  // plain email sent
  if (!password && !googleId && !githubId) {
    throw new Error("A password is required to login.");
  }

  const [user, collection] = await getUser({ email });

  if (!user) {
    throw new Error(EMAIL_ERROR);
  }

  // password validation
  const salthash = password && saltHashPassword(password, user?.salt);
  const passwordMatch = user?.password === salthash?.passwordHash;
  const shouldValidatePassword = !passwordMatch && !googleId && !githubId;

  // password incorrect
  if (shouldValidatePassword) {
    throw new Error(EMAIL_ERROR);
  }

  const googleLoginAttempt = typeof googleId !== "undefined";
  const githubLoginAttempt = typeof githubId !== "undefined";

  if (googleLoginAttempt) {
    const isGoogleMatch = user?.googleId == googleId || !user?.googleId;

    if (!isGoogleMatch) {
      throw new Error("Google ID is not tied to user.");
    }
  }

  if (githubLoginAttempt) {
    // github id is a number but safely check between strings future proof conversions.
    const isGithubMatch = user?.githubId == githubId || !user?.githubId;

    if (!isGithubMatch) {
      throw new Error("Github ID is not tied to user.");
    }
  }

  // user verification succeeded.

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

  if (googleLoginAttempt) {
    updateCollectionProps = { ...updateCollectionProps, googleId };
  }

  if (githubLoginAttempt) {
    updateCollectionProps = { ...updateCollectionProps, githubId };
  }

  await collection.updateOne(
    { email },
    { $set: updateCollectionProps },
    { upsert: true }
  );

  return {
    ...user,
    jwt,
  };
};

export { verifyUser };
