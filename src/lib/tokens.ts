import { createHash, randomBytes } from "crypto";

export function createPlainToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createTokenPair() {
  const token = createPlainToken();
  return {
    token,
    tokenHash: hashToken(token),
  };
}
