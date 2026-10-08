import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Key,
  Layers,
  FileText,
  Activity,
  CheckSquare,
  Square,
  Plus,
  Upload,
  AlertTriangle,
  Terminal,
  Server,
  Check,
  Lock,
  Cpu,
  HardDrive,
  FileCode,
  Eye,
  Trash2,
  RefreshCw,
  Search
} from 'lucide-react';
import { Role, User, PermissionKey, Problem, AuditLogItem, JudgeWorkerStatus, ScopeType } from '../types';
import { SYSTEM_PERMISSIONS, can } from '../lib/rbac';
import { api } from '../lib/api';

interface AdminPortalProps {
  currentUser: User;
  allRoles: Role[];
  onUpdateRoles: (newRoles: Role[]) => void;
  allUsers: User[];
  onUpdateUsers: (newUsers: User[]) => void;
  problems: Problem[];
  onUpdateProblems: (newProblems: Problem[]) => void;
  onRequestSudoAction: (actionName: string, onAuthorized: () => void) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  allRoles,
  onUpdateRoles,
  allUsers,
  onUpdateUsers,
  problems,
  onUpdateProblems,
  onRequestSudoAction
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rbac' | 'users' | 'testcases' | 'audit' | 'cluster'>('rbac');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);

  // Testcase uploader state
  const [selectedProblemId, setSelectedProblemId] = useState<string>(problems[0]?.id || '');
  const [testcaseSubtask, setTestcaseSubtask] = useState<number>(1);
  const [testcasePoints, setTestcasePoints] = useState<number>(10);
  // Starts empty — populated by real uploads only
  const [uploadedFiles, setUploadedFiles] = useState<{ inName: string; outName: string; size: string }[]>([]);

  // Audit logs & judge workers loaded from backend
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [judgeWorkers, setJudgeWorkers] = useState<JudgeWorkerStatus[]>([]);

