import { useState, useCallback } from 'react';
import type { Workflow, WorkflowCreate } from '../types';

const API_BASE = '/api';

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/workflows`);
      if (!res.ok) throw new Error('Failed to fetch workflows');
      const data = await res.json();
      setWorkflows(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkflow = useCallback(async (workflow: WorkflowCreate): Promise<Workflow | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      });
      if (!res.ok) throw new Error('Failed to create workflow');
      const data = await res.json();
      setWorkflows(prev => [data, ...prev]);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getWorkflow = useCallback(async (id: string): Promise<Workflow | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/workflows/${id}`);
      if (!res.ok) throw new Error('Failed to fetch workflow');
      return await res.json();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWorkflow = useCallback(async (id: string, workflow: Partial<WorkflowCreate>): Promise<Workflow | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      });
      if (!res.ok) throw new Error('Failed to update workflow');
      const data = await res.json();
      setWorkflows(prev => prev.map(w => w.id === id ? data : w));
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWorkflow = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/workflows/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete workflow');
      setWorkflows(prev => prev.filter(w => w.id !== id));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    workflows,
    loading,
    error,
    fetchWorkflows,
    createWorkflow,
    getWorkflow,
    updateWorkflow,
    deleteWorkflow
  };
}