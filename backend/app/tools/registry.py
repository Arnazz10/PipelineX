from typing import Any, Callable, Awaitable
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import tool
import json


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, Callable[[dict], Awaitable[str]]] = {}
        self._register_builtins()
    
    def _register_builtins(self):
        self.register("web_search", self._web_search)
        self.register("calculator", self._calculator)
        self.register("code_executor", self._code_executor)
        self.register("file_reader", self._file_reader)
        self.register("file_writer", self._file_writer)
    
    def register(self, name: str, func: Callable[[dict], Awaitable[str]]):
        self._tools[name] = func
    
    def get(self, name: str) -> Callable[[dict], Awaitable[str]]:
        if name not in self._tools:
            raise ValueError(f"Tool '{name}' not found")
        return self._tools[name]
    
    def list_tools(self) -> list[str]:
        return list(self._tools.keys())
    
    def get_langchain_tool(self, name: str):
        if name == "web_search":
            return tool(
                name="web_search",
                func=DuckDuckGoSearchRun().run,
                description="Search the web for current information"
            )
        elif name == "calculator":
            @tool(name="calculator")
            def calc_tool(expression: str) -> str:
                allowed_names = {
                    "abs": abs, "min": min, "max": max, "round": round,
                    "pow": pow, "sum": sum, "len": len
                }
                try:
                    result = eval(expression, {"__builtins__": {}}, allowed_names)
                    return str(result)
                except Exception as e:
                    return f"Error: {str(e)}"
            return calc_tool
        elif name == "code_executor":
            @tool(name="code_executor")
            def code_tool(code: str) -> str:
                try:
                    import io
                    from contextlib import redirect_stdout
                    f = io.StringIO()
                    with redirect_stdout(f):
                        exec(code, {})
                    return f.getvalue() or "Executed successfully"
                except Exception as e:
                    return f"Error: {str(e)}"
            return code_tool
        else:
            raise ValueError(f"Tool '{name}' not available as LangChain tool")
    
    async def execute(self, name: str, params: dict) -> str:
        func = self.get(name)
        return await func(params)
    
    async def _web_search(self, params: dict) -> str:
        query = params.get("query", "")
        if not query:
            raise ValueError("Missing required parameter: query")
        
        try:
            search = DuckDuckGoSearchRun()
            result = search.run(query)
            return result
        except Exception as e:
            return f"Search error: {str(e)}"
    
    async def _calculator(self, params: dict) -> str:
        expression = params.get("expression", "")
        if not expression:
            raise ValueError("Missing required parameter: expression")
        
        try:
            allowed_names = {
                "abs": abs, "min": min, "max": max, "round": round,
                "pow": pow, "sum": sum, "len": len
            }
            result = eval(expression, {"__builtins__": {}}, allowed_names)
            return str(result)
        except Exception as e:
            return f"Calculation error: {str(e)}"
    
    async def _code_executor(self, params: dict) -> str:
        code = params.get("code", "")
        if not code:
            raise ValueError("Missing required parameter: code")
        
        try:
            import io
            from contextlib import redirect_stdout, redirect_stderr
            
            f = io.StringIO()
            with redirect_stdout(f), redirect_stderr(f):
                exec(code, {})
            
            return f.getvalue() or "Code executed successfully"
        except Exception as e:
            return f"Error: {str(e)}"
    
    async def _file_reader(self, params: dict) -> str:
        path = params.get("path", "")
        if not path:
            raise ValueError("Missing required parameter: path")
        
        try:
            with open(path, "r") as f:
                return f.read()
        except Exception as e:
            return f"Error reading file: {str(e)}"
    
    async def _file_writer(self, params: dict) -> str:
        path = params.get("path", "")
        content = params.get("content", "")
        
        if not path:
            raise ValueError("Missing required parameter: path")
        if not content:
            raise ValueError("Missing required parameter: content")
        
        try:
            with open(path, "w") as f:
                f.write(content)
            return f"File written successfully: {path}"
        except Exception as e:
            return f"Error writing file: {str(e)}"
    
    def _calc_wrapper(self, expression: str) -> str:
        allowed_names = {
            "abs": abs, "min": min, "max": max, "round": round,
            "pow": pow, "sum": sum, "len": len
        }
        try:
            result = eval(expression, {"__builtins__": {}}, allowed_names)
            return str(result)
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _code_wrapper(self, code: str) -> str:
        try:
            import io
            from contextlib import redirect_stdout
            
            f = io.StringIO()
            with redirect_stdout(f):
                exec(code, {})
            
            return f.getvalue() or "Executed successfully"
        except Exception as e:
            return f"Error: {str(e)}"


tool_registry = ToolRegistry()