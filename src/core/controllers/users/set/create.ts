import { makeUser } from "../../../../core/models";
import { EMAIL_ERROR } from "../../../strings";
import { saltHashPassword, signJwt } from "../../../utils";
import { getNextSequenceValue } from "../../counters";
import { getUser } from "../find";
import { confirmEmail } from "../update/confirm-email";

interface UserInput {
  email: string;
  password?: string;
  googleId?: string;
  githubId?: number;
  role?: number;
}

// move googleID to SSR usage for spoof protection.
export const createUser = async ({
  email,
  password,
  googleId,
  githubId: ghID,
  role = 0,
}: Partial<UserInput>) => {
  if (!email) {
    throw new Error(EMAIL_ERROR);
  }

  const [user, collection] = await getUser({ email });

  // force number type
  const githubId = typeof ghID !== "undefined" ? Number(ghID) : null;

  // prev auth methods or coming in as new
  const googleAuthed = user && (user.googleId || googleId);
  const githubAuthed = user && (user.githubId || githubId);

  const emailConfirmed = !!googleId || !!githubId;

  const salthash = password && saltHashPassword(password, user?.salt);
  const passwordMatch = user?.password === salthash?.passwordHash;

  const shouldValidatePassword = user?.password && !googleId && !githubId;

  if (shouldValidatePassword && passwordMatch === false) {
    throw new Error(
      "Account already exist. Please check your email and try again."
    );
  }

  if (!googleId && !githubId && !password) {
    throw new Error("Password of atleast 6 chars required to register.");
  }

  if (user) {
    user.emailConfirmed = emailConfirmed;

    if (!googleId && !githubId && !user?.password) {
      throw new Error(
        user.googleId || user.githubId
          ? "Password not found, try using your google login or reset the password."
          : "Account reset password required, please reset the password by going to https://a11ywatch.com/reset-password to continue."
      );
    }
    if (googleId && user?.googleId && user?.googleId !== googleId) {
      throw new Error("GoogleID is not tied to any user.");
    }
    if (
      typeof githubId !== "undefined" &&
      user?.githubId &&
      user?.githubId !== githubId
    ) {
      throw new Error("GithubId is not tied to any user.");
    }
  }

  if ((user && user?.salt) || googleAuthed || githubAuthed) {
    if (passwordMatch || googleId || githubId) {
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
        updateCollectionProps = {
          ...updateCollectionProps,
          googleId,
          emailConfirmed,
        };
      }

      if (githubId) {
        updateCollectionProps = {
          ...updateCollectionProps,
          githubId,
          emailConfirmed,
        };
      }

      await collection.updateOne(
        { email },
        {
          $set: updateCollectionProps,
        },
        {
          upsert: true,
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
      githubId,
      emailConfirmed,
    });

    await collection.insertOne(userObject);

    if (!emailConfirmed) {
      await confirmEmail({ keyid: id });
    }

    return userObject;
  }
};
