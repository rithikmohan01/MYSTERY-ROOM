import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});
api.interceptors.response.use(
  (r) => r.data,
  (e) =>
    Promise.reject(
      new Error(
        e.response?.data?.error?.message || "The service could not be reached.",
      ),
    ),
);
