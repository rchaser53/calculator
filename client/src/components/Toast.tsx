import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { ToastData } from '../types';

interface ToastProps {
  message: string;
  type: ToastData['type'];
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const variant = type === 'success' ? 'success' : 'danger';
  const icon = type === 'success' ? '✅' : '❌';

  return (
    <div className="toast-container">
      <Alert variant={variant} onClose={onClose} dismissible>
        <strong>{icon}</strong> {message}
      </Alert>
    </div>
  );
};

export default Toast;