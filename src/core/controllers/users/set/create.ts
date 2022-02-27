import { makeUser } from "@app/core/models";
import { EMAIL_ERROR } from "../../../strings";
import { saltHashPassword, signJwt } from "../../../utils";
import { getNextSequenceValue } from "../../counters";
import { getUser } from "../find";
import { confirmEmail } from "../update/confirm-email";

export const createUser = async ({ email, password, googleId, role = 0 }) => {
  if (!email) {
    throw new Error(EMAIL_ERROR);
  }
  const [user, collection] = await getUser({ email });
  const googleAuthed = user && (user.googleId || googleId);
  const salthash = password && saltHashPassword(password, user?.salt);
  const passwordMatch = user?.password === salthash?.passwordHash;

  const shouldValidatePassword = user?.password && !googleId;

  if (shouldValidatePassword && passwordMatch === false) {
    throw new Error(
      "Account already exist. Please check your email and try again."
    );
  }

  if (!googleId && !password) {
    throw new Error("Password of atleast 6 chars required to register.");
  }

  if (user) {
    if (!googleId && !user?.password) {
      throw new Error(
        user.googleId
          ? "Password not found, try using your google login or reset the password."
          : "Account reset password required, please reset the password by going to https://a11ywatch.com/reset-password to continue."
      );
    }
    if (googleId && user?.googleId && user?.googleId !== googleId) {
      throw new Error("GoogleID is not tied to any user.");
    }
  }

  if ((user && user?.salt) || googleAuthed) {
    if (passwordMatch || googleId) {
      let keyid = user?.id;
      let updateCollectionProps = {};

      if (typeof user?.id === "undefined" || user?.id === null) {
        keyid = await getNextSequenceValue("Users");
        updateCollectionProps = { id: keyid };
      }

      const jwt = signJwt({
        email: user?.email,
        role: user?.role || 0,
        keyid,
      });

      updateCollectionProps = {
        ...updateCollectionProps,
        jwt,
        lastLoginDate: new Date(),
      };

      if (googleId) {
        updateCollectionProps = { ...updateCollectionProps, googleId };
      }

      await collection.updateOne(
        { email },
        {
          $set: updateCollectionProps,
        }
      );

      return user;
    } else {
      throw new Error(EMAIL_ERROR);
    }
  } else {
    const id = await getNextSequenceValue("Users");
    const userObject = makeUser({
      email,
      password: salthash?.passwordHash,
      salt: salthash?.salt,
      id,
      jwt: signJwt({ email, role, keyid: id }),
      role,
      googleId,
    });

    await collection.insertOne(userObject);

    setImmediate(async () => {
      await confirmEmail({ keyid: id });
    });

    return userObject;
  }
};
