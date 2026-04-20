import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { Execution, DAGNode, DAGEdge } from '../types';
import { useWorkflows } from '../hooks/useWorkflows';
import { useExecution } from '../hooks/useExecution';
import DAGVisualizer from './DAGVisualizer';
import * as yaml from 'js-yaml';

const ExecutionDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [inputData, setInputData] = useState<string>('');
  const [status, setStatus] = useState<string>('idle');
  const [nodes, setNodes] = useState<DAGNode[]>([]);
  const [edges, setEdges] = useState<DAGEdge[]>([]);
  const [executingNodes, setExecutingNodes] = useState<string[]>([]);
  const [output, setOutput] = useState<Record<string, unknown>>({});

  const { getWorkflow } = useWorkflows();
  const { getExecution: fetchExecution, startExecution, connectWebSocket, disconnectWebSocket } = useExecution();

  const loadExecution = useCallback(async () => {
    if (!id) return;
    const ex = await fetchExecution(id);
    if (ex) {
      setExecution(ex);
      setStatus(ex.status);
      setOutput(ex.output_data || {});

      const wf = await getWorkflow(ex.workflow_id);
      if (wf) {
        const def = wf.definition;
        setNodes(def.agents.map((a, i) => ({
          id: a.id,
          data: { label: a.name, agent: a },
          position: { x: 100 + (i % 2) * 300, y: 100 + Math.floor(i / 2) * 150 }
        })));
        setEdges(def.edges.map(e => ({
          id: `${e.from}-${e.to}`,
          source: e.from,
          target: e.to,
          label: e.condition
        })));
      }
    }
  }, [id, fetchExecution, getWorkflow]);

  useEffect(() => {
    loadExecution();
  }, [loadExecution]);

  useEffect(() => {
    if (!id || status !== 'pending' && status !== 'running' && status !== 'success') return;

    connectWebSocket(id, (msg: unknown) => {
      const message = msg as { type?: string; status?: string; step?: unknown; outputs?: Record<string, unknown> };
      if (message.type === 'status') {
        setStatus(message.status || 'running');
        setExecutingNodes(prev => {
          const step = message.step as { agent_id?: string; status?: string };
          if (step?.agent_id && step.status === 'success') {
            return [...prev, step.agent_id];
          }
          return prev;
        });
        if (message.outputs) {
          setOutput(message.outputs);
        }
      } else if (message.type === 'step') {
        console.log('Step:', message.step);
      }
    });

    return () => disconnectWebSocket();
  }, [id, status, connectWebSocket, disconnectWebSocket]);

  const handleExecute = async () => {
    if (!execution?.workflow_id) return;
    let input: Record<string, unknown> = {};
    try {
      input = inputData ? yaml.load(inputData) as Record<string, unknown> : {};
    } catch {
      input = { data: inputData };
    }

    const execId = await startExecution(execution.workflow_id, input);
    if (execId) {
      setStatus('pending');
    }
  };

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    running: '#3b82f6',
    success: '#22c55e',
    failed: '#dc2626'
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem', height: 'calc(100vh - 80px)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Execution</h2>
          <span style={{
            padding: '0.25rem 0.75rem',
            background: statusColors[status] || '#94a3b8',
            color: '#fff',
            borderRadius: '1rem',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            {status}
          </span>
        </div>

        <div style={{
          flex: 1,
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}>
          <DAGVisualizer
            nodes={nodes}
            edges={edges}
            executingNodes={executingNodes}
          />
        </div>

        {(status === 'pending' || status === 'idle') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 500 }}>Input Data</label>
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder='Enter input as YAML...'
              style={{
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                minHeight: '100px',
                resize: 'vertical'
              }}
            />
            <button onClick={handleExecute} style={{
              padding: '0.75rem',
              background: '#0ea5e9',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 500
            }}>
              Execute Workflow
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>Output</h3>
        <div style={{
          flex: 1,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '1rem',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          whiteSpace: 'pre-wrap'
        }}>
          {Object.keys(output).length > 0 ? (
            Object.entries(output).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <strong>{key}:</strong>
                <br />
                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              </div>
            ))
          ) : (
            <div style={{ color: '#94a3b8' }}>No output yet</div>
          )}
        </div>

        {execution?.error && (
          <div style={{
            padding: '0.75rem',
            background: '#fef2f2',
            color: '#dc2626',
            borderRadius: '0.5rem'
          }}>
            {execution.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionDashboard;