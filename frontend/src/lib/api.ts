const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ApiOptions extends RequestInit {
  token?: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdBy?: User;
  assignedTo?: User;
  documents?: any[];
}

export async function apiCall<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

// Auth API calls
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    const result = await apiCall<{ success: boolean; data: { token: string; user: User } }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    return result.data;
  },

  login: async (email: string, password: string) => {
    const result = await apiCall<{ success: boolean; data: { token: string; user: User } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return result.data;
  },

  getCurrentUser: async (token: string) => {
    const result = await apiCall<{ success: boolean; data: User }>("/auth/me", { method: "GET", token });
    return result.data;
  },

  updateProfile: async (data: any, token: string) => {
    const result = await apiCall<{ success: boolean; data: User }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    });
    return result.data;
  },

  changePassword: (currentPassword: string, newPassword: string, token: string) =>
    apiCall<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
      token,
    }),
};

// Task API calls
export const taskApi = {
  getAll: async (token: string, params?: Record<string, any>) => {
    const query = new URLSearchParams(params || {});
    const result = await apiCall<{ success: boolean; data: { tasks: Task[]; pagination: { total: number } } }>(
      `/tasks?${query}`,
      { method: "GET", token }
    );
    return { data: result.data?.tasks, count: result.data?.pagination?.total };
  },

  getById: async (id: string, token: string) => {
    const result = await apiCall<{ success: boolean; data: Task }>(`/tasks/${id}`, { method: "GET", token });
    return result.data;
  },

  getStats: (token: string) =>
    apiCall<any>("/tasks/stats", { method: "GET", token }),

  create: async (data: any, token: string) => {
    const result = await apiCall<{ success: boolean; data: Task }>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
    return result.data;
  },

  update: async (id: string, data: any, token: string) => {
    const result = await apiCall<{ success: boolean; data: Task }>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    });
    return result.data;
  },

  delete: (id: string, token: string) =>
    apiCall<{ success: boolean; message: string }>(`/tasks/${id}`, { method: "DELETE", token }),

  uploadDocument: (taskId: string, file: File, token: string) => {
    const formData = new FormData();
    formData.append("document", file);

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${API_URL}/tasks/${taskId}/documents`, {
      method: "POST",
      body: formData,
      headers,
    }).then((res) => {
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    });
  },

  deleteDocument: (taskId: string, documentId: string, token: string) =>
    apiCall<{ success: boolean; message: string }>(`/tasks/${taskId}/documents/${documentId}`, {
      method: "DELETE",
      token,
    }),
};

// User API calls
export const userApi = {
  getAll: async (token: string, params?: Record<string, any>) => {
    const query = new URLSearchParams(params || {});
    const result = await apiCall<{ success: boolean; data: { users: User[]; count: number } }>(
      `/users?${query}`,
      { method: "GET", token }
    );
    return { data: result.data?.users, count: result.data?.count };
  },

  getById: async (id: string, token: string) => {
    const result = await apiCall<{ success: boolean; data: User }>(`/users/${id}`, { method: "GET", token });
    return result.data;
  },

  create: async (data: any, token: string) => {
    const result = await apiCall<{ success: boolean; data: User }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
    return result.data;
  },

  update: async (id: string, data: any, token: string) => {
    const result = await apiCall<{ success: boolean; data: User }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    });
    return result.data;
  },

  delete: (id: string, token: string) =>
    apiCall<{ success: boolean; message: string }>(`/users/${id}`, { method: "DELETE", token }),

  bulkUpdate: (data: any, token: string) =>
    apiCall<{ success: boolean; message: string }>("/users/bulk-update", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
};
