import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctor_id");
    const patientId = searchParams.get("patient_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const connection = await getConnection();

    let query = `
      SELECT a.*, 
             p.first_name as patient_first_name, 
             p.last_name as patient_last_name,
             p.phone as patient_phone,
             d.first_name as doctor_first_name, 
             d.last_name as doctor_last_name,
             d.doc_license as doctor_license
      FROM Appointments a
      LEFT JOIN Patients p ON a.patient_id = p.patient_id
      LEFT JOIN Doctors d ON a.doctor_id = d.doctor_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (doctorId) {
      query += " AND a.doctor_id = ?";
      params.push(doctorId);
    }

    if (patientId) {
      query += " AND a.patient_id = ?";
      params.push(patientId);
    }

    if (startDate) {
      query += " AND a.start_datetime >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND a.start_datetime <= ?";
      params.push(endDate);
    }

    query += " ORDER BY a.start_datetime ASC";

    const [appointments] = await connection.execute(query, params);

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const connection = await getConnection();

    // Verificar solapamiento manualmente primero
    const [overlapping] = await connection.execute(
      `SELECT appointment_id FROM Appointments 
       WHERE doctor_id = ? 
       AND status != 'cancelled'
       AND ((start_datetime < ? AND end_datetime > ?) OR (start_datetime < ? AND end_datetime > ?))`,
      [doctor_id, end_datetime, start_datetime, start_datetime, end_datetime]
    );

    if ((overlapping as any[]).length > 0) {
      return NextResponse.json(
        { error: "El médico tiene otra cita en ese horario" },
        { status: 400 }
      );
    }

    // Insertar cita
    const [result] = await connection.execute(
      `INSERT INTO Appointments 
       (patient_id, doctor_id, start_datetime, end_datetime, reason, created_by_user_id, channel) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id,
        doctor_id,
        start_datetime,
        end_datetime,
        reason,
        created_by_user_id,
        channel,
      ]
    );

    const appointmentId = (result as any).insertId;

    // Insertar en historial
    await connection.execute(
      `INSERT INTO AppointmentHistory 
       (appointment_id, event_type, new_value, event_by_user_id) 
       VALUES (?, 'create', ?, ?)`,
      [
        appointmentId,
        `start=${start_datetime}|end=${end_datetime}|reason=${reason}`,
        created_by_user_id,
      ]
    );

    return NextResponse.json({
      message: "Cita creada exitosamente",
      appointment_id: appointmentId,
    });
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
