import React, { useState } from 'react';
import { 
  FileText, 
  RotateCcw, 
  Eye, 
  Search, 
  Clock, 
  Cpu, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Code2,
  Lock,
  X
} from 'lucide-react';
import { Submission, User, Role, Verdict } from '../types';
import { can } from '../lib/rbac';

interface SubmissionsListProps {
  submissions: Submission[];
  currentUser: User;
  allRoles: Role[];
  onRejudge: (submissionId: string) => void;
}

export const SubmissionsList: React.FC<SubmissionsListProps> = ({
  submissions,
  currentUser,
  allRoles,
  onRejudge
}) => {
  const [filterVerdict, setFilterVerdict] = useState<string>('all');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [searchUser, setSearchUser] = useState<string>('');
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  const canRejudge = can(currentUser, 'submission:rejudge', undefined, allRoles);
  const canReadAll = can(currentUser, 'submission:read_all', undefined, allRoles);

  // Filter submissions
  const filteredSubmissions = submissions.filter(s => {
    // RBAC: If user cannot read_all, only show their own submissions!
    if (!canReadAll && s.userId !== currentUser.id) {
      return false;
    }

    const matchesVerdict = filterVerdict === 'all' || s.verdict === filterVerdict;
    const matchesLang = filterLang === 'all' || s.lang === filterLang;
    const matchesUser = searchUser === '' || s.userName.toLowerCase().includes(searchUser.toLowerCase()) || s.problemTitle.toLowerCase().includes(searchUser.toLowerCase());
    return matchesVerdict && matchesLang && matchesUser;
  });

  const getVerdictBadge = (verdict: Verdict) => {
    return (
      <span className={`verdict-badge verdict-${verdict}`}>
        {verdict === 'AC' && <CheckCircle2 size={13} />}
        {verdict === 'WA' && <XCircle size={13} />}
        {(verdict === 'TLE' || verdict === 'MLE') && <Clock size={13} />}
        {verdict === 'CE' && <AlertTriangle size={13} />}
        {verdict}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <FileText size={22} color="var(--primary)" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Grader Submissions
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Real-time execution log from the Linux <code className="font-mono" style={{ color: '#10b981' }}>isolate</code> judge worker pool.
          {!canReadAll && (
            <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>
              (RBAC active: Filtered to your own submissions only)
            </span>
          )}
        </p>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.75rem',
        background: 'var(--bg-surface)',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            id="filter-submissions-query"
            type="text" 
            className="input"
            placeholder="Search by problem or student handle..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Verdict filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verdict:</span>
          <select 
            id="filter-submissions-verdict"
            className="select"
            value={filterVerdict}
            onChange={(e) => setFilterVerdict(e.target.value)}
          >
            <option value="all">All Verdicts</option>
            <option value="AC">AC (Accepted)</option>
            <option value="WA">WA (Wrong Answer)</option>
            <option value="TLE">TLE (Time Limit Exceeded)</option>
            <option value="MLE">MLE (Memory Limit Exceeded)</option>
            <option value="CE">CE (Compile Error)</option>
            <option value="RE">RE (Runtime Error)</option>
          </select>
        </div>

        {/* Language filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Language:</span>
          <select 
            id="filter-submissions-lang"
            className="select"
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
          >
            <option value="all">All Languages</option>
            <option value="cpp17">C++17</option>
            <option value="cpp20">C++20</option>
            <option value="python3">Python 3</option>
            <option value="java17">Java 17</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th>Problem</th>
              <th>Submitted By</th>
              <th style={{ width: '120px' }}>Verdict</th>
              <th style={{ width: '90px' }}>Score</th>
              <th style={{ width: '90px' }}>Time</th>
              <th style={{ width: '90px' }}>Memory</th>
              <th style={{ width: '90px' }}>Language</th>
              <th style={{ width: '130px' }}>Submitted</th>
              <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No submissions found matching the criteria.
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {sub.id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {sub.problemTitle}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {sub.problemSlug}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{sub.userName}</div>
                    {sub.userId === currentUser.id && (
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '0.65rem' }}>
                        You
                      </span>
                    )}
                  </td>
                  <td>
                    {getVerdictBadge(sub.verdict)}
                  </td>
                  <td>
                    <span className="font-mono" style={{ 
                      fontWeight: 700, 
                      color: sub.score === 100 ? '#10b981' : sub.score > 0 ? '#f59e0b' : '#ef4444' 
                    }}>
                      {sub.score}/{sub.maxScore}
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                    {sub.timeMs} ms
                  </td>
                  <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                    {(sub.memKb / 1024).toFixed(1)} MB
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                      {sub.lang}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <button 
                        id={`btn-view-${sub.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => setSelectedSub(sub)}
                        title="Inspect Code & Subtask Results"
                      >
                        <Eye size={13} />
                        View
                      </button>

                      {/* Rejudge button - protected by RBAC */}
                      {canRejudge && (
                        <button 
                          id={`btn-rejudge-${sub.id}`}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#f59e0b' }}
                          onClick={() => onRejudge(sub.id)}
                          title="Rejudge in Isolate Sandbox"
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Submission Detail Modal */}
      {selectedSub && (
        <div className="modal-overlay" onClick={() => setSelectedSub(null)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '800px', padding: '1.75rem' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Code2 size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    Submission {selectedSub.id}
                  </h3>
                  {getVerdictBadge(selectedSub.verdict)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Problem: {selectedSub.problemTitle} &bull; Author: {selectedSub.userName}
                </div>
              </div>

              <button 
                id="btn-close-sub-detail"
                className="btn-icon" 
                onClick={() => setSelectedSub(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Stats Row */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '0.75rem', 
              background: 'var(--bg-card)', 
              padding: '0.85rem 1rem', 
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score</div>
                <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: selectedSub.score === 100 ? '#10b981' : '#f59e0b' }}>
                  {selectedSub.score} / {selectedSub.maxScore}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CPU Time</div>
                <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {selectedSub.timeMs} ms
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RSS Memory</div>
                <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {(selectedSub.memKb / 1024).toFixed(1)} MB
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Language</div>
                <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {selectedSub.lang}
                </div>
              </div>
            </div>

            {/* Testcase Breakdown */}
            {selectedSub.testcaseResults && selectedSub.testcaseResults.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Per-Testcase Linux Isolate Verdicts:
                </h4>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Subtask</th>
                        <th>Case #</th>
                        <th>Verdict</th>
                        <th>Time</th>
                        <th>Memory</th>
                        <th>Points</th>
                        <th>Sandbox Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSub.testcaseResults.map((tc) => (
                        <tr key={tc.testcaseId}>
                          <td className="font-mono">Subtask {tc.subtask}</td>
                          <td className="font-mono">#{tc.testcaseId}</td>
                          <td>{getVerdictBadge(tc.verdict)}</td>
                          <td className="font-mono">{tc.timeMs} ms</td>
                          <td className="font-mono">{(tc.memKb / 1024).toFixed(1)} MB</td>
                          <td className="font-mono" style={{ fontWeight: 600 }}>{tc.points}/{tc.maxPoints}</td>
                          <td style={{ fontSize: '0.75rem', color: tc.verdict === 'AC' ? '#10b981' : '#f87171' }}>
                            {tc.message || 'Exited with returncode 0. Output matched.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Source Code */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Submitted Source Code:
                </h4>
                <button 
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={() => navigator.clipboard.writeText(selectedSub.code)}
                >
                  Copy Code
                </button>
              </div>
              <pre style={{
                background: 'var(--bg-app)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                maxHeight: '300px',
                overflowY: 'auto',
                fontFamily: 'var(--font-mono)'
              }}>
                <code>{selectedSub.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
