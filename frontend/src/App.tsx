import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useWorkflows } from './hooks/useWorkflows';
import WorkflowEditor from './components/WorkflowEditor';
import DAGVisualizer from './components/DAGVisualizer';
import ExecutionDashboard from './components/ExecutionDashboard';
import type { Workflow, DAGNode, DAGEdge } from './types';

const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Link to="/" style={{
          fontWeight: 700,
          fontSize: '1.25rem',
          color: '#0f172a',
          textDecoration: 'none'
        }}>
          LLM Workflow Engine
        </Link>
        <div style={{ marginLeft: '3rem', display: 'flex', gap: '1rem' }}>
          <Link to="/" style={navLinkStyle()}>Workflows</Link>
          <Link to="/new" style={navLinkStyle()}>New</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<WorkflowList />} />
        <Route path="/workflow/:id" element={<WorkflowDetail />} />
        <Route path="/new" element={<WorkflowEditor />} />
        <Route path="/execute/:id" element={<ExecutionDashboard />} />
      </Routes>
    </div>
  );
};

const navLinkStyle = (): React.CSSProperties => ({
  color: '#64748b',
  textDecoration: 'none',
  fontWeight: 500,
  transition: 'color 0.2s'
});

const WorkflowList: React.FC = () => {
  const { workflows, fetchWorkflows, deleteWorkflow } = useWorkflows();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Workflows</h1>
        <Link to="/new" style={{
          padding: '0.75rem 1.5rem',
          background: '#0ea5e9',
          color: '#fff',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontWeight: 500
        }}>New Workflow</Link>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {workflows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            No workflows yet. Create your first workflow!
          </div>
        ) : (
          workflows.map(workflow => (
            <div key={workflow.id} style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'box-shadow 0.2s'
            }}>
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{workflow.name}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  {workflow.description || 'No description'}
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  {workflow.definition.agents?.length || 0} agents · v{workflow.version}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => navigate(`/execute/${workflow.id}`)} style={actionButton('#22c55e')}>
                  Execute
                </button>
                <button onClick={() => deleteWorkflow(workflow.id)} style={actionButton('#ef4444')}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const WorkflowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getWorkflow } = useWorkflows();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<DAGNode[]>([]);
  const [edges, setEdges] = useState<DAGEdge[]>([]);

  useEffect(() => {
    if (id) {
      getWorkflow(id).then(wf => {
        if (wf) {
          setWorkflow(wf);
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
      });
    }
  }, [id, getWorkflow]);

  if (!workflow) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', height: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={() => navigate('/')} style={{
          padding: '0.5rem 1rem',
          background: '#f1f5f9',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          color: '#64748b'
        }}>← Back</button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{workflow.name}</h1>
      </div>
      <div style={{ height: 'calc(100% - 60px)', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden', background: '#fff' }}>
        <DAGVisualizer nodes={nodes} edges={edges} />
      </div>
    </div>
  );
};

const actionButton = (color: string): React.CSSProperties => ({
  padding: '0.5rem 1rem',
  background: color,
  color: '#fff',
  border: 'none',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '0.875rem'
});

export default App;