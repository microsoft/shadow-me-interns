import { PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "49bcdb40-7ad8-4dea-a84e-fe2cc5bf63f9",
    authority: "https://login.microsoftonline.com/common",
    redirectUri:
      typeof window !== "undefined" && window.location.hostname !== "localhost"
        ? "https://intern.support"
        : "http://localhost:5173",
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const getToken = async (): Promise<string | null> => {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) return null;

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: accounts[0],
    });
    return response.idToken;
  } catch {
    return null;
  }
};
