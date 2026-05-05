import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);
  const timerRef = useRef(null);

  const closeNotification = useCallback(() => {
    const acaoAoFechar = notification?.onClose;

    setNotification(null);

    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }

    if (acaoAoFechar) {
        setTimeout(() => {
        acaoAoFechar();
        }, 0);
    }
  }, [notification]);

  const showNotification = useCallback(({
    type = 'info',
    title,
    message,
    autoClose = true,
    duration = 3000,
    onClose = null
    }) => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }

    setNotification({
        type,
        title,
        message,
        onClose
    });

    if (autoClose) {
        timerRef.current = setTimeout(() => {
        closeNotification();
        }, duration);
    }
  }, [closeNotification]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, closeNotification }}>
      {children}

      {notification && (
        <div className="notification-overlay">
          <div className={`notification-modal notification-${notification.type}`}>
            <div className="notification-indicator" />

            <div className="notification-content">
              {notification.title && <h3>{notification.title}</h3>}
              {notification.message && <p>{notification.message}</p>}
            </div>

            <button
              type="button"
              className="botao-primario"
              onClick={closeNotification}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification deve ser usado dentro de NotificationProvider');
  }

  return context;
}