import jwt from "jsonwebtoken";
import { PRIVATE_KEY, PUBLIC_KEY } from "../../config/config";

const issuer = "AUTH/RESOURCE";
const expiresIn = "365 days";
const algorithm = "RS256";

const subject = "user@.com";
const audience = "http://adahelpalerts.com"; // fix this with valid domain
const keyid = "";

let defaultKey;
let jwtOptions: jwt.SignOptions = {
  issuer,
  subject,
  audience,
  expiresIn,
  algorithm,
  keyid,
};

// auto add the tokens if none found
if (!PRIVATE_KEY && !PUBLIC_KEY) {
  defaultKey = Buffer.from("secret", "base64");
}

const privateKey = String(PRIVATE_KEY || defaultKey).trim();
const publicKey = String(PUBLIC_KEY || defaultKey).trim();

export const signJwt = ({ email, role, keyid }) => {
  return jwt.sign(
    {
      subject: email,
      // TODO: audience should be domain -> move role to another prop or combine with subject
      audience: role || 0,
      keyid,
    },
    privateKey,
    jwtOptions
  );
};

// verify the jwt token
export const verifyJwt = (token) => {
  if (token) {
    try {
      return jwt.verify(token, publicKey, jwtOptions);
    } catch (e) {}
  }
};

// decode the token without verifying
export const decodeJwt = (token) => {
  if (token) {
    return jwt.decode(token, { complete: true });
  }
};
