import { API_ENDPOINTS } from "./constants";
import { Appointment, DoctorSchedule } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface ApiConfig {
  baseURL?: string;
  headers?: Record<string, string>;
}

class ApiService {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(config: ApiConfig = {}) {
    this.baseURL = config.baseURL || API_BASE;
    this.headers = {
      "Content-Type": "application/json",
      ...config.headers,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`,
        }));
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  // Auth
  async login(credentials: { email: string; password: string }) {
    return this.request<{ token: string; user: any }>(
      API_ENDPOINTS.AUTH.LOGIN,
      {
        method: "POST",
        body: JSON.stringify(credentials),
      }
    );
  }

  async register(data: any) {
    return this.request(API_ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  // Appointments
  async getAppointments(params?: Record<string, any>): Promise<Appointment[]> {
    const queryString = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<Appointment[]>(
      `${API_ENDPOINTS.APPOINTMENTS.BASE}${queryString}`
    );
  }

  async createAppointment(data: any) {
    return this.request(API_ENDPOINTS.APPOINTMENTS.BASE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAppointment(id: number, data: any) {
    return this.request(`${API_ENDPOINTS.APPOINTMENTS.BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteAppointment(id: number) {
    return this.request(`${API_ENDPOINTS.APPOINTMENTS.BASE}/${id}`, {
      method: "DELETE",
    });
  }

  async getDoctorSchedule(doctorId: number, date: string) {
    return this.request(
      `${API_ENDPOINTS.APPOINTMENTS.SCHEDULE}?doctor_id=${doctorId}&date=${date}`
    );
  }

  // Doctors
  async getDoctors() {
    return this.request(API_ENDPOINTS.DOCTORS);
  }

  async getDoctorSchedules(doctorId: number): Promise<DoctorSchedule[]> {
    return this.request<DoctorSchedule[]>(
      `${API_ENDPOINTS.DOCTORS}/${doctorId}/schedules`
    );
  }

  // Patients
  async getPatients() {
    return this.request(API_ENDPOINTS.PATIENTS);
  }

  // Users
  async getUsers() {
    return this.request(API_ENDPOINTS.USERS);
  }

  async updateUserRole(userId: number, role: string) {
    return this.request(API_ENDPOINTS.USERS, {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, role }),
    });
  }

  // Método para setear token de autenticación
  setAuthToken(token: string) {
    this.headers["Authorization"] = `Bearer ${token}`;
  }

  // Método para limpiar token
  clearAuthToken() {
    delete this.headers["Authorization"];
  }
}

// Instancia global del servicio API
export const api = new ApiService();
