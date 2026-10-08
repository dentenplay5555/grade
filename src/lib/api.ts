import { Problem, Submission, Contest, ScoreboardRow, User, AuditLogItem, UserSession, JudgeWorkerStatus, Role, PermissionKey } from '../types';
import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Standard fetch wrapper with Supabase JWT Bearer token authentication
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Supabase access token if available
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
  } catch (err) {
    // Proceed without header if session check fails
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Authentication & Session
  auth: {
    getCurrentUser: () => request<User>('/users/me'),
    logout: async () => {
      await supabase.auth.signOut();
      return { success: true };
    },
    getActiveSessions: () => request<UserSession[]>('/auth/sessions'),
    revokeOtherSessions: () => request<{ revokedCount: number }>('/auth/sessions/revoke-others', { method: 'POST' })
  },

  // Problems
  problems: {
    list: () => request<Problem[]>('/problems'),
    get: (id: string) => request<Problem>(`/problems/${id}`),
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
    submit: (data: { problem_id: string; language: string; source_code: string }) =>
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
    getRoles: () => request<Role[]>('/admin/v1/roles'),
    updateRolePermissions: (roleId: string, permissions: PermissionKey[]) =>
      request<Role>(`/admin/v1/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions })
      }),
    createRole: (role: Partial<Role>) =>
      request<Role>('/admin/v1/roles', {
        method: 'POST',
        body: JSON.stringify(role)
      }),
    getUsers: () => request<User[]>('/admin/v1/users'),
    assignUserRole: (userId: string, roleId: string, scopeType: string, scopeId?: string) =>
      request<User>(`/admin/v1/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roleId, scopeType, scopeId })
      }),
    banUser: (userId: string, isBanned: boolean) =>
      request<User>(`/admin/v1/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ isBanned })
      }),
    uploadTestcases: (problemId: string, formData: FormData) =>
      request<{ uploadedCount: number }>(`/admin/v1/problems/${problemId}/testcases`, {
        method: 'POST',
        body: formData
      }),
    getAuditLogs: (query?: string) =>
      request<AuditLogItem[]>(`/admin/v1/audit${query ? `?search=${encodeURIComponent(query)}` : ''}`),
    getClusterStatus: () => request<JudgeWorkerStatus[]>('/admin/v1/system/status')
  }
};
