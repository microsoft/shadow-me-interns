import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  clientUrl: string;
  jwtSecret: string;
  whitelistedEmails: string[];
  cosmos: {
    endpoint: string;
    key: string;
    database: string;
    container: string;
    authContainer: string;
  };
  resendApiKey: string;
  viewonlyBypassEmail: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "",
  whitelistedEmails: (process.env.WHITELISTED_EMAILS || "")
    .split(",")
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean),
  cosmos: {
    endpoint: process.env.COSMOS_ENDPOINT || "",
    key: process.env.COSMOS_KEY || "",
    database: process.env.COSMOS_DATABASE || "",
    container: process.env.COSMOS_CONTAINER || "",
    authContainer: process.env.COSMOS_AUTH_CONTAINER || "auth_codes",
  },
  resendApiKey: process.env.RESEND_API_KEY || "",
  viewonlyBypassEmail: (process.env.VIEWONLY_BYPASS_EMAIL || "")
    .toLowerCase()
    .trim(),
};

export default config;
