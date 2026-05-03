import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const SQLTerminal = ({ onRefreshSchema }) => {
  const [history, setHistory] = useState([
    { type: 'output', content: 'Blockchain SQL Terminal v1.0.0' },
    { type: 'output', content: 'Type "sql commit" to save state, "sql revert" to restore last commit.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = async (e) => {
    if (e.key !== 'Enter' || !input.trim() || loading) return;

    const cmd = input.trim().toLowerCase();
    const newHistory = [...history, { type: 'command', content: input }];
    setHistory(newHistory);
    setInput('');

    if (cmd === 'sql commit') {
      setLoading(true);
      try {
        const { data } = await api.post('/api/query/commit');
        setHistory([...newHistory, { type: 'success', content: data.message }]);
      } catch (err) {
        setHistory([...newHistory, { type: 'error', content: err.response?.data?.error || 'Commit failed' }]);
      } finally {
        setLoading(false);
      }
    } else if (cmd === 'sql revert') {
      setLoading(true);
      try {
        const { data } = await api.post('/api/query/revert');
        setHistory([...newHistory, { type: 'success', content: data.message }]);
        if (onRefreshSchema) onRefreshSchema();
      } catch (err) {
        setHistory([...newHistory, { type: 'error', content: err.response?.data?.error || 'Revert failed' }]);
      } finally {
        setLoading(false);
      }
    } else {
      setHistory([...newHistory, { type: 'error', content: `Unknown command: ${cmd}. Available: sql commit, sql revert` }]);
    }
  };

  return (
    <div className="terminal-card">
      <div className="terminal-header">
        <div className="terminal-dot dot-red"></div>
        <div className="terminal-dot dot-yellow"></div>
        <div className="terminal-dot dot-green"></div>
        <div className="terminal-title">Database Console</div>
      </div>
      <div className="terminal-body" ref={bodyRef}>
        {history.map((line, i) => (
          <div key={i} className="terminal-line">
            {line.type === 'command' ? (
              <>
                <span className="terminal-prompt">$</span>
                <span className="terminal-command">{line.content}</span>
              </>
            ) : (
              <div className={`terminal-output ${line.type === 'error' ? 'terminal-error' : ''} ${line.type === 'success' ? 'terminal-success' : ''}`}>
                {line.content}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="terminal-output">Processing...</div>}
      </div>
      <div className="terminal-input-wrap">
        <span className="terminal-prompt" style={{ marginRight: 8 }}>$</span>
        <input
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="sql commit / sql revert"
          disabled={loading}
          autoFocus
        />
      </div>
    </div>
  );
};

export default SQLTerminal;
