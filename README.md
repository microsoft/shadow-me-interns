# Shadow Me Interns

## Project Overview

This project establishes a centralized platform enabling interns in Belgium to easily locate and shadow (technical) meetings. It accomplishes this by parsing unstructured email inputs sent to a "shadow inbox" by Full-Time Employees (FTEs), structuring the extracted data into explicit JSON objects using AI via Logic Apps, and storing the entries in Azure CosmosDB. A React-based frontend polls the backing server to present the collected schedule to end users.

> [!NOTE]
> The shadow inbox is private, if you want to know the shadow inbox address, message Aryan Shah (t-aryanshah) on Teams or through Outlook. This is to prevent abuse.

## Why This Exists

As an intern, shadowing customer-facing meetings is one of the most effective ways to learn. But finding those meetings is painful:

- **Manual outreach is inefficient.** Interns have to individually message FTEs asking if they have any upcoming meetings available to shadow. This is a lot of work for a "maybe".
- **FTEs forget.** Even when an FTE agrees, they may forget to loop the intern in when the meeting actually happens, or not know which intern to invite.
- **Some FTEs are too new themselves.** Not every FTE is in a position to bring interns into their calls, making cold outreach a gamble.
- **Some meetings simply cannot be shadowed.** Some meetings might be sensitive or the customer might prefer to not have interns shadow the meeting.

The core problem: there was no central place where interns could browse meetings that are explicitly available for shadowing.

## How It Works

The solution flips the workflow. Instead of interns chasing down FTEs, FTEs opt in by forwarding a meeting invite to a shared shadow inbox. From there, the system handles everything automatically.

```
FTE forwards meeting invite --> Shadow Inbox --> AI extracts details --> Cosmos DB --> Frontend dashboard
```

- **For FTEs:** The effort is minimal. Their existing workflow was to forward the calendar invite directly to an intern. Now they forward it to a single inbox instead. One action, all interns can see it.
- **For Interns:** A central hub displays every shadowable meeting with details like time, host, role, and an invite link to join. No outreach needed.

**Input:** An FTE's forwarded meeting email.
**Output:** A live, browsable dashboard of all shadowable meetings.

## Email Metadata for FTEs

When forwarding a meeting invite to the shadow inbox, FTEs can optionally include metadata in the email body to provide additional context. All fields are optional, the AI will extract what it can from the invite itself, but explicit metadata takes priority.

| Field        | Description                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| **FW Name**  | FTE display name (Blank if not provided)                                                                     |
| **FW Email** | FTE email address, used to notify which interns clicked join (Blank if not provided)                         |
| **Subject**  | Meeting subject override                                                                                     |
| **Capacity** | Max number of interns allowed to shadow the meeting (defaults to `1` if omitted)                             |
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

| Component              | Technology                                |
| ---------------------- | ----------------------------------------- |
| **Inbox**              | Email forwarding trigger (`@outlook.com`) |
| **Processing**         | Microsoft Logic Apps workflow engine      |
| **Data Parser**        | Azure OpenAI Agent (`gpt-4o-mini`)        |
| **Backend Storage**    | Azure Cosmos DB (serverless)              |
| **Frontend**           | React with TypeScript (Vite)              |
| **State/Data Polling** | TanStack Query `useQuery()`               |
| **API Route Setup**    | Express Server                            |

## Application Flow

### 1. Sourcing (Data Ingestion)

- **Trigger Event:** Fires whenever a meeting forward arrives in the designated "shadow inbox" via the email connector.
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

### 5. Frontend Display Environment (React TS / Tanstack)

A user-facing application built on React that dynamically retrieves available schedule inputs.

- **Database Polling:** Rather than refreshing constantly, TanStack Query (`useQuery`) polls the database every 5 seconds. This fetches records effectively without a constant UI refresh penalty, tracking valid objects inserted via the Logic Apps workflow.
- **Authentication:** Sessions are managed locally. Validation happens through temporary code processes sent via email, matching Microsoft `@microsoft.com` rules. Validated code responses store secure session markers in the browser cache to bypass future lockouts.

> [!NOTE]
> For FTEs, it's important that these invites don't land in the wrong hands, so verifying that the user who is accessing the tool is crucial, therefore there is a preconfigured list (whitelist) of people that can access the tool right now. (Only Belgium interns)

## Contributing

The project is currently in preview phase and only available for Belgium, it may not be the optimal solution or might be missing critical features. If you have any suggestions or would like to contribute yourself, feel free to engage!
