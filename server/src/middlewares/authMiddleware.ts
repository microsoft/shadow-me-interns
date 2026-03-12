import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import config from "../config/config";
import { isWhitelisted } from "../utils/whitelist";

/** REQ-356: Maximum absolute session lifetime (seconds). */
const MAX_TOKEN_AGE_SECONDS = 8 * 60 * 60; // 8 hours

const client = jwksClient({
  jwksUri: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
  cache: true,
  rateLimit: true,
});

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err || !key) return reject(err ?? new Error("No signing key"));
      resolve(key.getPublicKey());
    });
  });
}

interface EntraTokenPayload {
  preferred_username?: string;
  email?: string;
  upn?: string;
}

/**
 * Express middleware that validates an Entra ID token from the Authorization header.
 * Extracts the user's email, checks it against the whitelist, and attaches `req.user`.
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ message: "Missing or malformed authorization header" });
    return;
  }

  const token = header.slice(7);

  try {
    // Decode header to get kid for key lookup
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === "string" || !decoded.header.kid) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    const signingKey = await getSigningKey(decoded.header.kid);

    const payload = jwt.verify(token, signingKey, {
      audience: config.entra.clientId,
      algorithms: ["RS256"],
    }) as EntraTokenPayload & { iss?: string; iat?: number };

    // Validate issuer is a Microsoft tenant
    if (!payload.iss?.startsWith("https://login.microsoftonline.com/")) {
      res.status(401).json({ message: "Invalid token issuer" });
      return;
    }

    // REQ-356: Reject tokens older than the absolute session limit (8 hours)
    if (payload.iat) {
      const tokenAgeSec = Math.floor(Date.now() / 1000) - payload.iat;
      if (tokenAgeSec > MAX_TOKEN_AGE_SECONDS) {
        res
          .status(401)
          .json({ message: "Session expired, please log in again" });
        return;
      }
    }

    const email = (
      payload.preferred_username ??
      payload.email ??
      payload.upn ??
      ""
    )
      .toLowerCase()
      .trim();

    if (!email) {
      res.status(401).json({ message: "No email claim found in token" });
      return;
    }

    // Normalize to @microsoft.com alias for consistency across the app
    const alias = email.split("@")[0]!;
    const normalizedEmail = `${alias}@microsoft.com`;
    const whitelisted = isWhitelisted(email);

    (req as Request & { user: { email: string; whitelisted: boolean } }).user =
      {
        email: normalizedEmail,
        whitelisted,
      };
    next();
  } catch (err) {
    console.error("Token validation failed:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
