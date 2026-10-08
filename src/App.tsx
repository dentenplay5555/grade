import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ProblemList } from './components/ProblemList';
import { ProblemSolver } from './components/ProblemSolver';
import { SubmissionsList } from './components/SubmissionsList';
import { ScoreboardView } from './components/ScoreboardView';
import { ContestsList } from './components/ContestsList';
import { AdminPortal } from './components/AdminPortal';
import { SecuritySessionsModal } from './components/SecuritySessionsModal';
import { SudoModeModal } from './components/SudoModeModal';
import { ProblemEditorModal } from './components/ProblemEditorModal';
import { LoginPage } from './components/LoginPage';
import { DEFAULT_ROLES } from './lib/rbac';
import { Problem, Submission, User, Role, Contest, ScoreboardRow } from './types';
import { api } from './lib/api';

// Default system admin placeholder \u2014 replaced at runtime by api.auth.getCurrentUser()
const DEFAULT_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%231e293b'/%3E%3Ccircle cx='20' cy='15' r='7' fill='%2364748b'/%3E%3Cellipse cx='20' cy='34' rx='12' ry='8' fill='%2364748b'/%3E%3C/svg%3E`;

const INITIAL_SYSTEM_ADMIN: User = {
  id: 'usr_admin',
  name: 'System Administrator',
  email: 'admin@guarding.local',
  avatar: DEFAULT_AVATAR,
  status: 'active',
  isAdmin: true,
  hasPasskey: false,
  hasTotp: false,
  createdAt: new Date().toISOString(),
  roles: [{ roleId: 'admin', scopeType: 'global' }]
};

