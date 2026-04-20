# PipelineX - LLM Workflow Orchestration Engine

PipelineX is a powerful, full-stack orchestration platform designed to define, visualize, and execute complex AI agent workflows. It allows developers to build AI pipelines using a simple YAML-based configuration, similar to GitHub Actions, but specifically tailored for LLM-powered tasks.

##  Key Features

- **YAML-Based Workflows**: Define your AI agents, tools, and execution logic in a clean, human-readable YAML format.
- **Agentic Orchestration**: Powered by **LangGraph**, enabling complex state management and cyclic graph executions.
- **Live DAG Visualization**: A modern React-based interface with **React Flow** to visualize your workflow's Directed Acyclic Graph (DAG) in real-time.
- **Real-time Monitoring**: WebSocket integration for streaming execution updates and logs.
- **Extensible Tool Registry**: Easily plug in custom tools like web search, code execution, and calculators.
- **Dockerized Architecture**: Simplified deployment using Docker and Docker Compose.

##  Tech Stack

- **Backend**: Python 3.11+, FastAPI, LangGraph, PostgreSQL (asyncpg)
- **Frontend**: React 18, TypeScript, Vite, React Flow, Tailwind CSS
- **Infrastructure**: Docker, Docker Compose

##  Project Structure

```text
llm-workflow-engine/
├── backend/            # FastAPI & LangGraph service
│   ├── app/
│   │   ├── api/        # REST & WebSocket endpoints
│   │   ├── engine/     # YAML parser & Graph executor
│   │   └── tools/      # Agent tool implementations
├── frontend/           # React & React Flow dashboard
│   ├── src/
│   │   ├── components/ # DAG Visualizer & Editor
│   │   └── hooks/      # API & WebSocket state management
├── examples/           # Sample YAML workflow definitions
└── docker-compose.yml  # Full-stack orchestration
```

##  Getting Started

### Prerequisites
- Docker & Docker Compose
- OpenAI API Key (or other supported LLM provider)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Arnazz10/PipelineX.git
   cd PipelineX
   ```

2. **Set up Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_api_key_here
   DATABASE_URL=postgresql+asyncpg://user:password@db:5432/pipelinex
   ```

3. **Launch the platform**
   ```bash
   docker-compose up --build
   ```

The dashboard will be available at `http://localhost:5173` and the API documentation at `http://localhost:8000/docs`.

##  Example Workflow

```yaml
name: research_and_write
agents:
  - id: researcher
    name: Research Agent
    model: gpt-4
    tools: [web_search]
  - id: writer
    name: Writer Agent
    model: gpt-4

edges:
  - from: researcher
    to: writer
    condition: always
```

##  License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
