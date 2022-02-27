import { randomBytes, createHmac } from "crypto";

function genRandomString(length: number) {
  return randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

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

export function saltHashPassword(
  userpassword: string,
  saltIncluded?: boolean
): HashType {
  const salt = saltIncluded || genRandomString(16);
  return sha512(userpassword, salt);
}
