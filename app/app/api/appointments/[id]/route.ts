import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await getConnection();

    // Usar vista optimizada para obtener cita completa
    const [appointments] = await connection.execute(
      `SELECT * FROM vw_AppointmentsComplete WHERE appointment_id = ?`,
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

    // Si solo se actualiza el estado, usar procedimiento optimizado
    if (status && !start_datetime && !end_datetime) {
      try {
        await connection.query(
          `CALL sp_UpdateAppointmentStatus(?, ?, ?, ?)`,
          [params.id, status, event_by_user_id || null, null]
        );

        return NextResponse.json({
          message: "Estado de cita actualizado exitosamente",
        });
      } catch (spError: any) {
        console.warn("Stored procedure failed, using direct update:", spError);
        // Fallback: actualizar directamente (los triggers manejarán el resto)
        await connection.query(
          `UPDATE Appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE appointment_id = ?`,
          [status, params.id]
        );
        return NextResponse.json({
          message: "Estado de cita actualizado exitosamente",
        });
      }
    }

    // Si se cambian fechas, usar transacción manual (el trigger validará solapamiento)
    await connection.beginTransaction();

    try {
      // Obtener cita actual usando vista
      const [currentAppointments] = await connection.execute(
        "SELECT * FROM vw_AppointmentsComplete WHERE appointment_id = ?",
        [params.id]
      );

      const currentAppointment = (currentAppointments as any[])[0];

      if (!currentAppointment) {
        throw new Error("Cita no encontrada");
      }

      // Actualizar cita (los triggers validarán automáticamente)
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
      }

      await connection.commit();

      return NextResponse.json({
        message: "Cita actualizada exitosamente",
      });
    } catch (error: any) {
      await connection.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("Error updating appointment:", error);
    
    let errorMessage = "Error interno del servidor";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.sqlMessage) {
      errorMessage = error.sqlMessage;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: error.code === "ER_SIGNAL_EXCEPTION" ? 400 : 500 }
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
