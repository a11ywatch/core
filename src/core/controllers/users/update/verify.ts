/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { EMAIL_ERROR } from "../../../strings";
import { saltHashPassword, signJwt } from "../../../utils";
import { getNextSequenceValue } from "../../counters";
import { getUser } from "../find";

const verifyUser = async ({ password, email, googleId }) => {
  if (!email) {
    throw new Error(EMAIL_ERROR);
  }
  if (email && !password && !googleId) {
    throw new Error("A password is required to login.");
  }

  const [user, collection] = await getUser({ email }, true);

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
  } else if (user?.googleId && !shouldValidatePassword && user.googleId !== googleId) {
    // TODO: RAISE AWARENESS MISUSE HOW CLIENT IS TRYING TO LOGIN?
    throw new Error("GoogleID is not tied to any user.");
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

  updateCollectionProps = { ...updateCollectionProps, jwt };

  if (googleId) {
    updateCollectionProps = { ...updateCollectionProps, googleId };
  }

  await collection.updateOne({ email }, { $set: updateCollectionProps });
  return {
    ...user,
    jwt,
  };
};

export { verifyUser };
