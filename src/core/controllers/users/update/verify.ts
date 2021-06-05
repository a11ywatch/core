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
  const [user, collection] = await getUser({ email }, true);

  if (!user) {
    throw new Error(EMAIL_ERROR);
  }

  const salthash = password && saltHashPassword(password, user?.salt);
  const passwordMatch = user?.password === salthash?.passwordHash;
  const shouldValidatePassword = user?.password && !googleId;

  if (shouldValidatePassword && passwordMatch === false) {
    throw new Error(EMAIL_ERROR);
  }
  
  if (user?.googleId && !shouldValidatePassword && user.googleId !== googleId) {
    // TODO: RAISE AWARENESS MISUSE
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
