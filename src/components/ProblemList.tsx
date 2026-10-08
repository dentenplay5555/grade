import React, { useState } from 'react';
import { Search, Plus, Filter, CheckCircle2, Clock, Cpu, ArrowUpRight, Lock, BookOpen } from 'lucide-react';
import { Problem, User, Role } from '../types';
import { can } from '../lib/rbac';

interface ProblemListProps {
  problems: Problem[];
  onSelectProblem: (problem: Problem) => void;
  currentUser: User;
  allRoles: Role[];
  onOpenCreateProblem: () => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({
  problems,
  onSelectProblem,
  currentUser,
  allRoles,
  onOpenCreateProblem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const canCreate = can(currentUser, 'problem:create', undefined, allRoles);

  // Extract unique tags
  const allTags = Array.from(new Set(problems.flatMap(p => p.tags)));

  // Filtered problems
  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
    const matchesTag = selectedTag === 'all' || p.tags.includes(selectedTag);
    return matchesSearch && matchesDiff && matchesTag;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Top Banner & Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <BookOpen size={22} color="var(--primary)" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Problem Archive
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Practice algorithmic challenges evaluated under strict Zero-Trust Linux <code className="font-mono" style={{ color: '#10b981' }}>isolate</code> sandbox limits.
          </p>
        </div>

        {/* Action Button: Create Problem (Protected by RBAC) */}
        {canCreate ? (
          <button 
            id="btn-create-problem"
            className="btn btn-primary"
            onClick={onOpenCreateProblem}
          >
            <Plus size={16} />
            Create Problem
          </button>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            background: 'var(--bg-card)',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            <Lock size={13} />
            <span>Problem authoring requires <code className="font-mono">problem:create</code> (Teacher/Admin role)</span>
          </div>
        )}
      </div>

      {/* Filters & Search Toolbar */}
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
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            id="input-search-problems"
            type="text"
            className="input"
            placeholder="Search problems by title, slug, or algorithm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Difficulty Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Difficulty:</span>
          <select 
            id="filter-difficulty"
            className="select"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Tag Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Topic:</span>
          <select 
            id="filter-tag"
            className="select"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="all">All Topics</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Problems Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th>Problem Title</th>
              <th>Tags / Categories</th>
              <th style={{ width: '110px' }}>Difficulty</th>
              <th style={{ width: '160px' }}>Limits</th>
              <th style={{ width: '120px' }}>Acceptance</th>
              <th style={{ width: '100px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                  {problems.length === 0 
                    ? "No problems published yet. Author or import problems using the 'Create Problem' button above."
                    : "No problems match your current search and filter criteria."}
                </td>
              </tr>
            ) : (
              filteredProblems.map((prob, idx) => {
                const accRate = prob.totalSubmissions > 0 
                  ? ((prob.acceptedSubmissions / prob.totalSubmissions) * 100).toFixed(1) 
                  : '0.0';

                return (
                  <tr key={prob.id} style={{ cursor: 'pointer' }} onClick={() => onSelectProblem(prob)}>
                    <td className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {idx + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {prob.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {prob.slug}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {prob.tags.map(t => (
                          <span key={t} className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: prob.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.15)' : prob.difficulty === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: prob.difficulty === 'Easy' ? '#10b981' : prob.difficulty === 'Medium' ? '#f59e0b' : '#ef4444'
                      }}>
                        {prob.difficulty}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} color="var(--primary)" /> {prob.timeLimitMs} ms
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Cpu size={12} color="#10b981" /> {prob.memoryLimitMb} MB
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {accRate}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {prob.acceptedSubmissions}/{prob.totalSubmissions} AC
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        id={`btn-solve-${prob.slug}`}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProblem(prob);
                        }}
                      >
                        Solve
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
