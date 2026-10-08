import React, { useState } from 'react';
import { ShieldAlert, Fingerprint, Lock, X } from 'lucide-react';
import { User } from '../types';

interface SudoModeModalProps {
  actionDescription: string;
  currentUser: User;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SudoModeModal: React.FC<SudoModeModalProps> = ({
  actionDescription,
  currentUser,
  onConfirm,
  onCancel
}) => {
  const [sudoInput, setSudoInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleConfirm = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onConfirm();
    }, 600);
  };

  return (
    <div className="modal-overlay">
      <div 
        className="modal-content" 
        style={{ maxWidth: '480px', padding: '1.75rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
            <ShieldAlert size={24} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              Sudo Mode Re-Authentication
            </h3>
          </div>
          <button id="btn-cancel-sudo-x" className="btn-icon" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          As required by zero-trust security guidelines, dangerous actions require immediate re-verification of administrative identity.
        </p>

        <div style={{
          background: 'var(--bg-card)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem',
          marginBottom: '1.25rem'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>Action: </span>
          <strong style={{ color: 'var(--text-primary)' }}>{actionDescription}</strong>
        </div>

        {currentUser.hasPasskey ? (
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <button 
              id="btn-confirm-sudo-passkey"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
              onClick={handleConfirm}
              disabled={isVerifying}
            >
              <Fingerprint size={18} />
              {isVerifying ? 'Verifying Hardware Token...' : 'Confirm with Passkey / Biometrics'}
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Enter Administrator Security Key:
            </label>
            <input 
              id="input-sudo-password"
              type="password"
              className="input"
              placeholder="••••••••••••"
              value={sudoInput}
              onChange={(e) => setSudoInput(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem' }}
            />
            <button 
              id="btn-confirm-sudo-password"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem' }}
              onClick={handleConfirm}
              disabled={isVerifying}
            >
              <Lock size={15} />
              {isVerifying ? 'Verifying...' : 'Authorize Action'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            id="btn-cancel-sudo"
            className="btn btn-secondary" 
            style={{ fontSize: '0.8rem' }}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
