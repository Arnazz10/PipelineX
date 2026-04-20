from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, execution_id: str, websocket: WebSocket):
        await websocket.accept()
        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = []
        self.active_connections[execution_id].append(websocket)
    
    def disconnect(self, execution_id: str, websocket: WebSocket):
        if execution_id in self.active_connections:
            self.active_connections[execution_id].remove(websocket)
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]
    
    async def send_message(self, execution_id: str, message: dict):
        if execution_id in self.active_connections:
            for connection in self.active_connections[execution_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast(self, message: dict):
        for execution_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except:
                    pass


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, execution_id: str):
    await manager.connect(execution_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect(execution_id, websocket)


async def notify_execution(execution_id: str, message: dict):
    await manager.send_message(execution_id, message)