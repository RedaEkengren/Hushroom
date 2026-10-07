// JWT wrapper for API calls
const TOKEN_KEY = 'hushroom_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUserIdFromToken(): string | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || null;
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
}

export function getRole(): string | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export function isCreatorVerified(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.creatorVerified === true;
  } catch {
    return false;
  }
}

// Override fetch to add JWT token
const originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === 'string' ? input : input.toString();
  let options = init || {};
  
  // Only intercept API calls
  if (typeof url === 'string' && url.startsWith('/api/')) {
    const token = getToken();
    
    options.headers = options.headers || {};
    
    if (token) {
      (options.headers as any)['Authorization'] = `Bearer ${token}`;
    }
    
    // Skip CSRF endpoint
    if (url === '/api/csrf-token') {
      return Promise.resolve(new Response(JSON.stringify({ csrfToken: 'jwt-no-csrf-needed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  }
  
  return originalFetch.call(this, input, options).then(async (response) => {
    // Save token from login response
    if (url === '/api/login' && response.ok) {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      if (data.token) {
        setToken(data.token);
        // Modify response to include sessionId for compatibility
        const modifiedData = { ...data, sessionId: data.token };
        return new Response(JSON.stringify(modifiedData), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }
    }
    
    // Handle auth verify response
    if (typeof url === 'string' && url.startsWith('/api/auth/verify/') && response.ok) {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      if (data.token) {
        setToken(data.token);
      }
    }

    // Handle room creation response
    if (url === '/api/create-room' && response.ok) {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      if (data.token) {
        setToken(data.token);
      }
    }

    // /api/join-room rebinds the JWT with roomId + role:'participant'.
    // Without persisting the rebound token, the WS upgrade carries the
    // pre-join JWT (no roomId) and Sprint 13.1's binding rejects it with
    // close 4003 — i.e. the legitimate joiner gets locked out.
    if (url === '/api/join-room' && response.ok) {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      if (data.token) {
        setToken(data.token);
      }
    }

    return response;
  });
};

// Export for manual use
export const JWTWrapper = {
  getToken,
  setToken,
  clearToken
};
