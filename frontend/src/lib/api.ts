import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const auth = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    apiClient.post("/auth/register", data),
  login: (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return apiClient.post<{ access_token: string; token_type: string }>("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  me: () => apiClient.get("/auth/me"),
};

export const transcriptions = {
  list: (skip = 0, limit = 20) =>
    apiClient.get("/api/transcriptions", { params: { skip, limit } }),
  get: (id: number) => apiClient.get(`/api/transcriptions/${id}`),
  delete: (id: number) => apiClient.delete(`/api/transcriptions/${id}`),
  upload: (formData: FormData) =>
    apiClient.post("/api/transcribe", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  decrypt: (transcription_id: number, encryption_key: string) =>
    apiClient.post("/api/decrypt", { transcription_id, encryption_key }),
  models: () => apiClient.get("/api/models"),
};