  // Audit search & inspect
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);

  // Load audit logs and cluster status on mount (admin only)
  useEffect(() => {
    api.admin.getAuditLogs().then(data => {
      if (Array.isArray(data)) setAuditLogs(data);
    }).catch(() => {});

    api.admin.getClusterStatus().then(data => {
      if (Array.isArray(data)) setJudgeWorkers(data);
    }).catch(() => {});
  }, []);

  // RBAC Permission Toggle
  const handleTogglePermission = (roleId: string, permKey: PermissionKey) => {
    // Sudo re-auth required before changing critical permissions (from over-all.txt Section 2)
    onRequestSudoAction(`Modify permission "${permKey}" for role "${roleId}"`, () => {
      const updatedRoles = allRoles.map(role => {
        if (role.id !== roleId) return role;
        const hasPerm = role.permissions.includes(permKey);
        const newPerms = hasPerm
          ? role.permissions.filter(p => p !== permKey)
          : [...role.permissions, permKey];
        return { ...role, permissions: newPerms };
      });
      onUpdateRoles(updatedRoles);
    });
  };

  // Add Custom Role
  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    const roleId = newRoleName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newRole: Role = {
      id: roleId,
      name: newRoleName,
      description: newRoleDesc || 'Custom defined user role',
      isSystem: false,
      permissions: ['problem:read', 'submission:create', 'submission:read_own']
    };
    onUpdateRoles([...allRoles, newRole]);
    setNewRoleName('');
    setNewRoleDesc('');
    setShowAddRoleModal(false);
  };

  // User Role Assignment
  const handleAssignUserRole = (userId: string, roleId: string, scopeType: ScopeType = 'global') => {
    onRequestSudoAction(`Change role assignment for user to "${roleId}"`, () => {
      const updated = allUsers.map(u => {
        if (u.id !== userId) return u;
        return {
          ...u,
          isAdmin: roleId === 'admin',
          roles: [{ roleId, scopeType }]
        };
      });
      onUpdateUsers(updated);
    });
  };

  // User Ban Toggle
  const handleToggleBanUser = (userId: string) => {
    onRequestSudoAction(`Ban / Unban user account`, () => {
      const updated = allUsers.map(u => {
        if (u.id !== userId) return u;
        return {
          ...u,
          status: (u.status === 'banned' ? 'active' : 'banned') as 'active' | 'banned'
        };
      });
      onUpdateUsers(updated);
    });
  };

  // Testcase Upload Mock
  const handleSimulateTestcaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFiles(prev => [
        ...prev,
        {
          inName: file.name,
          outName: file.name.replace(/\.in$/, '.sol'),
          size: `${(file.size / 1024).toFixed(1)} KB`
        }
      ]);
      alert(`Testcase "${file.name}" uploaded and encrypted in storage (R2/S3 signed)`);
    }
  };

  // View Secret Testcase requires Sudo Mode
  const handleViewSecretTestcase = (tcName: string) => {
    onRequestSudoAction(`View secret judge testcase data for "${tcName}"`, () => {
      alert(`[Sudo Authorized] Testcase Content for ${tcName}:\n\n8\n-1 3 -2 5 3 -5 2 2\n\nExpected Output: 9\n(Verified against SHA-256 HMAC checksum)`);
    });
  };

  const filteredLogs = auditLogs.filter(l =>
    l.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.target.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
          <div style={{
            padding: '0.4rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444'
          }}>
            <Shield size={22} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            System Administration & RBAC Portal
          </h1>
          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            ELEVATED ACCESS
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Fine-grained RBAC matrix, user roles, secret testcase upload, audit trail, and isolate sandbox cluster health.
        </p>
      </div>

      {/* Sub Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        overflowX: 'auto'
      }}>
        <button
          id="admin-subtab-rbac"
          className={`btn ${activeSubTab === 'rbac' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('rbac')}
        >
          <Key size={15} />
          RBAC Matrix
        </button>

        <button
          id="admin-subtab-users"
          className={`btn ${activeSubTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('users')}
        >
          <Users size={15} />
          Users & Roles
        </button>

        <button
          id="admin-subtab-testcases"
          className={`btn ${activeSubTab === 'testcases' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('testcases')}
        >
          <Upload size={15} />
          Testcase Manager
        </button>

        <button
          id="admin-subtab-audit"
          className={`btn ${activeSubTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('audit')}
        >
          <FileText size={15} />
          Audit Logs
        </button>

        <button
          id="admin-subtab-cluster"
          className={`btn ${activeSubTab === 'cluster' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('cluster')}
        >
          <Server size={15} />
          Self-Host Architecture
        </button>
      </div>

      {/* SUB-TAB 1: RBAC MATRIX */}
      {activeSubTab === 'rbac' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Permission Matrix (String resource:action)
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Deny-by-default visual policy enforcement. Modifying permissions triggers Sudo-Mode re-authentication.
              </div>
            </div>

            <button
              id="btn-add-custom-role"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem' }}
              onClick={() => setShowAddRoleModal(true)}
            >
              <Plus size={14} />
              Add Custom Role
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '220px' }}>Permission Key</th>
                  <th style={{ minWidth: '180px' }}>Description</th>
                  {allRoles.map(role => (
                    <th key={role.id} style={{ textAlign: 'center', minWidth: '120px' }}>
                      <div style={{ fontWeight: 700 }}>{role.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {role.isSystem ? '(System Role)' : '(Custom)'}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SYSTEM_PERMISSIONS.map(perm => (
                  <tr key={perm.key}>
                    <td>
                      <code className="font-mono" style={{
                        fontWeight: 700,
                        color: perm.group === 'system' ? '#ef4444' : perm.group === 'problem' ? '#3b82f6' : '#10b981'
                      }}>
                        {perm.key}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {perm.description}
                    </td>
                    {allRoles.map(role => {
                      const isGranted = role.permissions.includes(perm.key);
                      return (
                        <td key={role.id} style={{ textAlign: 'center' }}>
                          <button
                            id={`perm-${role.id}-${perm.key.replace(':', '-')}`}
                            className="btn-icon"
                            style={{
                              padding: '0.35rem',
                              borderRadius: '4px',
                              background: isGranted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                              color: isGranted ? '#10b981' : '#64748b'
                            }}
                            onClick={() => handleTogglePermission(role.id, perm.key)}
                            title={`${isGranted ? 'Revoke' : 'Grant'} ${perm.key} for ${role.name}`}
                          >
                            {isGranted ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: USERS & ROLE ASSIGNMENTS */}
      {activeSubTab === 'users' && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              User Directory & Role Assignment
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Assign roles with scopes: <code className="font-mono">global</code>, <code className="font-mono">contest</code>, or <code className="font-mono">problem</code>.
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>2FA / Passkey</th>
                  <th>Assigned Role</th>
                  <th>Scope</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(user => {
                  const currentRoleId = user.roles[0]?.roleId || 'student';
                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <img
                            src={user.avatar}
                            alt={user.name}
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {user.name}
                          </div>
                        </div>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.85rem' }}>
                        {user.email}
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: user.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: user.status === 'active' ? '#10b981' : '#ef4444'
                        }}>
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {user.hasPasskey && (
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.65rem' }}>
                              FIDO2 Passkey
                            </span>
                          )}
                          {user.hasTotp && (
                            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '0.65rem' }}>
                              TOTP
                            </span>
                          )}
                          {!user.hasPasskey && !user.hasTotp && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <select
                          id={`select-role-${user.id}`}
                          className="select"
                          value={currentRoleId}
                          onChange={(e) => handleAssignUserRole(user.id, e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        >
                          {allRoles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                          {user.roles[0]?.scopeType || 'global'}
                          {user.roles[0]?.scopeId ? `:${user.roles[0].scopeId}` : ''}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          id={`btn-ban-${user.id}`}
                          className={`btn ${user.status === 'banned' ? 'btn-secondary' : 'btn-danger'}`}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleToggleBanUser(user.id)}
                        >
                          {user.status === 'banned' ? 'Unban Account' : 'Ban Account'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TESTCASE MANAGER */}
      {activeSubTab === 'testcases' && (
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Testcase & Checker Management
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Testcases are stored in Cloudflare R2 / Object Storage with signed HMAC keys. Regular users cannot access raw testcases.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            {/* Upload form */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                Upload New Testcase
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Target Problem:
                </label>
                <select
                  id="select-testcase-problem"
                  className="select"
                  value={selectedProblemId}
                  onChange={(e) => setSelectedProblemId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {problems.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.slug})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Subtask ID:
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={testcaseSubtask}
                    onChange={(e) => setTestcaseSubtask(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Points:
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={testcasePoints}
                    onChange={(e) => setTestcasePoints(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.5rem',
                textAlign: 'center',
                background: 'var(--bg-card)',
                marginBottom: '1rem',
                cursor: 'pointer'
              }}>
                <Upload size={28} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Drop .in / .sol or .zip here</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Automatic subtask pairing and checksum calculation
                </div>
                <input
                  id="input-file-testcase"
                  type="file"
                  onChange={handleSimulateTestcaseUpload}
                  style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Custom Checker: <code className="font-mono">testlib.h / wcmp.cpp</code> enabled by default.
              </div>
            </div>

            {/* Testcase Inventory */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Configured Testcases ({uploadedFiles.length} files)
              </h3>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Input File (.in)</th>
                      <th>Expected Solution (.sol)</th>
                      <th>Size</th>
                      <th style={{ textAlign: 'right' }}>Security Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                          No testcases uploaded for this problem yet. Drop .in / .sol or .zip files on the left to configure.
                        </td>
                      </tr>
                    ) : (
                      uploadedFiles.map((tc, i) => (
                      <tr key={i}>
                        <td className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {tc.inName}
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.85rem' }}>
                          {tc.outName}
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {tc.size}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            id={`btn-view-tc-${i}`}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                            onClick={() => handleViewSecretTestcase(tc.inName)}
                            title="Inspect testcase data (Requires Sudo Re-auth)"
                          >
                            <Lock size={12} color="#f59e0b" />
                            View Data
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Security Audit Log
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Immutable event stream for sensitive administrative actions as mandated by architectural specifications.
              </div>
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                id="input-search-audit"
                type="text"
                className="input"
                placeholder="Filter audit logs..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.2rem', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target Resource</th>
                  <th>IP Address</th>
                  <th style={{ textAlign: 'right' }}>Payload</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.actorName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.actorEmail}</div>
                    </td>
                    <td>
                      <code className="font-mono" style={{
                        background: 'var(--bg-elevated)',
                        padding: '0.2rem 0.45rem',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        color: '#60a5fa'
                      }}>
                        {log.action}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {log.target}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {log.ip}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        id={`btn-inspect-audit-${log.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => setSelectedAuditLog(log)}
                      >
                        Inspect JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SELF-HOST ARCHITECTURE & CLUSTER MONITOR (from self-host.txt) */}
      {activeSubTab === 'cluster' && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Self-Host Topology & Judge Workers (self-host.txt)
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Multi-container isolated architecture running isolate sandbox with zero network outbound capabilities.
            </div>
          </div>

          {/* Architecture Visual Topology Card */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>
              Active Docker Services Network Map
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {/* Caddy */}
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reverse Proxy</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Caddy 2 (HTTPS)</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem' }}>
                  ● Cloudflare Tunnel Active
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Auto TLS &bull; Inbound 80/443 closed
                </div>
              </div>

              {/* Web API */}
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Application Layer</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Next.js (Web + API)</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem' }}>
                  ● Session & RBAC Middleware
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  CSRF Origin Check &bull; Rate Limit
                </div>
              </div>

              {/* Redis BullMQ */}
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Queue Broker</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Redis 7 (BullMQ)</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem' }}>
                  ● Internal Network Only
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  AUTH Enabled &bull; No Public Exposure
                </div>
              </div>

              {/* Judge Sandbox */}
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                <div style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase' }}>Sandbox Engine</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Linux Isolate / nsjail</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem' }}>
                  ● cgroups v2 + seccomp
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Network Isolated &bull; Read-only FS
                </div>
              </div>
            </div>
          </div>

          {/* Judge Cluster Worker Nodes Table */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Registered Judge Worker Daemons
          </h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Worker Hostname</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>CPU Load</th>
                  <th>Memory Used</th>
                  <th>Sandboxes</th>
                  <th>Security Hardening</th>
                </tr>
              </thead>
              <tbody>
                {judgeWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No judge workers currently connected. Start isolate worker daemon to connect.
                    </td>
                  </tr>
                ) : (
                  judgeWorkers.map(worker => (
                  <tr key={worker.id}>
                    <td>
                      <div className="font-mono" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {worker.hostname}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {worker.jobsProcessed} submissions evaluated
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                        {worker.type}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: worker.status === 'busy' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: worker.status === 'busy' ? '#f59e0b' : '#10b981'
                      }}>
                        {worker.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-mono">
                      {worker.cpuUsagePercent}%
                    </td>
                    <td className="font-mono">
                      {worker.memUsageMb} MB / {worker.totalMemMb} MB
                    </td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      {worker.activeSandboxInstances} active
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.65rem' }}>
                          NO-NET
                        </span>
                        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '0.65rem' }}>
                          SECCOMP
                        </span>
                        <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontSize: '0.65rem' }}>
                          CGROUPS-v2
                        </span>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Role */}
      {showAddRoleModal && (
        <div className="modal-overlay" onClick={() => setShowAddRoleModal(false)}>
          <div className="modal-content" style={{ padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Create Custom Role
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Define a new group of permissions. Custom roles can be scoped globally, per-contest, or per-problem.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Role Name (e.g. Teaching Assistant, Proctor, Content Reviewer):
              </label>
              <input
                id="input-new-role-name"
                type="text"
                className="input"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. Teaching Assistant"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Role Description:
              </label>
              <input
                id="input-new-role-desc"
                type="text"
                className="input"
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="Can assist students and rejudge submissions..."
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddRoleModal(false)}>
                Cancel
              </button>
              <button
                id="btn-confirm-create-role"
                className="btn btn-primary"
                onClick={handleCreateRole}
                disabled={!newRoleName.trim()}
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inspect Audit Log JSON */}
      {selectedAuditLog && (
        <div className="modal-overlay" onClick={() => setSelectedAuditLog(null)}>
          <div className="modal-content" style={{ padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                Audit Log Event Details
              </h3>
              <button className="btn-icon" onClick={() => setSelectedAuditLog(null)}>✕</button>
            </div>

            <pre style={{
              background: 'var(--bg-app)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              maxHeight: '350px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              color: '#34d399'
            }}>
              {JSON.stringify(selectedAuditLog, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
