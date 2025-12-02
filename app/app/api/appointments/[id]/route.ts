import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await getConnection();

    const [appointments] = await connection.execute(
      `SELECT a.*, 
              p.first_name as patient_first_name, 
              p.last_name as patient_last_name,
              p.phone as patient_phone,
              d.first_name as doctor_first_name, 
              d.last_name as doctor_last_name,
              d.doc_license as doctor_license
       FROM Appointments a
       LEFT JOIN Patients p ON a.patient_id = p.patient_id
       LEFT JOIN Doctors d ON a.doctor_id = d.doctor_id
       WHERE a.appointment_id = ?`,
      [params.id]
    );

    const appointment = (appointments as any[])[0];

    if (!appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status, start_datetime, end_datetime, reason, event_by_user_id } =
      await request.json();
    const connection = await getConnection();

    await connection.beginTransaction();

    try {
      // Obtener cita actual para historial
      const [currentAppointments] = await connection.execute(
        "SELECT * FROM Appointments WHERE appointment_id = ?",
        [params.id]
      );

      const currentAppointment = (currentAppointments as any[])[0];

      if (!currentAppointment) {
        throw new Error("Cita no encontrada");
      }

      // Si se está cambiando la fecha/hora, validar que no haya solapamiento
      if (start_datetime || end_datetime) {
        const newStart = start_datetime || currentAppointment.start_datetime;
        const newEnd = end_datetime || currentAppointment.end_datetime;

        // Verificar solapamiento con otras citas del mismo médico
        const [overlapping] = await connection.execute(
          `SELECT appointment_id FROM Appointments 
           WHERE doctor_id = ? 
           AND appointment_id != ?
           AND status != 'cancelled'
           AND (
             (start_datetime < ? AND end_datetime > ?) OR
             (start_datetime < ? AND end_datetime > ?) OR
             (start_datetime >= ? AND end_datetime <= ?)
           )`,
          [
            currentAppointment.doctor_id,
            params.id,
            newEnd,
            newStart,
            newStart,
            newEnd,
            newStart,
            newEnd,
          ]
        );

        if ((overlapping as any[]).length > 0) {
          throw new Error(
            "El horario seleccionado se solapa con otra cita existente"
          );
        }
      }

      // Actualizar cita
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (status) {
        updateFields.push("status = ?");
        updateValues.push(status);
      }

      if (start_datetime) {
        updateFields.push("start_datetime = ?");
        updateValues.push(start_datetime);
      }

      if (end_datetime) {
        updateFields.push("end_datetime = ?");
        updateValues.push(end_datetime);
      }

      if (reason !== undefined) {
        updateFields.push("reason = ?");
        updateValues.push(reason);
      }

      if (updateFields.length > 0) {
        updateValues.push(params.id);

        await connection.execute(
          `UPDATE Appointments SET ${updateFields.join(
            ", "
          )}, updated_at = CURRENT_TIMESTAMP WHERE appointment_id = ?`,
          updateValues
        );

        // Registrar en historial
        let eventType = "update";
        let oldValue = "";
        let newValue = "";

        if (status && status !== currentAppointment.status) {
          eventType = "status_change";
          oldValue = `status=${currentAppointment.status}`;
          newValue = `status=${status}`;
        } else if (start_datetime || end_datetime) {
          eventType = "reschedule";
          oldValue = `start=${currentAppointment.start_datetime}|end=${currentAppointment.end_datetime}`;
          newValue = `start=${
            start_datetime || currentAppointment.start_datetime
          }|end=${end_datetime || currentAppointment.end_datetime}`;
        }

        await connection.execute(
          `INSERT INTO AppointmentHistory 
           (appointment_id, event_type, old_value, new_value, event_by_user_id) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            params.id,
            eventType,
            oldValue,
            newValue,
            event_by_user_id || currentAppointment.created_by_user_id,
          ]
        );
      }

      await connection.commit();

      return NextResponse.json({
        message: "Cita actualizada exitosamente",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await getConnection();

    await connection.beginTransaction();

    try {
      // Registrar en historial antes de eliminar
      const [appointment] = await connection.execute(
        "SELECT * FROM Appointments WHERE appointment_id = ?",
        [params.id]
      );

      if ((appointment as any[]).length === 0) {
        return NextResponse.json(
          { error: "Cita no encontrada" },
          { status: 404 }
        );
      }

      // Insertar en historial
      await connection.execute(
        'INSERT INTO AppointmentHistory (appointment_id, event_type, event_by_user_id) VALUES (?, "delete", ?)',
        [params.id, 1] // 1 sería el ID del usuario admin
      );

      // Eliminar cita
      await connection.execute(
        "DELETE FROM Appointments WHERE appointment_id = ?",
        [params.id]
      );

      await connection.commit();

      return NextResponse.json({
        message: "Cita eliminada exitosamente",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
