# LLM Workflow Orchestration Engine - Specification

## Project Overview

**Project Name:** LLM Workflow Orchestration Engine
**Type:** Full-stack AI workflow orchestration platform
**Core Functionality:** A workflow engine where users define AI pipelines in YAML (like GitHub Actions but for LLM tasks) — each node is an agent with tools. Frontend visualizes the DAG live.
**Target Users:** Developers building complex LLM-powered applications, AI engineers, and data scientists.

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, LangGraph
- **Database:** PostgreSQL with asyncpg
- **Frontend:** TypeScript, React, React Flow (DAG visualization)
- **Configuration:** YAML-based workflow definitions
- **Deployment:** Docker, Docker Compose

---

## Architecture

### System Components

1. **API Layer (FastAPI)**
   - REST endpoints for workflow CRUD operations
   - WebSocket for real-time execution updates
   - Authentication & authorization

2. **Workflow Engine (LangGraph)**
   - YAML parser for workflow definitions
   - Graph execution engine
   - State management across nodes

3. **Agent System**
   - Agent factory for creating nodes
   - Tool registry
   - LLM provider abstraction

4. **Database Layer (PostgreSQL)**
   - Workflows table
   - Executions table
   - Execution logs table

5. **Frontend (React + TypeScript)**
   - Workflow editor with YAML input
   - DAG visualization (reactflow)
   - Execution dashboard

---

## Functionality Specification

### 1. YAML Workflow Definition

Each workflow is defined in YAML with the following structure:

```yaml
name: workflow_name
description: Optional description
version: "1.0"

agents:
  - id: agent_1
    name: Research Agent
    model: gpt-4
    system_prompt: You are a research assistant...
    tools:
      - web_search
      - calculator

  - id: agent_2
    name: Writer Agent
    model: gpt-4
    system_prompt: You are a technical writer...

edges:
  - from: agent_1
    to: agent_2
    condition: always  # always, on_success, on_failure

input:
  - name: query
    type: string
    required: true

output:
  - name: result
    type: string
```

### 2. Available Tools

- `web_search` - Search the web
- `calculator` - Mathematical operations
- `code_executor` - Execute Python code
- `file_reader` - Read files
- `file_writer` - Write files

### 3. Edge Conditions

- `always` - Execute next node always
- `on_success` - Execute only if previous succeeded
- `on_failure` - Execute only if previous failed

### 4. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /workflows | Create workflow |
| GET | /workflows | List workflows |
| GET | /workflows/{id} | Get workflow |
| PUT | /workflows/{id} | Update workflow |
| DELETE | /workflows/{id} | Delete workflow |
| POST | /workflows/{id}/execute | Execute workflow |
| GET | /executions | List executions |
| GET | /executions/{id} | Get execution status |
| GET | /ws/execute/{id} | WebSocket for updates |

### 5. Database Schema

```sql
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0',
    definition JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, success, failed
    input JSONB,
    output JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error TEXT
);

CREATE TABLE execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES executions(id),
    agent_id VARCHAR(255),
    step VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. Frontend Features

- **Workflow Editor**: YAML input with syntax highlighting
- **DAG Visualization**: Real-time graph showing nodes and edges
- **Execution Dashboard**: View running and past executions
- **Live Updates**: WebSocket connection for execution progress

---

## Acceptance Criteria

1. Users can create, read, update, and delete workflows via YAML
2. Workflows are parsed and stored in PostgreSQL
3. Execution builds a LangGraph and runs the DAG
4. Progress is streamed via WebSocket
5. Frontend displays DAG with execution state (pending, running, success, failed)
6. System handles agent failures gracefully with retry logic
7. All endpoints return proper HTTP status codes
8. YAML validation provides clear error messages

---

## Example Workflows

### Simple Sequential Pipeline

```yaml
name: simple_research_writer
description: Research a topic and write a summary
version: "1.0"

agents:
  - id: researcher
    name: Research Agent
    model: gpt-4
    system_prompt: |
      You are a research assistant. Given a topic, search the web
      and provide key findings.
    tools:
      - web_search

  - id: writer
    name: Writer Agent
    model: gpt-4
    system_prompt: |
      You are a technical writer. Given research findings,
      write a concise summary.

edges:
  - from: researcher
    to: writer
    condition: always

input:
  - name: topic
    type: string
    required: true

output:
  - name: summary
    type: string
```

### Conditional Workflow

```yaml
name: content_moderation
description: Moderate content with conditional processing
version: "1.0"

agents:
  - id: classifier
    name: Classifier
    model: gpt-4
    system_prompt: Classify the content as appropriate or inappropriate.

  - id: approver
    name: Approver
    model: gpt-4
    system_prompt: Approve the content.

  - id: reporter
    name: Reporter
    model: gpt-4
    system_prompt: Report inappropriate content.

edges:
  - from: classifier
    to: approver
    condition: on_success
  - from: classifier
    to: reporter
    condition: on_failure

input:
  - name: content
    type: string
    required: true

output:
  - name: status
    type: string
```

---

## File Structure

```
llm-workflow-engine/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py           # Configuration
│   │   ├── database.py         # Database setup
│   │   ├── models.py           # Pydantic models
│   │   ├── schemas.py          # API schemas
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── workflows.py    # Workflow CRUD
│   │   │   └── executions.py   # Execution endpoints
│   │   ├── engine/
│   │   │   ├── __init__.py
│   │   │   ├── parser.py       # YAML parser
│   │   │   ├── executor.py     # LangGraph executor
│   │   │   └── agents.py       # Agent definitions
│   │   ├── tools/
│   │   │   ├── __init__.py
│   │   │   └── registry.py    # Tool registry
│   │   └── websocket.py       # WebSocket handler
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── WorkflowEditor.tsx
│   │   │   ├��─ DAGVisualizer.tsx
│   │   │   ├── ExecutionDashboard.tsx
│   │   │   └── Navigation.tsx
│   │   ├── hooks/
│   │   │   ├── useWorkflows.ts
│   │   │   └── useExecution.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── styles/
│   │       └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
└── SPEC.md
```