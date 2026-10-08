import { PermissionKey, Role, User, ScopeType } from '../types';

export const SYSTEM_PERMISSIONS: { key: PermissionKey; group: string; label: string; description: string }[] = [
  // Problem
  { key: 'problem:read', group: 'problem', label: 'Read Problems', description: 'Browse and view problem statements' },
  { key: 'problem:create', group: 'problem', label: 'Create Problem', description: 'Author new problem challenges' },
  { key: 'problem:edit', group: 'problem', label: 'Edit Problem', description: 'Modify statements, limits, and tags' },
  { key: 'problem:delete', group: 'problem', label: 'Delete Problem', description: 'Soft or permanent delete problem' },
  { key: 'problem:view_testcase', group: 'problem', label: 'View Testcases', description: 'Inspect hidden test inputs and solutions' },
  
  // Submission
  { key: 'submission:create', group: 'submission', label: 'Submit Code', description: 'Submit solution for grading' },
  { key: 'submission:read_own', group: 'submission', label: 'View Own Submissions', description: 'Inspect own code and results' },
  { key: 'submission:read_all', group: 'submission', label: 'View All Submissions', description: 'Inspect any user source code and logs' },
  { key: 'submission:rejudge', group: 'submission', label: 'Rejudge Submissions', description: 'Re-trigger isolate sandbox grader' },
  
  // Contest
  { key: 'contest:join', group: 'contest', label: 'Join Contest', description: 'Participate and submit in active contests' },
  { key: 'contest:manage', group: 'contest', label: 'Manage Contest', description: 'Create contest, freeze scoreboard, set problems' },
  
  // User & Roles
  { key: 'user:read', group: 'user', label: 'View Users', description: 'View user directory and stats' },
  { key: 'user:ban', group: 'user', label: 'Ban / Mute User', description: 'Suspend malicious or abusive accounts' },
  { key: 'role:assign', group: 'user', label: 'Assign Roles', description: 'Modify user permissions and grant roles' },
  
  // System
  { key: 'audit:read', group: 'system', label: 'Read Audit Logs', description: 'Inspect security events, IPs, and actions' },
  { key: 'settings:edit', group: 'system', label: 'Edit System Config', description: 'Modify judge workers, rate limits, and security' },
];

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full unconstrained platform control, RBAC manager, audit reader, and security operator',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.map(p => p.key)
  },
  {
    id: 'teacher',
    name: 'Teacher / Problem Setter',
    description: 'Can author problems, view test cases, inspect all submissions, and rejudge',
    isSystem: true,
    permissions: [
      'problem:read',
      'problem:create',
      'problem:edit',
      'problem:view_testcase',
      'submission:create',
      'submission:read_own',
      'submission:read_all',
      'submission:rejudge',
      'contest:join',
      'contest:manage',
      'user:read'
    ]
  },
  {
    id: 'contest_manager',
    name: 'Contest Manager',
    description: 'Manages live competitions, freezes scoreboard, and views contest participants',
    isSystem: false,
    permissions: [
      'problem:read',
      'submission:create',
      'submission:read_own',
      'submission:read_all',
      'contest:join',
      'contest:manage',
      'user:read'
    ]
  },
  {
    id: 'student',
    name: 'Student (Normal User)',
    description: 'Solves problems, views own submissions, and participates in public contests',
    isSystem: true,
    permissions: [
      'problem:read',
      'submission:create',
      'submission:read_own',
      'contest:join',
      'user:read'
    ]
  }
];

export interface ScopeContext {
  problemId?: string;
  contestId?: string;
}

/**
 * Core RBAC decision function as specified in over-all.txt:
 * can(user, 'problem:edit', {problemId})
 * Implements deny-by-default and scope resolution (global > contest > problem).
 */
export function can(
  user: User | null,
  permission: PermissionKey,
  scope?: ScopeContext,
  allRoles: Role[] = DEFAULT_ROLES
): boolean {
  if (!user || user.status === 'banned') {
    return false;
  }

  // Admin bypass flag
  if (user.isAdmin) {
    return true;
  }

  const roleMap = new Map<string, Role>(allRoles.map(r => [r.id, r]));

  // Check each role assigned to the user
  for (const assignment of user.roles) {
    const role = roleMap.get(assignment.roleId);
    if (!role) continue;

    // Check if role possesses the requested permission
    if (role.permissions.includes(permission)) {
      // 1. Global scope grants access everywhere
      if (assignment.scopeType === 'global') {
        return true;
      }

      // 2. Contest scope
      if (assignment.scopeType === 'contest' && scope?.contestId) {
        if (assignment.scopeId === scope.contestId) {
          return true;
        }
      }

      // 3. Problem scope
      if (assignment.scopeType === 'problem' && scope?.problemId) {
        if (assignment.scopeId === scope.problemId) {
          return true;
        }
      }
    }
  }

  return false;
}
