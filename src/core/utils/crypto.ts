import { createHash, createCipheriv, createDecipheriv } from "crypto";
import { SERVER_SALT } from "../../config/config";

// key and iv
let key = null;

try {
  // attempt sha256 salting
  key = createHash("sha256").update(SERVER_SALT, "ascii").digest();
} catch(e) {
  console.error(e)
}

const iv = "1234567890123456";

// cipher string
export const cipher = (secret) => {
  if(!secret) {
    return ""
  }
  try {
    const cipherer = createCipheriv("aes-256-cbc", key, iv);
    const encrypted = cipherer.update(secret);

    return Buffer.concat([encrypted, cipherer.final()]).toString("hex");
  } catch (error) {
    console.log(error);
  }
};

// decipher string
export const decipher = (encrypted) => {
  if(!encrypted) {
    return ""
  }
  try {
    const textParts = encrypted.split(":");
    const encryptedData = Buffer.from(textParts.join(":"), "hex");
    const decipherer = createDecipheriv("aes-256-cbc", key, iv);
    const decrypted = decipherer.update(encryptedData);

    return Buffer.concat([decrypted, decipherer.final()]).toString();
  } catch (error) {
    console.log(error);
  }
};
