# Intern Support

> [!WARNING]
> Due to security not being reviewed officially by Microsoft, this tool is not live and should not be put live by anyone for the time being. If you know someone who can help approve this tool to be put online without security issues, contact Aryan Shah on Teams.

**This platform allows Interns to get access to real customer-facing meetings/projects, and FTEs get a frictionless way to find intern support for their meetings without extra coordination overhead.**

https://intern.support - not live

## Project Overview

This project establishes a centralized platform enabling interns in Belgium to easily discover and join (technical) meetings. It accomplishes this by parsing unstructured email inputs sent to a shared inbox by Full-Time Employees (FTEs), structuring the extracted data into explicit JSON objects using AI via Logic Apps, and storing the entries in Azure CosmosDB. A React-based frontend polls the backing server to present the collected schedule to end users.

## Demo

[<video src="demo_intern_support.mp4" controls width="100%"></video>](https://github.com/user-attachments/assets/2c223c26-6816-4eac-86c9-87d9829a7976)

## Why This Exists

As an intern, joining customer-facing meetings is one of the most effective ways to learn and contribute. But finding those meetings is painful:

- **Manual outreach is inefficient.** Interns have to individually message FTEs asking if they have any upcoming meetings available to join. This is a lot of work for a "maybe".
- **FTEs forget.** Even when an FTE agrees, they may forget to loop the intern in when the meeting actually happens, or not know which intern to invite.
- **Some FTEs are too new themselves.** Not every FTE is in a position to bring interns into their calls, making cold outreach a gamble.
- **Some meetings are not suitable.** Some meetings might be sensitive or the customer might prefer to not have interns join.
- **FTEs don't know which intern to ask** Even if the FTE has an intern-friendly opportunity, they usually don't know all interns or don't know which intern(s) would be able to support them.

The core problem: there was no central place where interns could browse meetings that are explicitly available for them to join.

## How It Works

The solution flips the workflow. Instead of interns chasing down FTEs, FTEs opt in by forwarding a meeting invite to a shared inbox. From there, the system handles everything automatically.

```
FTE forwards meeting invite --> Shared Inbox --> AI extracts details --> Cosmos DB --> Frontend dashboard
```

- **For FTEs:** The effort is minimal — just forward the invite to a single inbox instead of to an individual intern. The workflow stays almost identical, but now all interns can discover the meeting and self-serve. FTEs no longer need to find or coordinate with a specific intern; interested interns come to them, making it easy to get intern support when useful.
- **For Interns:** A central hub displays every available meeting with details like time, host, role, and an invite link to join. No outreach needed.

**Input:** An FTE's forwarded meeting email.
**Output:** A live, browsable dashboard of all available meetings.

## Email Metadata for FTEs

When forwarding a meeting invite to the shared inbox, FTEs can optionally include metadata in the email body to provide additional context. All fields are optional, the AI will extract what it can from the invite itself, but explicit metadata takes priority.

| Field        | Description                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| **FW Name**  | FTE display name (Blank if not provided)                                                                     |
| **FW Email** | FTE email address, used to notify which interns clicked join (Blank if not provided)                         |
| **Subject**  | Meeting subject override                                                                                     |
| **Capacity** | Max number of interns allowed to join the meeting (defaults to `1` if omitted)                               |
| **Role**     | FTE role, e.g. `SE`, `CSA`, `CSAM` (short forms or full forms accepted, the AI normalizes valid roles)       |
| **Team**     | Relevant team, e.g. `AI Apps`, `Data`, `Cloud & AI`                                                          |
| **Sector**   | `Enterprise Commercial` or `Public Sector` (short forms or full forms are accepted, the AI normalizes these) |

### How to use

In the body of the forwarded invite just type the values as key-value, these fields don't need to be exactly the same, as long as the meaning is similar. (e.g. instead of `FW Name` using `Forwarder Name`)

**Example**:

```txt
Forwarder Name: Aryan Shah
FW Email: t-aryanshah@microsoft.com
Capacity: 2
Role: SE
Team: AI Apps
```

## Architecture Overview

![Architecture Diagram](architecture.svg)

| Component               | Technology                                |
| ----------------------- | ----------------------------------------- |
| **Inbox**               | Email forwarding trigger (`@outlook.com`) |
| **Processing**          | Microsoft Logic Apps workflow engine      |
| **Data Parser**         | Azure OpenAI Agent (`gpt-4o-mini`)        |
| **Backend Storage**     | Azure Cosmos DB (serverless)              |
| **Backend API**         | Express Server (Node.js / TypeScript)     |
| **Frontend**            | React with TypeScript (Bun)               |
| **UI Library**          | Fluent UI React v9                        |
| **State/Data Polling**  | TanStack Query `useQuery()` (5s interval) |
| **Authentication**      | Microsoft Entra ID (MSAL)                 |
| **Email Notifications** | Resend API                                |
| **Frontend Hosting**    | Azure Static Web Apps                     |
| **Backend Hosting**     | Azure App Service (Linux, Node 24)        |
| **IaC**                 | Bicep templates                           |

## Application Flow

### 1. Sourcing (Data Ingestion)

- **Trigger Event:** Fires whenever a meeting forward arrives in the designated shared inbox via the email connector.
- **Processing Step:** The HTML structure of the raw meeting email is stripped into clean, standard text inside Logic Apps for parsing.

### 2. Formatting (AI Logic Mapping)

A schema is explicitly applied over the unstructured text values inside an AI configuration map:

- Maps native short forms for team logic variables if included (e.g., `role: SE`).
- Prioritizes manually written mapped rules in the email body over extracted email signature definitions if a mismatch occurs.
- Includes mandatory fallback variable rules:
  - Blank default `capacity`: `1`
  - Hardcoded requirement: `joined_interns: []`

### 3. Bypassing Parse Mapping Limitations (Logic App Routing)

Logic Apps generally hide extraction agent data payloads inside hidden `lastAssistantMessage` fields nested dynamically. The standard visual token UI is bypassed entirely to get valid input mappings onto CosmosDB.

- **Variable bypass expression:** `outputs('extraction_agent')`
- A strict **Parse JSON** stage cleans the variables, mapping tokens accurately.

### 4. Storage (Azure Cosmos DB)

Connects the newly structured JSON nodes directly to insert rows into a database matching frontend structure mappings.

### 5. Frontend Display Environment (React TS / TanStack)

A user-facing application built on React that dynamically retrieves available schedule inputs.

- **Database Polling:** TanStack Query (`useQuery`) polls the database every 5 seconds. This fetches records effectively without a constant UI refresh penalty.
- **Authentication:** Microsoft Entra ID via MSAL (redirect flow). After Entra authentication, the backend verifies the ID token and checks the user's email against a whitelist.
- **View-only mode:** Users authenticated via Entra ID but not on the whitelist can still browse meetings in read-only mode (join/leave/calendar buttons disabled, delete still available).
- **Dark mode:** User-togglable light/dark theme using Fluent UI's `webLightTheme` / `webDarkTheme`, persisted in `localStorage`.

## Security

- **Entra ID authentication.** Users sign in with their Microsoft organizational account via MSAL's authorization code flow with PKCE. No passwords are managed by the application.
- **Whitelist enforcement.** A preconfigured list of Belgium intern email addresses determines full access. The whitelist is stored as an environment variable on the backend and matched by alias prefix to handle cross-tenant UPNs.
- **View-only access.** Authenticated users not on the whitelist can browse meetings but cannot join, leave, or add to calendar. Delete is still available for cleanup.
- **ID token validation.** The backend validates Entra ID tokens using Microsoft's JWKS endpoint (`jwks-rsa`), checking audience, issuer, and signing key.
- **Private inbox.** The shared inbox address is not published anywhere in this repository or in the frontend. To obtain it, contact the project maintainer directly on Teams or Outlook.

## Deployment

All infrastructure is defined as Bicep templates in `azure/bicep/` with corresponding deployment scripts in `azure/scripts/`.

### Prerequisites

- Azure CLI installed and authenticated (`az login`)
- Bun runtime installed (for frontend builds)
- Node.js / npm installed (for backend builds)
- An Entra ID app registration (single-page application, multi-tenant)

### Deployment Scripts

| Script                                  | Purpose                                                      |
| --------------------------------------- | ------------------------------------------------------------ |
| `azure/scripts/deploy-all.ps1`          | Deploys all infrastructure (except backend code)             |
| `azure/scripts/deploy-client.ps1`       | Builds and deploys frontend to Azure Static Web Apps         |
| `azure/scripts/deploy-server.ps1`       | Builds and deploys backend to Azure App Service (deprecated) |
| `azure/scripts/deploy-database.ps1`     | Deploys Cosmos DB infrastructure                             |
| `azure/scripts/deploy-appservice.ps1`   | Deploys App Service infrastructure (deprecated)              |
| `azure/scripts/deploy-staticwebapp.ps1` | Deploys Static Web App infrastructure                        |
| `azure/scripts/deploy-logicapp.ps1`     | Deploys Logic App infrastructure                             |

### Quick Start

```powershell
# Deploy all infrastructure
.\azure\scripts\deploy-all.ps1 -ResourceGroup "intern-support"

# Deploy frontend only
.\azure\scripts\deploy-client.ps1

# Deploy backend (via VS Code: right-click server/ → Deploy to Web App)
```

> [!IMPORTANT]
> The App Service backend code must be deployed manually via VS Code (right-click `server/` → Deploy to Web App). The `deploy-all.ps1` script deploys infrastructure only.

### Environment Variables

**Backend (App Service):**

| Variable             | Description                                     |
| -------------------- | ----------------------------------------------- |
| `ENTRA_TENANT_ID`    | Entra ID directory (tenant) ID                  |
| `ENTRA_CLIENT_ID`    | Entra ID application (client) ID                |
| `COSMOS_ENDPOINT`    | Cosmos DB account endpoint                      |
| `COSMOS_KEY`         | Cosmos DB account key                           |
| `COSMOS_DATABASE`    | Cosmos DB database name                         |
| `COSMOS_CONTAINER`   | Cosmos DB container name                        |
| `RESEND_API_KEY`     | Resend email service API key                    |
| `WHITELISTED_EMAILS` | Comma-separated list of allowed email addresses |
| `ALLOWED_ORIGINS`    | Comma-separated CORS origins                    |

**Frontend (client/src/utils/auth.ts):**

The Entra ID `clientId` and `authority` are configured directly in the MSAL config file.

### Entra ID Setup

1. Register a **single-page application** in Entra ID (multi-tenant)
2. Add redirect URIs: `https://your-domain.com`, `http://localhost:5173`
3. (optional) Under **Token configuration**, add the `email` optional claim for ID tokens
4. Under **Supported account types**, select "Multiple Entra ID tenants"

### Post-Deployment: Authorize API Connections

The Bicep template creates the three API connections (Outlook, Content Conversion, Cosmos DB) automatically, but they require manual authorization after deployment:

1. Go to the [Azure Portal](https://portal.azure.com) and navigate to your resource group.
2. For each connection (`outlook`, `conversionservice`, `documentdb`), open the resource and click **Edit API connection**.
3. Click **Authorize**, sign in with the appropriate account, and then **Save**.

## Contributing

The project is currently in preview phase and only available for Belgium, it may not be the optimal solution or might be missing critical features. If you have any suggestions or would like to contribute yourself, feel free to engage!
