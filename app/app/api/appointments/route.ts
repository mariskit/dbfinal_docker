import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET(request: Request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctor_id");
    const patientId = searchParams.get("patient_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const status = searchParams.get("status");
    const specialtyId = searchParams.get("specialty_id");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    connection = await getConnection();

    // Construir consulta usando vista optimizada
    let query: string;
    const params: any[] = [];

    // Si hay filtro por especialidad, necesitamos JOIN con DoctorSpecialties
    if (specialtyId) {
      query = `
        SELECT DISTINCT v.* 
        FROM vw_AppointmentsComplete v
        JOIN DoctorSpecialties ds ON v.doctor_id = ds.doctor_id
        WHERE ds.specialty_id = ?
      `;
      params.push(parseInt(specialtyId));
    } else {
      // Sin filtro de especialidad, usar vista directamente
      query = `SELECT * FROM vw_AppointmentsComplete v WHERE 1=1`;
    }

    // Agregar filtros adicionales usando el alias v
    if (doctorId) {
      query += " AND v.doctor_id = ?";
      params.push(parseInt(doctorId));
    }

    if (patientId) {
      query += " AND v.patient_id = ?";
      params.push(parseInt(patientId));
    }

    if (status) {
      query += " AND v.status = ?";
      params.push(status);
    }

    if (startDate) {
      query += " AND DATE(v.start_datetime) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND DATE(v.start_datetime) <= ?";
      params.push(endDate);
    }

    if (year) {
      query += " AND YEAR(v.start_datetime) = ?";
      params.push(parseInt(year));
    }

    if (month) {
      query += " AND MONTH(v.start_datetime) = ?";
      params.push(parseInt(month));
    }

    query += " ORDER BY v.start_datetime DESC";

    const [appointments] = await connection.execute(query, params);

    return NextResponse.json(appointments);
  } catch (error: any) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function POST(request: Request) {
  let connection;
  try {
    const {
      patient_id,
      doctor_id,
      start_datetime,
      end_datetime,
      reason,
      created_by_user_id,
      channel,
    } = await request.json();
    
    connection = await getConnection();

    // Usar procedimiento almacenado para crear cita (incluye validaciones y notificaciones automáticas)
    try {
      const [results]: any = await connection.query(
        `CALL sp_CreateAppointment(?, ?, ?, ?, ?, ?, ?)`,
        [
          patient_id,
          doctor_id,
          start_datetime,
          end_datetime,
          reason || null,
          created_by_user_id,
          channel || "web",
        ]
      );

      // Los procedimientos almacenados retornan múltiples result sets
      // El primer result set contiene el appointment_id
      const appointmentId = results[0]?.[0]?.appointment_id;

      if (!appointmentId) {
        throw new Error("No se pudo crear la cita");
      }

      return NextResponse.json({
        message: "Cita creada exitosamente",
        appointment_id: appointmentId,
      });
    } catch (spError: any) {
      // Si el procedimiento falla, intentar crear manualmente con validaciones
      console.warn("Stored procedure failed, falling back to manual creation:", spError);
      
      // Verificar solapamiento usando función
      const [overlapCheck]: any = await connection.query(
        `SELECT fn_HasOverlap(?, ?, ?, NULL) AS has_overlap`,
        [doctor_id, start_datetime, end_datetime]
      );

      if (overlapCheck[0]?.has_overlap) {
        return NextResponse.json(
          { error: "El médico tiene otra cita en ese horario" },
          { status: 400 }
        );
      }

      // Insertar cita manualmente (los triggers manejarán el resto)
      const [result]: any = await connection.query(
        `INSERT INTO Appointments 
         (patient_id, doctor_id, start_datetime, end_datetime, reason, created_by_user_id, channel) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          patient_id,
          doctor_id,
          start_datetime,
          end_datetime,
          reason || null,
          created_by_user_id,
          channel || "web",
        ]
      );

      return NextResponse.json({
        message: "Cita creada exitosamente",
        appointment_id: result.insertId,
      });
    }
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    
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
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
