# LLM Workflow Orchestration Engine

A workflow engine where users define AI pipelines in YAML (like GitHub Actions but for LLM tasks) — each node is an agent with tools. Built with Python, LangGraph, FastAPI, TypeScript, PostgreSQL, and YAML.

## Features

- **YAML-based Workflows**: Define AI pipelines declaratively
- **Agent System**: Each node is an LLM agent with tools
- **DAG Visualization**: Live visualization of workflow execution
- **WebSocket Streaming**: Real-time execution updates
- **PostgreSQL Storage**: Persistent workflow and execution history

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, LangGraph, SQLAlchemy, PostgreSQL
- **Frontend**: TypeScript, React, React Flow (DAG visualization)
- **Deployment**: Docker, Docker Compose

## Quick Start

### With Docker Compose

```bash
# Start all services
docker-compose up -d

# The app will be available at:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### Manual Setup

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /workflows | Create workflow |
| GET | /workflows | List workflows |
| GET | /workflows/{id} | Get workflow |
| PUT | /workflows/{id} | Update workflow |
| DELETE | /workflows/{id} | Delete workflow |
| POST | /workflows/{id}/execute | Execute workflow |
| GET | /executions | List executions |
| GET | /executions/{id} | Get execution |
| GET | /ws/execute/{id} | WebSocket for updates |

## Example Workflow

```yaml
name: research_writer
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
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:postgres@localhost:5432/postgres |
| OPENAI_API_KEY | OpenAI API key | - |
| DEBUG | Enable debug mode | true |

## License

MIT