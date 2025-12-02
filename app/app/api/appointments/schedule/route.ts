import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctor_id");
    const date = searchParams.get("date");
    const excludeAppointmentId = searchParams.get("exclude_appointment_id");

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: "Doctor ID y fecha son requeridos" },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    // Obtener el día de la semana de la fecha (0=domingo, 1=lunes, ..., 6=sábado)
    const dateObj = new Date(date);
    const weekday = dateObj.getDay();

    // Obtener horario del doctor para ese día específico
    const [schedules] = await connection.execute(
      `SELECT * FROM DoctorSchedules WHERE doctor_id = ? AND weekday = ?`,
      [doctorId, weekday]
    );

    // Obtener citas existentes para la fecha, excluyendo la cita actual si se está reprogramando
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;

    let appointmentsQuery = `SELECT start_datetime, end_datetime 
       FROM Appointments 
       WHERE doctor_id = ? 
       AND start_datetime BETWEEN ? AND ?
       AND status != 'cancelled'`;
    
    const queryParams: any[] = [doctorId, startDate, endDate];
    
    if (excludeAppointmentId) {
      appointmentsQuery += ` AND appointment_id != ?`;
      queryParams.push(excludeAppointmentId);
    }

    const [appointments] = await connection.execute(
      appointmentsQuery,
      queryParams
    );

    return NextResponse.json({
      schedules,
      appointments,
      date,
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { doctor_id, weekday, start_time, end_time, slot_duration_min } =
      await request.json();
    const connection = await getConnection();

    // Verificar si ya existe un horario para ese día
    const [existing] = await connection.execute(
      "SELECT schedule_id FROM DoctorSchedules WHERE doctor_id = ? AND weekday = ?",
      [doctor_id, weekday]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: "Ya existe un horario para este día" },
        { status: 400 }
      );
    }

    // Insertar nuevo horario
    const [result] = await connection.execute(
      `INSERT INTO DoctorSchedules 
       (doctor_id, weekday, start_time, end_time, slot_duration_min) 
       VALUES (?, ?, ?, ?, ?)`,
      [doctor_id, weekday, start_time, end_time, slot_duration_min || 30]
    );

    return NextResponse.json({
      message: "Horario agregado exitosamente",
      schedule_id: (result as any).insertId,
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
