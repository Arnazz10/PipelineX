import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yaml from 'js-yaml';
import { useWorkflows } from '../hooks/useWorkflows';
import DAGVisualizer from './DAGVisualizer';
import type { WorkflowDefinition, DAGNode, DAGEdge } from '../types';

const defaultWorkflow = `name: research_writer
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
`;

const WorkflowEditor: React.FC = () => {
  const [yamlContent, setYamlContent] = useState(defaultWorkflow);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<WorkflowDefinition | null>(null);
  const navigate = useNavigate();
  const { createWorkflow } = useWorkflows();

  const parseYaml = useCallback(() => {
    try {
      const parsed = yaml.load(yamlContent) as WorkflowDefinition;
      const valid = validateWorkflow(parsed);
      if (!valid.valid) {
        setError(valid.error!);
        setParseResult(null);
        return;
      }
      setError(null);
      setParseResult(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid YAML');
      setParseResult(null);
    }
  }, [yamlContent]);

  const validateWorkflow = (def: unknown): { valid: boolean; error?: string } => {
    const wf = def as WorkflowDefinition;
    if (!wf.name) return { valid: false, error: 'Missing workflow name' };
    if (!wf.agents || wf.agents.length === 0) return { valid: false, error: 'At least one agent is required' };
    if (!wf.edges || wf.edges.length === 0) return { valid: false, error: 'At least one edge is required' };
    
    const agentIds = new Set(wf.agents.map(a => a.id));
    for (const edge of wf.edges) {
      if (!agentIds.has(edge.from)) return { valid: false, error: `Edge references non-existent agent: ${edge.from}` };
      if (!agentIds.has(edge.to)) return { valid: false, error: `Edge references non-existent agent: ${edge.to}` };
    }
    
    return { valid: true };
  };

  const handleSave = async () => {
    parseYaml();
    if (!parseResult) return;

    const workflow = await createWorkflow({
      name: parseResult.name,
      description: parseResult.description,
      definition: parseResult
    });

    if (workflow) {
      navigate(`/workflow/${workflow.id}`);
    }
  };

  const convertToDAG = (def: WorkflowDefinition): { nodes: DAGNode[]; edges: DAGEdge[] } => {
    const nodes: DAGNode[] = def.agents.map((agent, idx) => ({
      id: agent.id,
      data: { label: agent.name, agent },
      position: { x: 100 + (idx % 2) * 300, y: 100 + Math.floor(idx / 2) * 150 }
    }));

    const edges: DAGEdge[] = def.edges.map(edge => ({
      id: `${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      label: edge.condition
    }));

    return { nodes, edges };
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem', height: 'calc(100vh - 80px)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Workflow YAML</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={parseYaml} style={buttonStyle('#64748b')}>Parse</button>
            <button onClick={handleSave} style={buttonStyle('#0ea5e9')}>Save</button>
          </div>
        </div>
        
        <textarea
          value={yamlContent}
          onChange={(e) => setYamlContent(e.target.value)}
          style={{
            flex: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            padding: '1rem',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            resize: 'none',
            lineHeight: 1.5
          }}
        />
        
        {error && (
          <div style={{
            padding: '0.75rem',
            background: '#fef2f2',
            color: '#dc2626',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Visual Preview</h2>
        <div style={{
          flex: 1,
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}>
          {parseResult ? (
            <DAGVisualizer
              nodes={convertToDAG(parseResult).nodes}
              edges={convertToDAG(parseResult).edges}
              executingNodes={[]}
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#94a3b8'
            }}>
              Parse YAML to see visualization
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const buttonStyle = (color: string): React.CSSProperties => ({
  padding: '0.5rem 1rem',
  background: color,
  color: '#fff',
  border: 'none',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'opacity 0.2s'
});

export default WorkflowEditor;