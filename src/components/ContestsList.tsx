import React from 'react';
import { Trophy, Calendar, Clock, Users, ArrowRight, ShieldCheck, Plus, CheckCircle } from 'lucide-react';
import { Contest, User, Role } from '../types';
import { can } from '../lib/rbac';

interface ContestsListProps {
  contests: Contest[];
  currentUser: User;
  allRoles: Role[];
  onOpenScoreboard: () => void;
  onOpenProblems: () => void;
}

export const ContestsList: React.FC<ContestsListProps> = ({
  contests,
  currentUser,
  allRoles,
  onOpenScoreboard,
  onOpenProblems
}) => {
  const canManage = can(currentUser, 'contest:manage', undefined, allRoles);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Trophy size={22} color="var(--primary)" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Competitions & Contests
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Time-constrained competitive programming rounds with real-time isolate sandbox grading and live scoreboards.
          </p>
        </div>

        {canManage && (
          <button 
            id="btn-create-contest"
            className="btn btn-primary"
            onClick={() => alert('Contest creation wizard (contest:manage permission active)')}
          >
            <Plus size={16} />
            Create Contest
          </button>
        )}
      </div>

      {/* Contests Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {contests.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)'
          }}>
            <Trophy size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              No Contests Scheduled
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              There are currently no active or upcoming competitions. When contests are created, they will be listed here.
            </p>
          </div>
        ) : (
          contests.map((c) => {
          const isLive = c.status === 'running';

          return (
            <div 
              key={c.id} 
              style={{
                background: 'var(--bg-surface)',
                border: isLive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: isLive ? '0 0 20px rgba(16, 185, 129, 0.1)' : 'var(--shadow-sm)',
                position: 'relative'
              }}
            >
              {/* Status Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className="badge" style={{
                  background: isLive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: isLive ? '#ef4444' : '#60a5fa',
                  border: isLive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  {isLive ? '● LIVE CONTEST' : 'UPCOMING'}
                </span>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {c.problems.length} Problems &bull; 5 Hours
                </span>
              </div>

              {/* Title & Desc */}
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                {c.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', flex: 1 }}>
                {c.description}
              </p>

              {/* Meta details */}
              <div style={{ 
                background: 'var(--bg-card)', 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.25rem'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={14} color="var(--primary)" />
                  {c.participantsCount} Registered
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} color="#10b981" />
                  Isolate Sandbox Active
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  id={`btn-scoreboard-${c.id}`}
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                  onClick={onOpenScoreboard}
                >
                  <Trophy size={14} />
                  Live Scoreboard
                </button>
                <button 
                  id={`btn-enter-${c.id}`}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                  onClick={onOpenProblems}
                >
                  Enter
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};
