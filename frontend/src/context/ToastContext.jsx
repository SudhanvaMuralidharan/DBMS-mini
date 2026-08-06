import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toastData) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toastData, id }]);

    // Auto dismiss after 5 seconds (matching CSS animation)
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  // Connect to SSE stream on mount
  useEffect(() => {
    console.log('[SSE] Connecting to real-time events stream...');
    const source = new EventSource('/api/events');

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'connected') {
          console.log('[SSE] Real-time connection established successfully.');
          return;
        }

        const { event: eventName, data } = payload;

        if (eventName === 'terminal-query') {
          console.log('[SSE] Received SQL query from backend terminal:', data);

          // Add toast notification
          addToast({
            type: data.success ? 'success' : 'error',
            sql: data.sql,
            operation: data.operation,
            rowCount: data.rowCount,
            auditTrail: data.auditTrail,
            error: data.error
          });

          // Dispatch a custom DOM event so that individual components (like SQLTerminal or schema panel)
          // can sync up their state without relying on context-polling or prop-drilling
          window.dispatchEvent(
            new CustomEvent('terminal-query', {
              detail: data
            })
          );
        }
      } catch (err) {
        console.error('[SSE] Failed to parse event payload:', err);
      }
    };

    source.onerror = (err) => {
      console.warn('[SSE] EventSource connection failed. Retrying in background...');
    };

    return () => {
      console.log('[SSE] Closing events connection.');
      source.close();
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Absolute overlay container for floating toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-header">
              <span className={`toast-title ${toast.type}`}>
                {toast.type === 'success' ? '✔ Terminal SQL Success' : '❌ Terminal SQL Error'}
              </span>
              <button className="toast-close" onClick={() => removeToast(toast.id)}>&times;</button>
            </div>
            
            <div className="toast-body">
              {toast.type === 'success' ? (
                <div>
                  Executed <strong style={{ color: 'var(--text)' }}>{toast.operation}</strong> by <code>terminal-admin</code>.
                  <div className="toast-meta" style={{ marginTop: 2 }}>{toast.rowCount} row(s) affected.</div>
                  {toast.auditTrail && (
                    <div className="toast-meta" style={{ marginTop: 2, color: 'var(--success)' }}>
                      Audited in Block #{toast.auditTrail.blockIndex}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#d08080' }}>{toast.error}</div>
              )}
              <div className="toast-sql">{toast.sql}</div>
            </div>
            
            {/* Animated shrinking progress bar */}
            <div className="toast-progress"></div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
