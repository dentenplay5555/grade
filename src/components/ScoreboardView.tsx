import React, { useState, useEffect } from 'react';
import { Trophy, Star, Search, Snowflake, RefreshCw, Flame, Check, Clock } from 'lucide-react';
import { ScoreboardRow, Contest, User, Role } from '../types';
import { can } from '../lib/rbac';

interface ScoreboardViewProps {
  contest?: Contest | null;
  scoreboard: ScoreboardRow[];
  currentUser: User;
  allRoles: Role[];
}

export const ScoreboardView: React.FC<ScoreboardViewProps> = ({
  contest,
  scoreboard,
  currentUser,
  allRoles
}) => {
  const [searchHandle, setSearchHandle] = useState('');
  const [isFrozen, setIsFrozen] = useState(contest?.isFrozen || false);
  const [countdown, setCountdown] = useState('--:--:--');

  // Compute live remaining time from contest.endTime
  useEffect(() => {
    if (!contest?.endTime) return;
    const update = () => {
      const remaining = new Date(contest.endTime).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown('00:00:00');
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [contest?.endTime]);

  const canManageContest = can(currentUser, 'contest:manage', undefined, allRoles);

  if (!contest) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <Trophy size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Active Contest Scoreboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          There is currently no live contest selected. Visit the Contests tab to browse or participate.
        </p>
      </div>
    );
  }

  const filteredRows = scoreboard.filter(row => 
    row.userName.toLowerCase().includes(searchHandle.toLowerCase())
  );

  const problemsList = contest.problems || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Contest Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(16, 185, 129, 0.1))',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge" style={{ background: '#ef4444', color: '#ffffff' }}>
              LIVE CONTEST
            </span>
            {isFrozen && (
              <span className="badge" style={{ background: '#0284c7', color: '#ffffff' }}>
                <Snowflake size={12} /> SCOREBOARD FROZEN
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {contest.title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {contest.description}
          </p>
        </div>

        {/* Live Timer & Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contest Remaining</div>
            <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
              {countdown}
            </div>
          </div>

          {canManageContest && (
            <button 
              id="btn-toggle-freeze"
              className={`btn ${isFrozen ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
              onClick={() => setIsFrozen(!isFrozen)}
            >
              <Snowflake size={15} />
              {isFrozen ? 'Unfreeze Scoreboard' : 'Freeze Scoreboard (1h remaining)'}
            </button>
          )}
        </div>
      </div>

      {/* Scoreboard Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            id="filter-scoreboard-search"
            type="text" 
            className="input"
            placeholder="Search participant or school..."
            value={searchHandle}
            onChange={(e) => setSearchHandle(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.25rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 10, height: 10, background: '#10b981', borderRadius: 2 }} /> Solved
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Star size={11} color="#f59e0b" fill="#f59e0b" /> First to Solve
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: 2 }} /> Attempted
          </span>
        </div>
      </div>

      {/* Scoreboard Matrix Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
              <th>Competitor / Team</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Solved</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Score</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Penalty</th>
              {problemsList.map(p => (
                <th key={p.problemId} style={{ textAlign: 'center', minWidth: '80px' }}>
                  Problem {p.label}
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>100 pts</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5 + (problemsList.length || 0)} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                  No participant entries recorded on this scoreboard yet.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.userId} style={{
                  background: row.userId === currentUser.id ? 'rgba(59, 130, 246, 0.08)' : undefined
                }}>
                <td style={{ textAlign: 'center' }}>
                  <span className="font-mono" style={{ 
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: row.rank === 1 ? '#eab308' : row.rank === 2 ? '#94a3b8' : row.rank === 3 ? '#d97706' : 'inherit'
                  }}>
                    #{row.rank}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <img 
                      src={row.userAvatar} 
                      alt={row.userName} 
                      style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {row.userName}
                      </div>
                      {row.userId === currentUser.id && (
                        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontSize: '0.65rem' }}>
                          Current User
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                    {row.solvedCount}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {row.totalPoints}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {row.totalPenaltyMin}m
                  </span>
                </td>

                {/* Problem by Problem Cells */}
                {problemsList.map(p => {
                  const stat = row.problemStatus[p.label];
                  if (!stat) {
                    return (
                      <td key={p.label} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        -
                      </td>
                    );
                  }

                  if (stat.solved) {
                    return (
                      <td key={p.label} style={{ 
                        textAlign: 'center',
                        background: stat.isFirstSolve ? 'rgba(234, 179, 8, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        borderLeft: '1px solid var(--border-subtle)',
                        borderRight: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                          <span className="font-mono" style={{ 
                            fontWeight: 700, 
                            color: stat.isFirstSolve ? '#eab308' : '#10b981' 
                          }}>
                            +{stat.attempts}
                          </span>
                          {stat.isFirstSolve && <Star size={12} color="#eab308" fill="#eab308" title="First to Solve Problem!" />}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {stat.solveTimeMin}m
                        </div>
                      </td>
                    );
                  } else if (stat.attempts > 0) {
                    return (
                      <td key={p.label} style={{ 
                        textAlign: 'center', 
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderLeft: '1px solid var(--border-subtle)',
                        borderRight: '1px solid var(--border-subtle)'
                      }}>
                        <span className="font-mono" style={{ color: '#ef4444', fontWeight: 600 }}>
                          -{stat.attempts}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {stat.score} pts
                        </div>
                      </td>
                    );
                  } else {
                    return (
                      <td key={p.label} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        -
                      </td>
                    );
                  }
                })}
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
