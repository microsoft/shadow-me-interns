# Shadow Me Interns

## Project Overview

This project establishes a centralized platform enabling Solution Engineering (SE) Interns to easily locate and shadow technical meetings. It accomplishes this by parsing unstructured email inputs sent to a "shadow inbox" by Full-Time Employees (FTEs), structuring the extracted data into explicit JSON objects using AI via Logic Apps, and storing the entries in Azure CosmosDB. A React-based frontend polls the backing server to present the collected schedule to end users.

## Why This Exists

As a Solutions Engineering intern, shadowing customer-facing meetings is one of the most effective ways to learn. But finding those meetings is painful:

- **Manual outreach is inefficient.** Interns have to individually message full-time Solution Engineers asking if they have any upcoming meetings available to shadow. This is a lot of work for a "maybe".
- **FTEs forget.** Even when an FTE agrees, they may forget to loop the intern in when the meeting actually happens.
- **Some FTEs are too new themselves.** Not every SE is in a position to bring interns into their calls, making cold outreach a gamble.
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
| **API Route Setup**    | Bun Server                                |

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
