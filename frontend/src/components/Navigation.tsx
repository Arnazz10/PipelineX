import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  const linkStyle = (path: string): React.CSSProperties => ({
    padding: '0.75rem 1.5rem',
    color: location.pathname === path ? '#0ea5e9' : '#64748b',
    textDecoration: 'none',
    fontWeight: 500,
    borderBottom: location.pathname === path ? '2px solid #0ea5e9' : '2px solid transparent',
    transition: 'all 0.2s'
  });

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 2rem',
      display: 'flex',
      gap: '2rem'
    }}>
      <Link to="/" style={linkStyle('/')}>Workflows</Link>
      <Link to="/executions" style={linkStyle('/executions')}>Executions</Link>
      <Link to="/new" style={linkStyle('/new')}>New Workflow</Link>
    </nav>
  );
};

export default Navigation;