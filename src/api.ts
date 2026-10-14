export type ApiProject = {
  id: number
  name: string
  description: string | null
  repository_owner: string | null
  repository_name: string | null
  created_at: string
  updated_at: string
}

export type ApiIssue = {
  id: number
  project_id: number
  title: string
  description: string | null
  status: string
  priority: string
  type: string
  assignee: string | null
  labels: string[]
  due_date: string | null
  sprint_id: number | null
  created_at: string
  updated_at: string
  closed_at: string | null
}

export type ApiSprint = {
  id: number
  project_id: number
  name: string
  goal: string | null
  start_date: string
  end_date: string
  status: string
  created_at: string
  updated_at: string
}

export type ApiAnalytics = {
  project_id: number
  issue_counts: Record<string, number>
  series: Array<{ date: string; created: number; closed: number }>
  generated_at: string
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(/\/+$/, '')

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!response.ok) {
    let message = 'Request failed'
    try {
      const detail = JSON.parse(text)
      message = typeof detail === 'string' ? detail : detail?.detail ?? message
    } catch {
      message = text || message
    }
    throw new Error(message)
  }

  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export const api = {
  listProjects: () => apiFetch<ApiProject[]>('/projects'),
  createProject: (payload: {
    name: string
    description?: string | null
    repository_owner?: string | null
    repository_name?: string | null
  }) => apiFetch<ApiProject>('/projects', { method: 'POST', body: JSON.stringify(payload) }),
  listProjectIssues: (projectId: number) => apiFetch<ApiIssue[]>(`/projects/${projectId}/issues`),
  createIssue: (projectId: number, payload: Record<string, unknown>) =>
    apiFetch<ApiIssue>(`/projects/${projectId}/issues`, { method: 'POST', body: JSON.stringify(payload) }),
  updateIssue: (issueId: number, payload: Record<string, unknown>) =>
    apiFetch<ApiIssue>(`/issues/${issueId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteIssue: (issueId: number) => apiFetch<void>(`/issues/${issueId}`, { method: 'DELETE' }),
  listProjectSprints: (projectId: number) => apiFetch<ApiSprint[]>(`/projects/${projectId}/sprints`),
  createSprint: (projectId: number, payload: Record<string, unknown>) =>
    apiFetch<ApiSprint>(`/projects/${projectId}/sprints`, { method: 'POST', body: JSON.stringify(payload) }),
  updateSprint: (sprintId: number, payload: Record<string, unknown>) =>
    apiFetch<ApiSprint>(`/sprints/${sprintId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteSprint: (sprintId: number) => apiFetch<void>(`/sprints/${sprintId}`, { method: 'DELETE' }),
  getProjectAnalytics: (projectId: number) => apiFetch<ApiAnalytics>(`/projects/${projectId}/analytics`),
  getProjectDashboard: (projectId: number) => apiFetch<Record<string, unknown>>(`/projects/${projectId}/dashboard`),
  getProjectActivity: (projectId: number) => apiFetch<Array<Record<string, unknown>>>(`/projects/${projectId}/activity`),
}
