from typing import Any, Callable, Awaitable, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from pydantic import BaseModel

from app.tools.registry import tool_registry
from app.config import settings


class AgentState(BaseModel):
    messages: list = []
    current_agent: Optional[str] = None
    agent_outputs: dict = {}
    execution_history: list = []


class Agent:
    def __init__(self, agent_id: str, name: str, model: str, system_prompt: str, tools: list[str]):
        self.agent_id = agent_id
        self.name = name
        self.model_name = model
        self.system_prompt = system_prompt
        self.tool_names = tools
        self.llm = self._create_llm()
        self.tools = self._create_tools()
    
    def _create_llm(self):
        if settings.openai_api_key:
            return ChatOpenAI(
                model=self.model_name,
                api_key=settings.openai_api_key,
                temperature=0.7
            )
        else:
            from langchain_community.chat_models import ChatFakeList
            return ChatFakeList(temperature=0.7)
    
    def _create_tools(self):
        tools = []
        for tool_name in self.tool_names:
            try:
                tools.append(tool_registry.get_langchain_tool(tool_name))
            except ValueError:
                pass
        return tools
    
    def bind_tools(self):
        if self.tools:
            return self.llm.bind_tools(self.tools)
        return self.llm
    
    async def execute(self, state: AgentState, input_data: Any) -> AgentState:
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=f"Input: {str(input_data)}")
        ]
        
        try:
            if self.tools:
                tool_node = ToolNode(self.tools)
                llm_with_tools = self.bind_tools()
                ai_message = await llm_with_tools.ainvoke(messages)
                messages.append(ai_message)
                
                if hasattr(ai_message, "tool_calls") and ai_message.tool_calls:
                    tool_results = await tool_node.ainvoke(ai_message)
                    messages.extend(tool_results.get("messages", []))
                    
                    response = "\n".join([
                        f"Tool: {m.name}\nResult: {m.content}"
                        for m in tool_results.get("messages", [])
                    ])
                else:
                    response = ai_message.content
            else:
                response = await self.llm.ainvoke(messages)
                response = response.content if hasattr(response, "content") else str(response)
            
            state.agent_outputs[self.agent_id] = response
            state.execution_history.append({
                "agent_id": self.agent_id,
                "status": "success",
                "output": response
            })
        except Exception as e:
            state.agent_outputs[self.agent_id] = f"Error: {str(e)}"
            state.execution_history.append({
                "agent_id": self.agent_id,
                "status": "failed",
                "error": str(e)
            })
        
        return state


class WorkflowExecutor:
    def __init__(self, workflow_def: dict):
        self.workflow_def = workflow_def
        self.agents: dict[str, Agent] = {}
        self.edges: list[dict] = workflow_def.get("edges", [])
        self._build_agents()
    
    def _build_agents(self):
        for agent_def in self.workflow_def.get("agents", []):
            agent = Agent(
                agent_id=agent_def["id"],
                name=agent_def["name"],
                model=agent_def.get("model", "gpt-4"),
                system_prompt=agent_def.get("system_prompt", ""),
                tools=agent_def.get("tools", [])
            )
            self.agents[agent_def["id"]] = agent
    
    def get_graph(self):
        from langgraph.graph import StateGraph, END
        from typing import TypedDict
        
        class WorkflowState(TypedDict):
            messages: list
            current_agent: Optional[str]
            agent_outputs: dict
            execution_history: list
            failed_agents: set
        
        graph = StateGraph(WorkflowState)
        
        for agent_id, agent in self.agents.items():
            graph.add_node(agent_id, lambda state, a=agent: self._execute_agent(a, state))
        
        for edge in self.edges:
            from_agent = edge["from"]
            to_agent = edge["to"]
            condition = edge.get("condition", "always")
            
            if condition == "always":
                graph.add_edge(from_agent, to_agent)
            elif condition == "on_success":
                graph.add_conditional_edges(
                    from_agent,
                    lambda x: x.get("execution_history", [])[-1].get("status") == "success",
                    {
                        True: to_agent,
                        False: END
                    }
                )
            elif condition == "on_failure":
                graph.add_conditional_edges(
                    from_agent,
                    lambda x: x.get("execution_history", [])[-1].get("status") == "failed",
                    {
                        True: to_agent,
                        False: END
                    }
                )
        
        entry = self._get_entry_point()
        if entry:
            graph.set_entry_point(entry)
        
        return graph.compile()
    
    def _execute_agent(self, agent: Agent, state: dict) -> dict:
        import asyncio
        
        input_data = state.get("current_input", "")
        
        messages = [
            SystemMessage(content=agent.system_prompt),
            HumanMessage(content=f"Input: {str(input_data)}")
        ]
        
        try:
            if agent.tools:
                tool_node = ToolNode(agent.tools)
                llm_with_tools = agent.bind_tools()
                ai_message = asyncio.run(llm_with_tools.ainvoke(messages))
                
                if hasattr(ai_message, "tool_calls") and ai_message.tool_calls:
                    tool_results = asyncio.run(tool_node.ainvoke(ai_message))
                    response = "\n".join([
                        f"Tool: {m.name}\nResult: {m.content}"
                        for m in tool_results.get("messages", [])
                    ])
                else:
                    response = ai_message.content if hasattr(ai_message, "content") else str(ai_message)
            else:
                response = asyncio.run(agent.llm.ainvoke(messages))
                response = response.content if hasattr(response, "content") else str(response)
            
            state["agent_outputs"][agent.agent_id] = response
            state["execution_history"].append({
                "agent_id": agent.agent_id,
                "status": "success"
            })
        except Exception as e:
            state["agent_outputs"][agent.agent_id] = f"Error: {str(e)}"
            state["execution_history"].append({
                "agent_id": agent.agent_id,
                "status": "failed",
                "error": str(e)
            })
            state["failed_agents"] = state.get("failed_agents", set()) | {agent.agent_id}
        
        return state
    
    def _get_entry_point(self) -> Optional[str]:
        target_agents = {edge["to"] for edge in self.edges}
        for agent_id in self.agents.keys():
            if agent_id not in target_agents:
                return agent_id
        return None
    
    async def execute(self, input_data: dict, callback=None) -> dict:
        graph = self.get_graph()
        
        initial_state = {
            "messages": [],
            "current_agent": None,
            "agent_outputs": {},
            "execution_history": [],
            "failed_agents": set(),
            "current_input": input_data.get("query", str(input_data))
        }
        
        try:
            result = await graph.ainvoke(initial_state)
            
            if callback:
                await callback({
                    "status": "completed",
                    "outputs": result.get("agent_outputs", {}),
                    "history": result.get("execution_history", [])
                })
            
            return {
                "status": "success",
                "outputs": result.get("agent_outputs", {}),
                "history": result.get("execution_history", [])
            }
        except Exception as e:
            if callback:
                await callback({
                    "status": "failed",
                    "error": str(e)
                })
            
            return {
                "status": "failed",
                "error": str(e)
            }