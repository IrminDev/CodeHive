import { API_BASE_URL } from '~/core/config/env'
import { getAuthToken } from '~/core/storage/token.storage'

import type {
  ExecutionDTO,
  ExecutionReport,
  ExecutionRequest,
} from '../types/execution.types'

type ApiResponse<T> = { data: T; message?: string }

function authHeaders(): HeadersInit {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      (body as { message?: string }).message ?? `HTTP ${res.status}`,
    )
  }
  return (body as ApiResponse<T>).data
}

export async function submitExecution(
  request: ExecutionRequest,
): Promise<ExecutionDTO> {
  const res = await fetch(`${API_BASE_URL}/api/execution/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(request),
  })
  return parseResponse<ExecutionDTO>(res)
}

export async function getExecution(id: string): Promise<ExecutionDTO> {
  const res = await fetch(`${API_BASE_URL}/api/execution/check/${id}`, {
    headers: authHeaders(),
  })
  return parseResponse<ExecutionDTO>(res)
}

export async function getExecutionReport(
  id: string,
): Promise<ExecutionReport> {
  const res = await fetch(`${API_BASE_URL}/api/execution/check/${id}/report`, {
    headers: authHeaders(),
  })
  return parseResponse<ExecutionReport>(res)
}
