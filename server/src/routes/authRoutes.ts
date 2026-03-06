import { Request, Response, Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

/**
 * GET /api/auth/me
 *
 * Returns the authenticated user's email. Used by the frontend after
 * MSAL login to confirm the user is whitelisted. The authMiddleware
 * handles token validation and whitelist checking.
 */
router.get("/me", authMiddleware, (req: Request, res: Response) => {
  const { email, whitelisted } = (req as Request & { user: { email: string; whitelisted: boolean } }).user;
  res.json({ email, whitelisted });
});

export default router;