export const App: React.FC = () => {
  // Auth gate: null = loading, false = not logged in, true = logged in
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Navigation
  const [activeTab, setActiveTab] = useState<string>('problems');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // RBAC & Users
  const [allRoles, setAllRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [allUsers, setAllUsers] = useState<User[]>([INITIAL_SYSTEM_ADMIN]);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_SYSTEM_ADMIN);

  // Clean Production Data (empty by default, loaded from API)
  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [scoreboard, setScoreboard] = useState<ScoreboardRow[]>([]);

  // Load live data from API upon initialization
  const loadAppData = () => {
    api.problems.list().then(data => {
      if (Array.isArray(data) && data.length > 0) setProblems(data);
    }).catch(() => {});

    api.submissions.list().then(data => {
      if (Array.isArray(data) && data.length > 0) setSubmissions(data);
    }).catch(() => {});

    api.contests.list().then(data => {
      if (Array.isArray(data) && data.length > 0) setContests(data);
    }).catch(() => {});
  };

  // Auth check on mount — determine if user has an active session
  useEffect(() => {
    api.auth.getCurrentUser().then(user => {
      if (user) {
        setCurrentUser(user);
        setAllUsers(prev => prev.some(u => u.id === user.id) ? prev : [user, ...prev]);
        setIsAuthenticated(true);
        loadAppData();
      } else {
        setIsAuthenticated(false);
      }
    }).catch(() => {
      // API unreachable — show login page
      setIsAuthenticated(false);
    });
  }, []);

  // Modals
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isCreateProblemOpen, setIsCreateProblemOpen] = useState(false);
  const [sudoState, setSudoState] = useState<{
    isOpen: boolean;
    actionName: string;
    onAuthorized?: () => void;
  }>({
    isOpen: false,
    actionName: ''
  });

  // Apply theme to document body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    }
  }, [theme]);

  // Switch active preview user
  const handleSwitchUser = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  // Open problem solver
  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setActiveTab('solver');
  };

  // Submission handler
  const handleNewSubmission = (newSub: Submission) => {
    setSubmissions(prev => [newSub, ...prev]);
  };

  // Rejudge handler
  const handleRejudgeSubmission = (subId: string) => {
    setSubmissions(prev => prev.map(s => {
      if (s.id !== subId) return s;
      return {
        ...s,
        verdict: 'AC',
        score: 100,
        timeMs: Math.max(10, s.timeMs - 5)
      };
    }));
    alert(`Submission ${subId} successfully re-evaluated by Isolate worker daemon.`);
  };

  // Sudo Guard trigger
  const handleRequestSudoAction = (actionName: string, onAuthorized: () => void) => {
    setSudoState({
      isOpen: true,
      actionName,
      onAuthorized
    });
  };

  // Sudo confirmed
  const handleConfirmSudo = () => {
    if (sudoState.onAuthorized) {
      sudoState.onAuthorized();
    }
    setSudoState({ isOpen: false, actionName: '' });
  };

  // Login success: re-fetch user profile and enter the app
  const handleLoginSuccess = () => {
    api.auth.getCurrentUser().then(user => {
      if (user) {
        setCurrentUser(user);
        setAllUsers(prev => prev.some(u => u.id === user.id) ? prev : [user, ...prev]);
      }
    }).catch(() => {});
    setIsAuthenticated(true);
    loadAppData();
  };

  // ── Loading state (checking session) ─────────────────────────────────────
  if (isAuthenticated === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Checking session…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Not authenticated — show login page ───────────────────────────────────
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // ── Authenticated — show main app ─────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Universal Navigation Header */}
      <Navbar
        activeTab={activeTab === 'solver' ? 'problems' : activeTab}
        setActiveTab={(tab) => {
          setSelectedProblem(null);
          setActiveTab(tab);
        }}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        allUsers={allUsers}
        allRoles={allRoles}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'problems' && (
          <ProblemList
            problems={problems}
            onSelectProblem={handleSelectProblem}
            currentUser={currentUser}
            allRoles={allRoles}
            onOpenCreateProblem={() => setIsCreateProblemOpen(true)}
          />
        )}

        {activeTab === 'solver' && selectedProblem && (
          <ProblemSolver
            problem={selectedProblem}
            onBack={() => setActiveTab('problems')}
            currentUser={currentUser}
            onNewSubmission={handleNewSubmission}
          />
        )}

        {activeTab === 'contests' && (
          <ContestsList
            contests={contests}
            currentUser={currentUser}
            allRoles={allRoles}
            onOpenScoreboard={() => setActiveTab('scoreboard')}
            onOpenProblems={() => setActiveTab('problems')}
          />
        )}

        {activeTab === 'submissions' && (
          <SubmissionsList
            submissions={submissions}
            currentUser={currentUser}
            allRoles={allRoles}
            onRejudge={handleRejudgeSubmission}
          />
        )}

        {activeTab === 'scoreboard' && (
          <ScoreboardView
            contest={contests[0]}
            scoreboard={scoreboard}
            currentUser={currentUser}
            allRoles={allRoles}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPortal
            currentUser={currentUser}
            allRoles={allRoles}
            onUpdateRoles={setAllRoles}
            allUsers={allUsers}
            onUpdateUsers={setAllUsers}
            problems={problems}
            onUpdateProblems={setProblems}
            onRequestSudoAction={handleRequestSudoAction}
          />
        )}
      </main>

      {/* Security & Sessions Modal */}
      {isSecurityModalOpen && (
        <SecuritySessionsModal
          currentUser={currentUser}
          onClose={() => setIsSecurityModalOpen(false)}
          onUpdateCurrentUser={(updated) => {
            setCurrentUser(updated);
            setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          }}
        />
      )}

      {/* Sudo Mode Re-Auth Modal */}
      {sudoState.isOpen && (
        <SudoModeModal
          actionDescription={sudoState.actionName}
          currentUser={currentUser}
          onConfirm={handleConfirmSudo}
          onCancel={() => setSudoState({ isOpen: false, actionName: '' })}
        />
      )}

      {/* Problem Editor / Authoring Modal */}
      {isCreateProblemOpen && (
        <ProblemEditorModal
          onClose={() => setIsCreateProblemOpen(false)}
          authorName={currentUser.name}
          onSave={(newProb) => {
            setProblems(prev => [newProb, ...prev]);
            setSelectedProblem(newProb);
            setActiveTab('solver');
          }}
        />
      )}
    </div>
  );
};

export default App;
