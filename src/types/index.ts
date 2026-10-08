export type PermissionKey =
  | 'problem:read'
  | 'problem:create'
  | 'problem:edit'
  | 'problem:delete'
  | 'problem:view_testcase'
  | 'submission:create'
  | 'submission:read_own'
  | 'submission:read_all'
  | 'submission:rejudge'
  | 'contest:join'
  | 'contest:manage'
  | 'user:read'
  | 'user:ban'
  | 'role:assign'
  | 'audit:read'
  | 'settings:edit';

export type ScopeType = 'global' | 'contest' | 'problem';

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: PermissionKey[];
}

export interface UserRoleAssignment {
  roleId: string;
  scopeType: ScopeType;
  scopeId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  status: 'active' | 'banned' | 'unverified';
  roles: UserRoleAssignment[];
  isAdmin: boolean;
  hasPasskey: boolean;
  hasTotp: boolean;
  createdAt: string;
}

export type Verdict =
  | 'AC'  // Accepted
  | 'WA'  // Wrong Answer
  | 'TLE' // Time Limit Exceeded
  | 'MLE' // Memory Limit Exceeded
  | 'RE'  // Runtime Error
  | 'CE'  // Compile Error
  | 'PENDING'
  | 'JUDGING';

export interface TestcaseResult {
  testcaseId: number;
  subtask: number;
  verdict: Verdict;
  timeMs: number;
  memKb: number;
  points: number;
  maxPoints: number;
  message?: string;
}

export interface Subtask {
  id: number;
  name: string;
  points: number;
  score: number;
  testcaseCount: number;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  statementMd: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  samples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  subtasks: {
    id: number;
    description: string;
    points: number;
  }[];
  timeLimitMs: number;
  memoryLimitMb: number;
  visibility: 'public' | 'contest_only' | 'hidden';
  createdBy: string;
  totalSubmissions: number;
  acceptedSubmissions: number;
}

export interface Submission {
  id: string;
  userId: string;
  userName: string;
  problemId: string;
  problemSlug: string;
  problemTitle: string;
  lang: 'cpp17' | 'cpp20' | 'python3' | 'java17' | 'rust' | 'go';
  code: string;
  verdict: Verdict;
  score: number;
  maxScore: number;
  timeMs: number;
  memKb: number;
  createdAt: string;
  testcaseResults?: TestcaseResult[];
  compilerOutput?: string;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'running' | 'ended';
  isFrozen: boolean;
  problems: {
    problemId: string;
    label: string; // 'A', 'B', 'C'
    points: number;
  }[];
  participantsCount: number;
}

export interface ScoreboardRow {
  rank: number;
  userId: string;
  userName: string;
  userAvatar: string;
  solvedCount: number;
  totalPoints: number;
  totalPenaltyMin: number;
  problemStatus: {
    [problemLabel: string]: {
      solved: boolean;
      score: number;
      attempts: number;
      solveTimeMin: number;
      isFirstSolve?: boolean;
    };
  };
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  target: string;
  meta: Record<string, any>;
  ip: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  isCurrent: boolean;
  createdAt: string;
  expiresAt: string;
  isAdminSession: boolean;
}

export interface JudgeWorkerStatus {
  id: string;
  hostname: string;
  type: 'isolate' | 'nsjail';
  status: 'idle' | 'busy' | 'offline';
  cpuUsagePercent: number;
  memUsageMb: number;
  totalMemMb: number;
  jobsProcessed: number;
  activeSandboxInstances: number;
  queueDepth: number;
  securityProfile: {
    cgroupsV2: boolean;
    seccompStrict: boolean;
    networkIsolated: boolean;
    readOnlyRoot: boolean;
  };
}
