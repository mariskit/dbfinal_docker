export const ROLES = {
  ADMIN: "admin",
  DOCTOR: "doctor",
  PATIENT: "patient",
} as const;

export const APPOINTMENT_STATUS = {
  SCHEDULED: "scheduled",
  CONFIRMED: "confirmed",
  ATTENDED: "attended",
  CANCELLED: "cancelled",
  RESCHEDULED: "rescheduled",
} as const;

export const APPOINTMENT_CHANNELS = {
  IN_PERSON: "presencial",
  VIRTUAL: "virtual",
  PHONE: "telefono",
} as const;

export const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
];

export const SPECIALTIES = [
  "Cardiología",
  "Pediatría",
  "Medicina General",
  "Dermatología",
  "Ginecología",
  "Oftalmología",
  "Ortopedia",
  "Psiquiatría",
  "Neurología",
  "Endocrinología",
];

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
  },
  APPOINTMENTS: {
    BASE: "/api/appointments",
    SCHEDULE: "/api/appointments/schedule",
  },
  DOCTORS: "/api/doctors",
  PATIENTS: "/api/patients",
  USERS: "/api/users",
};

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_DATA: "user_data",
  THEME: "theme",
};

export const QUERY_KEYS = {
  APPOINTMENTS: "appointments",
  DOCTORS: "doctors",
  PATIENTS: "patients",
  USERS: "users",
  SCHEDULES: "schedules",
};
