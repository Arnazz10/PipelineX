import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { DAGNode, DAGEdge } from '../types';

interface DAGVisualizerProps {
  nodes: DAGNode[];
  edges: DAGEdge[];
  executingNodes?: string[];
}

const AgentNode: React.FC<{ data: { label: string; agent: DAGNode['data']['agent'] }; executing?: boolean }> = ({ 
  data, 
  executing 
}) => (
  <div style={{
    padding: '1rem',
    background: executing ? '#fef3c7' : '#fff',
    border: `2px solid ${executing ? '#f59e0b' : '#3b82f6'}`,
    borderRadius: '0.5rem',
    minWidth: '180px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  }}>
    <Handle type="target" position={Position.Left} style={{ background: '#3b82f6' }} />
    <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#1e293b' }}>{data.label}</div>
    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{data.agent.model}</div>
    {data.agent.tools.length > 0 && (
      <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {data.agent.tools.map(tool => (
          <span key={tool} style={{
            fontSize: '0.625rem',
            padding: '0.125rem 0.375rem',
            background: '#e0f2fe',
            color: '#0369a1',
            borderRadius: '0.25rem'
          }}>{tool}</span>
        ))}
      </div>
    )}
    <Handle type="source" position={Position.Right} style={{ background: '#3b82f6' }} />
  </div>
);

const DAGVisualizer: React.FC<DAGVisualizerProps> = ({ nodes, edges, executingNodes = [] }) => {
  const flowNodes: Node[] = nodes.map(node => ({
    id: node.id,
    type: 'agent',
    position: node.position,
    data: node.data,
    executing: executingNodes.includes(node.id)
  }));

  const flowEdges: Edge[] = edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: 'smoothstep',
    animated: executingNodes.includes(edge.source),
    style: { stroke: '#3b82f6' },
    labelStyle: { fill: '#64748b', fontSize: 12 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
  }));

  const [flowNodesState, setFlowNodes, onNodesChange] = useNodesState(flowNodes);
  const [flowEdgesState, setFlowEdges, onEdgesChange] = useEdgesState(flowEdges);

  React.useEffect(() => {
    setFlowNodes(flowNodes);
    setFlowEdges(flowEdges);
  }, [nodes, edges, executingNodes]);

  const nodeTypes = {
    agent: (props: { data: { label: string; agent: DAGNode['data']['agent'] }; executing?: boolean }) => (
      <AgentNode data={props.data} executing={props.executing} />
    )
  };

  return (
    <ReactFlow
      nodes={flowNodesState}
      edges={flowEdgesState}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      attributionPosition="bottom-left"
    >
      <Background color="#e2e8f0" gap={20} />
      <Controls />
      <MiniMap nodeColor="#3b82f6" style={{ background: '#f8fafc' }} />
    </ReactFlow>
  );
};

export default DAGVisualizer;