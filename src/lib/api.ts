import { Problem, Submission, Contest, ScoreboardRow, User, AuditLogItem, UserSession, JudgeWorkerStatus, Role, PermissionKey } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Standard fetch wrapper with credentials and CSRF protection
 * as specified in over-all.txt: Cookie session + CSRF token header
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Include CSRF token from document cookie if present
  const csrfMatch = document.cookie.match(/csrf_token=([^;]+)/);
  if (csrfMatch) {
    headers.set('X-CSRF-Token', csrfMatch[1]);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // Send __Host- cookie
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Authentication & Session
  auth: {
    getCurrentUser: () => request<User | null>('/auth/me'),
    loginWithGoogle: (authCode: string, state: string) =>
      request<User>('/auth/google/callback', {
        method: 'POST',
        body: JSON.stringify({ code: authCode, state })
      }),
    logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
    getActiveSessions: () => request<UserSession[]>('/auth/sessions'),
    revokeOtherSessions: () => request<{ revokedCount: number }>('/auth/sessions/revoke-others', { method: 'POST' })
  },

  // Problems
  problems: {
    list: () => request<Problem[]>('/problems'),
    get: (slug: string) => request<Problem>(`/problems/${slug}`),
    create: (data: Partial<Problem>) => request<Problem>('/problems', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: Partial<Problem>) => request<Problem>(`/problems/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => request<{ success: boolean }>(`/problems/${id}`, { method: 'DELETE' })
  },

  // Submissions
  submissions: {
    list: (params?: { problemId?: string; verdict?: string; lang?: string; userId?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.problemId) searchParams.set('problemId', params.problemId);
      if (params?.verdict && params.verdict !== 'all') searchParams.set('verdict', params.verdict);
      if (params?.lang && params.lang !== 'all') searchParams.set('lang', params.lang);
      if (params?.userId) searchParams.set('userId', params.userId);
      const query = searchParams.toString();
      return request<Submission[]>(`/submissions${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<Submission>(`/submissions/${id}`),
    submit: (data: { problemId: string; lang: string; code: string }) =>
      request<Submission>('/submissions', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    rejudge: (id: string) => request<Submission>(`/submissions/${id}/rejudge`, { method: 'POST' })
  },

  // Contests
  contests: {
    list: () => request<Contest[]>('/contests'),
    getScoreboard: (contestId: string) => request<ScoreboardRow[]>(`/contests/${contestId}/scoreboard`),
    toggleFreeze: (contestId: string, isFrozen: boolean) =>
      request<{ isFrozen: boolean }>(`/contests/${contestId}/freeze`, {
        method: 'POST',
        body: JSON.stringify({ isFrozen })
      })
  },

  // Admin & RBAC
  admin: {
    getRoles: () => request<Role[]>('/admin/roles'),
    updateRolePermissions: (roleId: string, permissions: PermissionKey[]) =>
      request<Role>(`/admin/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions })
      }),
    createRole: (role: Partial<Role>) =>
      request<Role>('/admin/roles', {
        method: 'POST',
        body: JSON.stringify(role)
      }),
    getUsers: () => request<User[]>('/admin/users'),
    assignUserRole: (userId: string, roleId: string, scopeType: string, scopeId?: string) =>
      request<User>(`/admin/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roleId, scopeType, scopeId })
      }),
    banUser: (userId: string, isBanned: boolean) =>
      request<User>(`/admin/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ isBanned })
      }),
    uploadTestcases: (problemId: string, formData: FormData) =>
      request<{ uploadedCount: number }>(`/admin/problems/${problemId}/testcases`, {
        method: 'POST',
        body: formData
      }),
    getAuditLogs: (query?: string) =>
      request<AuditLogItem[]>(`/admin/audit${query ? `?search=${encodeURIComponent(query)}` : ''}`),
    getClusterStatus: () => request<JudgeWorkerStatus[]>('/system/judge-workers')
  }
};
