import { Request, Response, Router } from "express";
import config from "../config/config";
import {
  createVerificationCode,
  validateVerificationCode,
} from "../utils/cosmos";
import { sendVerificationEmail } from "../utils/email";
import { signToken, verifyToken } from "../utils/jwt";
import { isWhitelisted } from "../utils/whitelist";

const router = Router();

/**
 * POST /api/auth/request-code
 * Body: { email: string }
 *
 * Validates the email against the whitelist, generates a 6-digit code,
 * persists it in Cosmos DB (1-hour TTL) and sends it via SMTP.
 */
router.post("/request-code", async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email || typeof email !== "string") {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isWhitelisted(normalizedEmail)) {
      res
        .status(403)
        .json({ message: "Email is not authorized to access this platform" });
      return;
    }

    // View-only account bypasses code generation & email sending
    if (
      config.viewonlyBypassEmail &&
      normalizedEmail === config.viewonlyBypassEmail
    ) {
      const token = signToken(normalizedEmail);
      res.json({ message: "Verification code sent", token });
      return;
    }

    const code = await createVerificationCode(normalizedEmail);
    await sendVerificationEmail(normalizedEmail, code);

    res.json({ message: "Verification code sent" });
  } catch (err) {
    console.error("Error in /request-code:", err);
    res.status(500).json({ message: "Failed to send verification code" });
  }
});

/**
 * POST /api/auth/verify-code
 * Body: { email: string, code: string }
 *
 * Validates the code against Cosmos DB. On success returns a signed JWT.
 */
router.post("/verify-code", async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body as { email?: string; code?: string };

    if (!email || !code) {
      res.status(400).json({ message: "Email and code are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const valid = await validateVerificationCode(normalizedEmail, code);

    if (!valid) {
      res.status(401).json({ message: "Invalid or expired verification code" });
      return;
    }

    const token = signToken(normalizedEmail);
    res.json({ token });
  } catch (err) {
    console.error("Error in /verify-code:", err);
    res.status(500).json({ message: "Failed to verify code" });
  }
});

/**
 * POST /api/auth/validate-token
 * Body: { token: string }
 *
 * Quick endpoint the frontend can call on load to check if a stored JWT is
 * still valid, without having to hit a protected resource.
 */
router.post("/validate-token", (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };

  if (!token) {
    res.status(400).json({ valid: false, message: "Token is required" });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ valid: false, message: "Invalid or expired token" });
    return;
  }

  res.json({ valid: true, email: payload.email });
});

export default router;
