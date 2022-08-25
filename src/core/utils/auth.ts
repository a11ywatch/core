import jwt from "jsonwebtoken";
import { PRIVATE_KEY, PUBLIC_KEY } from "../../config/config";

const issuer = "AUTH/RESOURCE";
const expiresIn = "365 days";
let algorithm = "RS256";

const subject = "user@.com";
const audience = "http://adahelpalerts.com";
const keyid = "";

let defaultKey;

interface SignOnOptions {
  issuer: string;
  subject: string;
  audience: string;
  expiresIn: string;
  algorithm?: string;
  keyid?: string;
}

let signOptions: SignOnOptions = {
  issuer,
  subject,
  audience,
  expiresIn,
  algorithm,
  keyid,
};

if (!PRIVATE_KEY && !PUBLIC_KEY) {
  defaultKey = Buffer.from("secret", "base64");
  signOptions = {
    issuer,
    subject,
    audience,
    expiresIn,
    keyid,
  };
}

const privateKey = String(PRIVATE_KEY || defaultKey).trim();
const publicKey = String(PUBLIC_KEY || defaultKey).trim();

export function signJwt({ email, role, keyid }, options = {}) {
  return jwt.sign(
    {
      subject: email,
      // TODO: audience should be domain -> move role to another prop or combine with subject
      audience: role,
      keyid,
    },
    privateKey,
    Object.assign({}, signOptions, options) as any
  );
}

export function verifyJwt(token, options = {}) {
  return jwt.verify(
    token,
    publicKey,
    Object.assign({}, signOptions, options, { algorithm: [algorithm] })
  );
}

export function decodeJwt(token) {
  return token && jwt.decode(token, { complete: true });
}
