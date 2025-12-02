export interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  role: "admin" | "doctor" | "patient";
  created_at: string;
  updated_at: string;
}

export interface Patient {
  patient_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  birthdate: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  user?: User;
}

export interface Doctor {
  doctor_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  doc_license: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
  specialties?: Specialty[];
  schedules?: DoctorSchedule[];
  user?: User;
}

export interface Specialty {
  specialty_id: number;
  name: string;
  description: string | null;
}

export interface DoctorSchedule {
  schedule_id: number;
  doctor_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_min: number;
}

export interface Appointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  start_datetime: string;
  end_datetime: string;
  status: "scheduled" | "confirmed" | "attended" | "cancelled" | "rescheduled";
  reason: string | null;
  created_by_user_id: number;
  channel: string | null;
  created_at: string;
  updated_at: string;
  patient_first_name?: string;
  patient_last_name?: string;
   doctor_license?: string;
  patient_phone?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface AppointmentHistory {
  history_id: number;
  appointment_id: number;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  event_by_user_id: number | null;
  event_at: string;
  notes: string | null;
}
