import { createHmac } from "crypto";
import { asyncRandomGenerate } from "./generate";

function sha512(password, salt) {
  const hash = createHmac("sha512", salt);
  hash.update(password);
  return {
    salt,
    passwordHash: hash.digest("hex"),
  };
}

interface HashType {
  passwordHash?: string;
  salt?: string;
}

// soft salt hash password - todo: use bcrypt
export async function saltHashPassword(
  userpassword: string,
  saltIncluded?: string
): Promise<HashType> {
  const salt = saltIncluded || (await asyncRandomGenerate(16));
  return sha512(userpassword, salt);
}
