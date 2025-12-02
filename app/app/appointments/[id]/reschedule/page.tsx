"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppointmentForm from "@/components/AppointmentForm";

export default function RescheduleAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchAppointment();
    }
  }, [params.id]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setAppointment(data);
      } else {
        alert("Error al cargar la cita");
        router.push("/appointments");
      }
    } catch (error) {
      console.error("Error fetching appointment:", error);
      alert("Error al cargar la cita");
      router.push("/appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push("/appointments");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cita no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <AppointmentForm
          appointmentId={appointment.appointment_id}
          initialData={{
            doctor_id: appointment.doctor_id,
            start_datetime: appointment.start_datetime,
            reason: appointment.reason || "",
          }}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}

