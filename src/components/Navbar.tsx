import React from 'react';
import { 
  Shield, 
  Code2, 
  Trophy, 
  FileText, 
  Lock, 
  Sun, 
  Moon, 
  Terminal, 
  UserCheck, 
  Fingerprint,
  ChevronDown
} from 'lucide-react';
import { User, Role } from '../types';
import { can } from '../lib/rbac';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onSwitchUser: (userId: string) => void;
  allUsers: User[];
  allRoles: Role[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSecurityModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchUser,
  allUsers,
  allRoles,
  theme,
  onToggleTheme,
  onOpenSecurityModal
}) => {
  const canAccessAdmin = can(currentUser, 'user:read', undefined, allRoles) || currentUser.isAdmin;

  // Find primary role name for the badge
  const primaryRole = allRoles.find(r => r.id === currentUser.roles[0]?.roleId);
  const roleName = currentUser.isAdmin ? 'Admin' : primaryRole ? primaryRole.name.split(' ')[0] : 'User';

  const getRoleBadgeClass = () => {
    if (currentUser.isAdmin) return 'role-admin';
    if (currentUser.roles.some(r => r.roleId === 'teacher')) return 'role-teacher';
    if (currentUser.roles.some(r => r.roleId === 'contest_manager')) return 'role-contest_manager';
    return 'role-student';
  };

  return (
    <header className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid var(--border-color)',
      padding: '0.65rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div 
          onClick={() => setActiveTab('problems')}
          id="nav-brand-logo"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #10b981)',
            padding: '0.45rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)'
          }}>
            <Shield size={22} color="#ffffff" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ 
                fontWeight: 800, 
                fontSize: '1.15rem', 
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #60a5fa, #34d399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                GUARDING
              </span>
              <span className="badge" style={{ 
                background: 'rgba(16, 185, 129, 0.15)', 
                color: '#34d399', 
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.65rem'
              }}>
                ISOLATE v2
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Zero-Trust Grader Sandbox
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button 
            id="nav-tab-problems"
            className={`btn ${activeTab === 'problems' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}
            onClick={() => setActiveTab('problems')}
          >
            <Code2 size={16} />
            Problems
          </button>

          <button 
            id="nav-tab-contests"
            className={`btn ${activeTab === 'contests' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem', position: 'relative' }}
            onClick={() => setActiveTab('contests')}
          >
            <Trophy size={16} />
            Contests
            <span style={{
              width: 8,
              height: 8,
              background: '#ef4444',
              borderRadius: '50%',
              boxShadow: '0 0 8px #ef4444'
            }} />
          </button>

          <button 
            id="nav-tab-submissions"
            className={`btn ${activeTab === 'submissions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}
            onClick={() => setActiveTab('submissions')}
          >
            <FileText size={16} />
            Submissions
          </button>

          <button 
            id="nav-tab-scoreboard"
            className={`btn ${activeTab === 'scoreboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}
            onClick={() => setActiveTab('scoreboard')}
          >
            <Terminal size={16} />
            Scoreboard
          </button>

          {/* Admin Tab - Enforced by RBAC */}
          {canAccessAdmin && (
            <button 
              id="nav-tab-admin"
              className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '0.4rem 0.85rem', 
                fontSize: '0.825rem',
                border: activeTab === 'admin' ? 'none' : '1px solid rgba(239, 68, 68, 0.4)',
                background: activeTab === 'admin' ? '#dc2626' : 'rgba(239, 68, 68, 0.1)',
                color: activeTab === 'admin' ? '#ffffff' : '#f87171'
              }}
              onClick={() => setActiveTab('admin')}
            >
              <Lock size={15} />
              Admin Portal
            </button>
          )}
        </nav>
      </div>

      {/* Right Controls: Role Switcher, Security Modal, Theme, User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Interactive RBAC Switcher for pair-programming testing */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          background: 'var(--bg-card)',
          padding: '0.3rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          fontSize: '0.75rem'
        }}>
          <UserCheck size={14} color="var(--primary)" />
          <span style={{ color: 'var(--text-muted)' }}>Role Switcher:</span>
          <select 
            id="rbac-role-switcher"
            value={currentUser.id}
            onChange={(e) => onSwitchUser(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {allUsers.map(u => (
              <option key={u.id} value={u.id} style={{ background: 'var(--bg-surface)' }}>
                {u.name}
              </option>
            ))}
          </select>
          <span className={`role-badge ${getRoleBadgeClass()}`}>
            {roleName}
          </span>
        </div>

        {/* Security & Sessions Trigger */}
        <button
          id="btn-security-sessions"
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', gap: '0.35rem' }}
          onClick={onOpenSecurityModal}
          title="Security, WebAuthn Passkey, 2FA & Active Sessions"
        >
          <Fingerprint size={15} color="#10b981" />
          <span>Security & Sessions</span>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: currentUser.hasPasskey ? '#10b981' : '#f59e0b'
          }} />
        </button>

        {/* Theme Toggle */}
        <button 
          id="btn-theme-toggle"
          className="btn-icon" 
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Current User Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          paddingLeft: '0.5rem',
          borderLeft: '1px solid var(--border-color)'
        }}>
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--border-color)'
            }}
          />
        </div>
      </div>
    </header>
  );
};
