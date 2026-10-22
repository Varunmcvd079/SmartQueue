const API_BASE_URL = 
  import.meta.env?.VITE_API_URL ||
  (import.meta.env?.PROD ? '' : (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:8000'));

export const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

export const getStoredToken = () => localStorage.getItem("smartqueue_token");
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("smartqueue_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAuthSession = (token, user) => {
  localStorage.setItem("smartqueue_token", token);
  localStorage.setItem("smartqueue_user", JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem("smartqueue_token");
  localStorage.removeItem("smartqueue_user");
};

const authHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Auth Endpoints ---
export const loginApi = async (username, password) => {
  const res = await fetch(getApiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Authentication failed");
  }
  const data = await res.json();
  setAuthSession(data.access_token, data.user);
  return data;
};

export const fetchMe = async () => {
  const res = await fetch(getApiUrl("/api/auth/me"), {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
};

// --- Public Endpoints ---
export const fetchServices = async () => {
  const res = await fetch(getApiUrl("/api/services"));
  if (!res.ok) throw new Error("Failed to fetch services");
  return res.json();
};

export const fetchCounters = async () => {
  const res = await fetch(getApiUrl("/api/counters"));
  if (!res.ok) throw new Error("Failed to fetch counters");
  return res.json();
};

export const fetchLiveQueue = async () => {
  const res = await fetch(getApiUrl("/api/queue/live"));
  if (!res.ok) throw new Error("Failed to fetch live queue data");
  return res.json();
};

export const fetchTicketDetails = async (tokenNumber) => {
  const res = await fetch(getApiUrl(`/api/tokens/ticket/${encodeURIComponent(tokenNumber)}`));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Ticket not found");
  }
  return res.json();
};

export const generateToken = async (payload) => {
  const res = await fetch(getApiUrl("/api/tokens/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to generate token");
  }
  return res.json();
};

export const fetchAnalyticsSummary = async () => {
  const res = await fetch(getApiUrl("/api/analytics/summary"));
  if (!res.ok) throw new Error("Failed to fetch analytics summary");
  return res.json();
};

export const fetchSympyFormula = async () => {
  const res = await fetch(getApiUrl("/api/analytics/sympy-formula"));
  if (!res.ok) throw new Error("Failed to fetch SymPy formula details");
  return res.json();
};

// --- Staff Endpoints (Bearer Required) ---
export const callNextToken = async (counterId) => {
  const res = await fetch(getApiUrl("/api/counter/call-next"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ counter_id: counterId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to call next token");
  }
  return res.json();
};

export const performCounterAction = async (payload) => {
  const res = await fetch(getApiUrl("/api/counter/action"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to perform action");
  }
  return res.json();
};

export const updateCounterStatus = async (counterId, status) => {
  const res = await fetch(getApiUrl(`/api/counters/${counterId}/status`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update counter status");
  }
  return res.json();
};

// --- Admin Endpoints (Strict ADMIN Bearer) ---
export const fetchAdminAuditLogs = async () => {
  const res = await fetch(getApiUrl("/api/admin/audit-logs"), {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Unauthorized access to audit logs");
  }
  return res.json();
};

export const fetchAdminStaff = async () => {
  const res = await fetch(getApiUrl("/api/admin/staff"), {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch staff accounts");
  return res.json();
};

export const createAdminService = async (serviceData) => {
  const res = await fetch(getApiUrl("/api/admin/services"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(serviceData),
  });
  if (!res.ok) throw new Error("Failed to create service");
  return res.json();
};

export const assignStaffToCounter = async (counterId, staffId) => {
  const res = await fetch(getApiUrl(`/api/admin/counters/${counterId}/assign-staff`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ staff_id: staffId }),
  });
  if (!res.ok) throw new Error("Failed to assign staff");
  return res.json();
};

export const reseedData = async () => {
  const res = await fetch(getApiUrl("/api/admin/seed"), {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to reseed database");
  return res.json();
};

export const createWebSocketConnection = (onMessage) => {
  const wsUrl = (API_BASE_URL.replace(/^http/, "ws")) + "/ws/queue";
  try {
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) { }
    };
    return ws;
  } catch (err) {
    return null;
  }
};
