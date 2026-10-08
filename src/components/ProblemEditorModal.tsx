import React, { useState } from 'react';
import { Plus, X, Layers, Clock, Cpu } from 'lucide-react';
import { Problem } from '../types';

interface ProblemEditorModalProps {
  onClose: () => void;
  onSave: (problem: Problem) => void;
  authorName: string;
}

export const ProblemEditorModal: React.FC<ProblemEditorModalProps> = ({
  onClose,
  onSave,
  authorName
}) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [tags, setTags] = useState('Dynamic Programming, Greedy');
  const [timeLimitMs, setTimeLimitMs] = useState(1000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [statementMd, setStatementMd] = useState('Given an array of $n$ elements, find the optimum value...');
  const [inputFormat, setInputFormat] = useState('The first line contains integer $n$ ($1 \\le n \\le 10^5$).');
  const [outputFormat, setOutputFormat] = useState('Print the result.');
  const [sampleIn, setSampleIn] = useState('5\n1 2 3 4 5');
  const [sampleOut, setSampleOut] = useState('15');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleSave = () => {
    if (!title.trim() || !slug.trim()) {
      alert('Please provide a title and slug');
      return;
    }

    const newProblem: Problem = {
      id: `p_${Date.now()}`,
      slug,
      title,
      difficulty,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      statementMd,
      inputFormat,
      outputFormat,
      constraints: ['$1 \\le n \\le 10^5$', 'Time limit: ' + timeLimitMs + 'ms'],
      samples: [
        {
          input: sampleIn,
          output: sampleOut,
          explanation: 'Standard sample evaluation case'
        }
      ],
      subtasks: [
        { id: 1, description: '$n \\le 1000$', points: 40 },
        { id: 2, description: '$n \\le 10^5$', points: 60 }
      ],
      timeLimitMs,
      memoryLimitMb,
      visibility: 'public',
      createdBy: authorName,
      totalSubmissions: 0,
      acceptedSubmissions: 0
    };

    onSave(newProblem);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '750px', padding: '1.75rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
            Create New Algorithmic Problem
          </h3>
          <button id="btn-close-problem-modal" className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Problem Title:
            </label>
            <input 
              id="input-problem-title"
              type="text" 
              className="input" 
              value={title} 
              onChange={(e) => handleTitleChange(e.target.value)} 
              placeholder="e.g. Subarray Max Range Queries"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Difficulty:
            </label>
            <select 
              id="select-problem-difficulty"
              className="select" 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value as any)}
              style={{ width: '100%' }}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              URL Slug:
            </label>
            <input 
              id="input-problem-slug"
              type="text" 
              className="input font-mono" 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)} 
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              CPU Time Limit (ms):
            </label>
            <input 
              id="input-problem-time-limit"
              type="number" 
              className="input font-mono" 
              value={timeLimitMs} 
              onChange={(e) => setTimeLimitMs(Number(e.target.value))} 
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Memory Limit (MB):
            </label>
            <input 
              id="input-problem-mem-limit"
              type="number" 
              className="input font-mono" 
              value={memoryLimitMb} 
              onChange={(e) => setMemoryLimitMb(Number(e.target.value))} 
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Tags (comma separated):
          </label>
          <input 
            id="input-problem-tags"
            type="text" 
            className="input" 
            value={tags} 
            onChange={(e) => setTags(e.target.value)} 
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Problem Statement (Markdown + KaTeX Math):
          </label>
          <textarea 
            id="textarea-problem-statement"
            className="input font-mono" 
            rows={5}
            value={statementMd} 
            onChange={(e) => setStatementMd(e.target.value)} 
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Sample Input:
            </label>
            <textarea 
              id="textarea-sample-in"
              className="input font-mono" 
              rows={3} 
              value={sampleIn} 
              onChange={(e) => setSampleIn(e.target.value)} 
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Sample Expected Output:
            </label>
            <textarea 
              id="textarea-sample-out"
              className="input font-mono" 
              rows={3} 
              value={sampleOut} 
              onChange={(e) => setSampleOut(e.target.value)} 
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            id="btn-save-new-problem"
            className="btn btn-primary" 
            onClick={handleSave}
          >
            Save Problem
          </button>
        </div>
      </div>
    </div>
  );
};
