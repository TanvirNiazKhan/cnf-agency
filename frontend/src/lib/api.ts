const BASE = 'http://localhost:5002/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function clearToken() {
  localStorage.removeItem('auth_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ data?: T; error?: string; status?: number }> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      clearToken();
      window.location.reload();
      return { error: 'Unauthorized', status: 401 };
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: json?.message || `HTTP ${res.status}`, status: res.status };
    }
    // NestJS TransformInterceptor wraps in { data, statusCode, timestamp }
    return { data: (json?.data !== undefined ? json.data : json) as T, status: res.status };
  } catch {
    return { error: 'Network error' };
  }
}

async function upload<T>(
  path: string,
  formData: FormData,
): Promise<{ data?: T; error?: string; status?: number }> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.status === 401) {
      clearToken();
      window.location.reload();
      return { error: 'Unauthorized', status: 401 };
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: json?.message || `HTTP ${res.status}`, status: res.status };
    }
    return { data: (json?.data !== undefined ? json.data : json) as T, status: res.status };
  } catch {
    return { error: 'Network error' };
  }
}

export async function downloadFile(path: string, fileName: string) {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, formData: FormData) => upload<T>(path, formData),
};
