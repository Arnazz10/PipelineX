import { useState, useCallback, useEffect, useRef } from 'react';
import type { Execution } from '../types';

const API_BASE = '/api';

export function useExecution() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/executions`);
      if (!res.ok) throw new Error('Failed to fetch executions');
      const data = await res.json();
      setExecutions(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getExecution = useCallback(async (id: string): Promise<Execution | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/executions/${id}`);
      if (!res.ok) throw new Error('Failed to fetch execution');
      const data = await res.json();
      setCurrentExecution(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const startExecution = useCallback(async (workflowId: string, inputData: Record<string, unknown>): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_data: inputData })
      });
      if (!res.ok) throw new Error('Failed to start execution');
      const data = await res.json();
      return data.execution_id;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const connectWebSocket = useCallback((executionId: string, onMessage: (msg: unknown) => void) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/execute/${executionId}`);
    
    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        onMessage({ message: event.data });
      }
    };
    ws.onerror = (e) => console.error('WebSocket error:', e);
    ws.onclose = () => console.log('WebSocket disconnected');
    
    wsRef.current = ws;
    return ws;
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => disconnectWebSocket();
  }, [disconnectWebSocket]);

  return {
    executions,
    currentExecution,
    loading,
    error,
    fetchExecutions,
    getExecution,
    startExecution,
    connectWebSocket,
    disconnectWebSocket
  };
}