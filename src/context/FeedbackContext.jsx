/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Feedback.css';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolveRef = useRef(null);
  const cancelButtonRef = useRef(null);

  // ─── Toast System ─────────────────────────────────────────────────────────

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  // ─── Confirmation Modal System ───────────────────────────────────────────

  const confirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
  } = {}) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState({
        title,
        message,
        confirmText,
        cancelText,
        variant,
        isProcessing: false,
      });
    });
  }, []);

  const handleConfirmClose = useCallback((result) => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result);
      confirmResolveRef.current = null;
    }
    setConfirmState(null);
  }, []);

  // Keyboard navigation for confirmation modal (Escape to cancel, auto-focus Cancel)
  useEffect(() => {
    if (!confirmState) return;

    // Focus cancel button by default to prevent accidental triggers
    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleConfirmClose(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState, handleConfirmClose]);

  return (
    <FeedbackContext.Provider value={{ showToast, confirm }}>
      {children}

      {/* Standardized Toast Overlay */}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite" role="region" aria-label="Notifications">
          {toasts.map((toast) => {
            let IconComponent = Info;
            if (toast.type === 'success') IconComponent = CheckCircle2;
            else if (toast.type === 'error') IconComponent = AlertCircle;
            else if (toast.type === 'warning') IconComponent = AlertTriangle;

            return (
              <div
                key={toast.id}
                className={`toast-item toast-${toast.type || 'info'}`}
                role="status"
              >
                <div className="toast-icon">
                  <IconComponent size={18} />
                </div>
                <div className="toast-message">{toast.message}</div>
                <button
                  type="button"
                  className="toast-close-btn"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Close notification"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Standardized Confirmation Modal */}
      {confirmState && (
        <div
          className="confirmation-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !confirmState.isProcessing) {
              handleConfirmClose(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-desc"
        >
          <div className="confirmation-modal">
            <div className="confirmation-content">
              <div className="confirmation-header">
                <div className={`confirmation-icon-wrap ${confirmState.variant || 'danger'}`}>
                  {confirmState.variant === 'danger' ? (
                    <AlertTriangle size={22} />
                  ) : confirmState.variant === 'warning' ? (
                    <AlertCircle size={22} />
                  ) : (
                    <Info size={22} />
                  )}
                </div>
                <div className="confirmation-header-text">
                  <h3 id="confirm-modal-title" className="confirmation-title">
                    {confirmState.title}
                  </h3>
                  <p id="confirm-modal-desc" className="confirmation-message">
                    {confirmState.message}
                  </p>
                </div>
              </div>

              <div className="confirmation-actions">
                <button
                  ref={cancelButtonRef}
                  type="button"
                  className="btn-secondary"
                  disabled={confirmState.isProcessing}
                  onClick={() => handleConfirmClose(false)}
                >
                  {confirmState.cancelText}
                </button>
                <button
                  type="button"
                  className={confirmState.variant === 'danger' ? 'btn-danger' : 'btn-primary'}
                  disabled={confirmState.isProcessing}
                  onClick={() => {
                    setConfirmState((prev) => prev ? { ...prev, isProcessing: true } : null);
                    handleConfirmClose(true);
                  }}
                >
                  {confirmState.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

export function useToast() {
  const { showToast } = useFeedback();
  return showToast;
}

export function useConfirm() {
  const { confirm } = useFeedback();
  return confirm;
}
