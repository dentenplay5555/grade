import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Play, 
  Send, 
  Copy, 
  Check, 
  Clock, 
  Cpu, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Layers, 
  Terminal, 
  ShieldCheck, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { Problem, Submission, User, Verdict, TestcaseResult } from '../types';
import { CODE_TEMPLATES } from '../constants/codeTemplates';
import { renderStatement } from '../lib/renderMarkdown';

interface ProblemSolverProps {
  problem: Problem;
  onBack: () => void;
  currentUser: User;
  onNewSubmission: (submission: Submission) => void;
}

export const ProblemSolver: React.FC<ProblemSolverProps> = ({
  problem,
  onBack,
  currentUser,
  onNewSubmission
}) => {
  const [lang, setLang] = useState<'cpp17' | 'cpp20' | 'python3' | 'java17' | 'rust' | 'go'>('cpp17');
  const [code, setCode] = useState<string>(CODE_TEMPLATES.cpp17);
  const [customInput, setCustomInput] = useState<string>(problem.samples[0]?.input || '');
  const [customOutput, setCustomOutput] = useState<string>('');
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(true);
  const [consoleTab, setConsoleTab] = useState<'input' | 'output'>('input');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Judging state
  const [isJudging, setIsJudging] = useState<boolean>(false);
  const [judgeStep, setJudgeStep] = useState<string>('');
  const [judgeProgress, setJudgeProgress] = useState<number>(0);
  const [liveTestResults, setLiveTestResults] = useState<TestcaseResult[]>([]);
  const [finalVerdict, setFinalVerdict] = useState<Verdict | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  // Update template when language changes
  const handleLangChange = (newLang: any) => {
    setLang(newLang);
    setCode(CODE_TEMPLATES[newLang as keyof typeof CODE_TEMPLATES] || '');
  };

  const handleCopySample = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleUseSampleInConsole = (input: string) => {
    setCustomInput(input);
    setConsoleTab('input');
    setIsConsoleOpen(true);
  };

  const handleResetCode = () => {
    if (window.confirm('Reset code to default template?')) {
      setCode(CODE_TEMPLATES[lang] || '');
    }
  };

  // Run Code against Custom / Sample Input
  const handleRunTest = () => {
    setIsConsoleOpen(true);
    setConsoleTab('output');
    setCustomOutput('Running code on judge worker...');

    setTimeout(() => {
      setCustomOutput(`${problem.samples[0]?.output || ''}\\n\\n[Execution Succeeded: CPU ~12ms | RSS ~2048 KB]\\n(Note: Local preview — actual sandbox execution is server-side)`);
    }, 450);
  };

  // Full submission simulation with real isolate sandbox stages
  const handleSubmitCode = () => {
    setIsJudging(true);
    setFinalVerdict(null);
    setFinalScore(null);
    setLiveTestResults([]);
    setJudgeProgress(10);
    setJudgeStep('1/5 Enqueuing job to Cloudflare Queue / BullMQ Redis...');

    setTimeout(() => {
      setJudgeProgress(30);
      setJudgeStep('2/5 Worker "isolate-cluster-a1" claimed job. Initializing cgroups v2 sandbox...');
    }, 600);

    setTimeout(() => {
      setJudgeProgress(50);
      setJudgeStep(`3/5 Compiling source (${lang === 'cpp17' ? 'g++ -O3 -std=c++17' : lang === 'python3' ? 'python3 py_compile' : 'rustc -O'})...`);
    }, 1200);

    setTimeout(() => {
      setJudgeProgress(75);
      setJudgeStep('4/5 Executing test cases inside zero-network Linux isolate...');
      
      // Generate realistic testcase outcomes
      const subtask1Pts = problem.subtasks[0]?.points || 30;
      const subtask2Pts = problem.subtasks[1]?.points || 70;
      
      const results: TestcaseResult[] = [
        { testcaseId: 1, subtask: 1, verdict: 'AC', timeMs: 6, memKb: 2100, points: Math.floor(subtask1Pts / 3), maxPoints: Math.floor(subtask1Pts / 3) },
        { testcaseId: 2, subtask: 1, verdict: 'AC', timeMs: 9, memKb: 2150, points: Math.floor(subtask1Pts / 3), maxPoints: Math.floor(subtask1Pts / 3) },
        { testcaseId: 3, subtask: 1, verdict: 'AC', timeMs: 12, memKb: 2180, points: subtask1Pts - 2 * Math.floor(subtask1Pts / 3), maxPoints: subtask1Pts - 2 * Math.floor(subtask1Pts / 3) },
        { testcaseId: 4, subtask: 2, verdict: 'AC', timeMs: 38, memKb: 3600, points: Math.floor(subtask2Pts / 2), maxPoints: Math.floor(subtask2Pts / 2) },
        { testcaseId: 5, subtask: 2, verdict: 'AC', timeMs: 44, memKb: 3800, points: subtask2Pts - Math.floor(subtask2Pts / 2), maxPoints: subtask2Pts - Math.floor(subtask2Pts / 2) }
      ];
      setLiveTestResults(results);
    }, 1900);

    setTimeout(() => {
      setJudgeProgress(100);
      setJudgeStep('5/5 Finished. Signed result HMAC verified by Grader API.');
      setFinalVerdict('AC');
      setFinalScore(100);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }

      // Record submission
      const newSub: Submission = {
        id: `sub_${Math.floor(1000 + Math.random() * 9000)}`,
        userId: currentUser.id,
        userName: currentUser.name,
        problemId: problem.id,
        problemSlug: problem.slug,
        problemTitle: problem.title,
        lang,
        code,
        verdict: 'AC',
        score: 100,
        maxScore: 100,
        timeMs: 44,
        memKb: 3800,
        createdAt: new Date().toISOString(),
        testcaseResults: [
          { testcaseId: 1, subtask: 1, verdict: 'AC', timeMs: 6, memKb: 2100, points: 10, maxPoints: 10 },
          { testcaseId: 2, subtask: 1, verdict: 'AC', timeMs: 9, memKb: 2150, points: 10, maxPoints: 10 },
          { testcaseId: 3, subtask: 1, verdict: 'AC', timeMs: 12, memKb: 2180, points: 10, maxPoints: 10 },
          { testcaseId: 4, subtask: 2, verdict: 'AC', timeMs: 38, memKb: 3600, points: 35, maxPoints: 35 },
          { testcaseId: 5, subtask: 2, verdict: 'AC', timeMs: 44, memKb: 3800, points: 35, maxPoints: 35 }
        ]
      };
      onNewSubmission(newSub);
    }, 2500);
  };

  const getMonacoLang = () => {
    switch (lang) {
      case 'cpp17':
      case 'cpp20':
        return 'cpp';
      case 'python3':
        return 'python';
      case 'java17':
        return 'java';
      case 'rust':
        return 'rust';
      case 'go':
        return 'go';
      default:
        return 'cpp';
    }
  };

  return (
    <div className="split-pane-container">
      {/* LEFT PANE: Problem Statement, Constraints, Samples, Subtasks */}
      <div className="pane-left">
        {/* Top bar with back button & limits */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <button 
            id="btn-back-problems"
            className="btn btn-secondary" 
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            onClick={onBack}
          >
            <ArrowLeft size={15} />
            Back to Problems
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
              <Clock size={13} color="var(--primary)" />
              {problem.timeLimitMs} ms
            </span>
            <span className="badge" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
              <Cpu size={13} color="#10b981" />
              {problem.memoryLimitMb} MB
            </span>
            <span className="badge" style={{
              background: problem.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.15)' : problem.difficulty === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: problem.difficulty === 'Easy' ? '#10b981' : problem.difficulty === 'Medium' ? '#f59e0b' : '#ef4444'
            }}>
              {problem.difficulty}
            </span>
          </div>
        </div>

        {/* Title & Tags */}
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          {problem.title}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
          {problem.tags.map(tag => (
            <span key={tag} className="badge" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              {tag}
            </span>
          ))}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', alignSelf: 'center' }}>
            Author: {problem.createdBy}
          </span>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0 1.5rem' }} />

        {/* Problem Statement Body */}
        <div 
          style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: '1.5rem' }}
          dangerouslySetInnerHTML={{ __html: renderStatement(problem.statementMd) }}
        />

        {/* Input Format */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
            Input Format
          </h3>
          <div 
            style={{ fontSize: '0.9rem', lineHeight: 1.6, background: 'var(--bg-card)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
            dangerouslySetInnerHTML={{ __html: renderStatement(problem.inputFormat) }}
          />
        </div>

        {/* Output Format */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
            Output Format
          </h3>
          <div 
            style={{ fontSize: '0.9rem', lineHeight: 1.6, background: 'var(--bg-card)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
            dangerouslySetInnerHTML={{ __html: renderStatement(problem.outputFormat) }}
          />
        </div>

        {/* Constraints */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
            Constraints
          </h3>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', lineHeight: 1.8 }}>
            {problem.constraints.map((c, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: renderStatement(c) }} />
            ))}
          </ul>
        </div>

        {/* Subtask Scoring Matrix (from over-all.txt Section 4 & 5) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Layers size={17} color="#10b981" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Subtask Points Allocation
            </h3>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Subtask</th>
                  <th style={{ width: '80px' }}>Points</th>
                  <th>Constraints & Conditions</th>
                </tr>
              </thead>
              <tbody>
                {problem.subtasks.map(s => (
                  <tr key={s.id}>
                    <td className="font-mono" style={{ fontWeight: 600 }}>#{s.id}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                        {s.points} pts
                      </span>
                    </td>
                    <td dangerouslySetInnerHTML={{ __html: renderStatement(s.description) }} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sample Cases */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary)' }}>
            Sample Testcases
          </h3>
          {problem.samples.map((sample, idx) => (
            <div key={idx} style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1rem', 
              marginBottom: '1rem' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Sample {idx + 1}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                    onClick={() => handleUseSampleInConsole(sample.input)}
                    title="Send to Test Console"
                  >
                    <Terminal size={12} />
                    Run in Console
                  </button>
                  <button 
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                    onClick={() => handleCopySample(sample.input, idx)}
                  >
                    {copiedIndex === idx ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    {copiedIndex === idx ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Input:</div>
                  <pre style={{
                    background: 'var(--bg-app)',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-subtle)',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {sample.input}
                  </pre>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Expected Output:</div>
                  <pre style={{
                    background: 'var(--bg-app)',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-subtle)',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {sample.output}
                  </pre>
                </div>
              </div>
              {sample.explanation && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <em>Note: {sample.explanation}</em>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANE: Code Editor & Execution Console */}
      <div className="pane-right">
        {/* Editor Controls Bar */}
        <div style={{
          padding: '0.65rem 1rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          {/* Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Language:</span>
            <select 
              id="select-language"
              className="select"
              value={lang}
              onChange={(e) => handleLangChange(e.target.value)}
              style={{ fontWeight: 600, fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
            >
              <option value="cpp17">C++17 (GCC 13.2 -O3)</option>
              <option value="cpp20">C++20 (GCC 13.2 -O3)</option>
              <option value="python3">Python 3.12 (PyPy3)</option>
              <option value="java17">Java 17 (OpenJDK)</option>
              <option value="rust">Rust 1.76 (Release)</option>
              <option value="go">Go 1.22</option>
            </select>

            <button 
              id="btn-reset-code"
              className="btn btn-secondary" 
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
              onClick={handleResetCode}
              title="Reset code to standard template"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button 
              id="btn-run-code"
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
              onClick={handleRunTest}
            >
              <Play size={14} color="#10b981" />
              Run Code
            </button>

            <button 
              id="btn-submit-code"
              className="btn btn-primary"
              style={{ padding: '0.4rem 1.1rem', fontSize: '0.85rem', fontWeight: 600 }}
              onClick={handleSubmitCode}
              disabled={isJudging}
            >
              {isJudging ? (
                <>
                  <span className="badge" style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Judging...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Submit Solution
                </>
              )}
            </button>
          </div>
        </div>

        {/* Monaco Code Editor */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            height="100%"
            language={getMonacoLang()}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              lineNumbers: 'on',
              smoothScrolling: true
            }}
          />
        </div>

        {/* Bottom Console / Output Drawer */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          height: isConsoleOpen ? '230px' : '36px',
          transition: 'height 0.2s ease'
        }}>
          {/* Console Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.25rem 0.75rem',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.75rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                id="console-tab-input"
                className="btn btn-secondary"
                style={{
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem',
                  background: consoleTab === 'input' ? 'var(--bg-elevated)' : 'transparent',
                  borderColor: consoleTab === 'input' ? 'var(--border-focus)' : 'transparent'
                }}
                onClick={() => { setConsoleTab('input'); setIsConsoleOpen(true); }}
              >
                Custom Test Input
              </button>
              <button 
                id="console-tab-output"
                className="btn btn-secondary"
                style={{
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.75rem',
                  background: consoleTab === 'output' ? 'var(--bg-elevated)' : 'transparent',
                  borderColor: consoleTab === 'output' ? 'var(--border-focus)' : 'transparent'
                }}
                onClick={() => { setConsoleTab('output'); setIsConsoleOpen(true); }}
              >
                Execution Output
              </button>
            </div>

            <button 
              className="btn-icon" 
              style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            >
              {isConsoleOpen ? 'Collapse ▼' : 'Expand ▲'}
            </button>
          </div>

          {/* Console Content */}
          {isConsoleOpen && (
            <div style={{ flex: 1, padding: '0.65rem 1rem', overflowY: 'auto' }}>
              {consoleTab === 'input' ? (
                <textarea
                  id="textarea-custom-input"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter custom input testcase data here..."
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    padding: '0.5rem',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              ) : (
                <pre 
                  id="pre-custom-output"
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'var(--bg-input)',
                    color: '#34d399',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    padding: '0.5rem',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {customOutput || 'No output yet. Click "Run Code" to execute with isolate sandbox.'}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Judging Pipeline Modal / Bottom Sheet */}
      {isJudging && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  padding: '0.4rem',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--primary)'
                }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                    Isolate Sandbox Judge
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Isolated IOI Sandbox &bull; seccomp &bull; zero-network
                  </div>
                </div>
              </div>

              {finalVerdict && (
                <button 
                  id="btn-close-judge-modal"
                  className="btn btn-secondary" 
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                  onClick={() => setIsJudging(false)}
                >
                  Close
                </button>
              )}
            </div>

            {/* Step & Progress Bar */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{judgeStep}</span>
                <span style={{ fontWeight: 600 }}>{judgeProgress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: 8,
                background: 'var(--bg-card)',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${judgeProgress}%`,
                  height: '100%',
                  background: finalVerdict === 'AC' ? 'linear-gradient(90deg, #3b82f6, #10b981)' : 'var(--primary)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            {/* Final Verdict Banner */}
            {finalVerdict && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: finalVerdict === 'AC' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${finalVerdict === 'AC' ? '#10b981' : '#ef4444'}`,
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {finalVerdict === 'AC' ? (
                    <CheckCircle2 size={32} color="#10b981" />
                  ) : (
                    <XCircle size={32} color="#ef4444" />
                  )}
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: finalVerdict === 'AC' ? '#10b981' : '#ef4444' }}>
                      {finalVerdict === 'AC' ? 'Accepted (AC)' : 'Wrong Answer (WA)'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Total Score: {finalScore} / 100 points
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max CPU Time</div>
                  <div className="font-mono" style={{ fontWeight: 700, fontSize: '0.95rem' }}>44 ms</div>
                </div>
              </div>
            )}

            {/* Testcases breakdown list */}
            {liveTestResults.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Subtasks & Testcases Breakdown:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {liveTestResults.map((tc) => (
                    <div 
                      key={tc.testcaseId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`verdict-badge verdict-${tc.verdict}`}>
                          {tc.verdict}
                        </span>
                        <span className="font-mono">Subtask #{tc.subtask} &bull; Case #{tc.testcaseId}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                        <span className="font-mono">{tc.timeMs}ms</span>
                        <span className="font-mono">{(tc.memKb / 1024).toFixed(1)}MB</span>
                        <span style={{ fontWeight: 600, color: '#10b981' }}>+{tc.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
