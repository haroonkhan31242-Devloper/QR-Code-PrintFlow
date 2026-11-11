export class ApiError extends Error {
  constructor(public status: number, message: string, public field?: string, public code?: string) {
    super(message);
  }
}

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();
/** Lets the auth layer react when the server says the session is gone. */
export const onUnauthorized = (fn: Listener) => {
  unauthorizedListeners.add(fn);
  return () => {
    unauthorizedListeners.delete(fn);
  };
};

async function request<T>(method: string, url: string, body?: unknown | FormData): Promise<T> {
  const headers: Record<string, string> = { 'X-Requested-With': 'PrintFlow' };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: payload, credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your internet connection and try again.');
  }

  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    if (res.status === 401 && !url.startsWith('/api/auth/')) unauthorizedListeners.forEach((l) => l());
    throw new ApiError(res.status, data.error || `Request failed (${res.status}).`, data.field, data.code);
  }
  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body ?? {}),
  put: <T>(url: string, body: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body: unknown) => request<T>('PATCH', url, body),
  del: <T>(url: string, body?: unknown) => request<T>('DELETE', url, body ?? {}),
  upload: <T>(url: string, form: FormData) => request<T>('POST', url, form),
};

/** XHR upload with progress (fetch has no upload progress events). */
export function uploadWithProgress<T>(url: string, form: FormData, onProgress: (fraction: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('X-Requested-With', 'PrintFlow');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onerror = () => reject(new ApiError(0, 'Upload failed. Check your internet connection and try again.'));
    xhr.onload = () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
      else reject(new ApiError(xhr.status, data.error || `Upload failed (${xhr.status}).`, data.field));
    };
    xhr.send(form);
  });
}
