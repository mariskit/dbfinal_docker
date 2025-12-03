import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function POST(request: Request) {
  try {
    const {
      appointment_id,
      new_start_datetime,
      new_end_datetime,
      event_by_user_id,
      notes,
    } = await request.json();

    const connection = await getConnection();

    // Usar procedimiento almacenado para reprogramar (incluye validaciones y notificaciones)
    try {
      await connection.query(
        `CALL sp_RescheduleAppointment(?, ?, ?, ?, ?)`,
        [
          appointment_id,
          new_start_datetime,
          new_end_datetime,
          event_by_user_id || null,
          notes || null,
        ]
      );

      return NextResponse.json({
        message: "Cita reprogramada exitosamente",
      });
    } catch (spError: any) {
      // Si el procedimiento falla, usar lógica manual
      console.warn("Stored procedure failed, falling back to manual reschedule:", spError);
      
      await connection.beginTransaction();

      try {
        // Obtener datos actuales
        const [appointments]: any = await connection.query(
          "SELECT doctor_id, patient_id, start_datetime, end_datetime FROM Appointments WHERE appointment_id = ?",
          [appointment_id]
        );

        const appointment = appointments[0];
        if (!appointment) {
          throw new Error("Cita no encontrada");
        }

        // Verificar solapamiento usando función
        const [overlapCheck]: any = await connection.query(
          `SELECT fn_HasOverlap(?, ?, ?, ?) AS has_overlap`,
          [appointment.doctor_id, new_start_datetime, new_end_datetime, appointment_id]
        );

        if (overlapCheck[0]?.has_overlap) {
          throw new Error("El médico tiene otra cita en el nuevo horario (solapamiento)");
        }

        // Actualizar cita (los triggers manejarán historial y notificaciones)
        await connection.query(
          `UPDATE Appointments 
           SET start_datetime = ?, 
               end_datetime = ?, 
               status = 'rescheduled',
               updated_at = CURRENT_TIMESTAMP 
           WHERE appointment_id = ?`,
          [new_start_datetime, new_end_datetime, appointment_id]
        );

        await connection.commit();

        return NextResponse.json({
          message: "Cita reprogramada exitosamente",
        });
      } catch (error: any) {
        await connection.rollback();
        throw error;
      }
    }
  } catch (error: any) {
    console.error("Error rescheduling appointment:", error);
    
    let errorMessage = "Error interno del servidor";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.sqlMessage) {
      errorMessage = error.sqlMessage;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: error.code === "ER_SIGNAL_EXCEPTION" || error.message.includes("solapamiento") ? 400 : 500 }
    );
  }
}
