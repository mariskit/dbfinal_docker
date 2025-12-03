import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patient_id");
    const doctorId = searchParams.get("doctor_id");
    const connection = await getConnection();

    // Si se filtra por doctor, usar procedimiento almacenado
    if (doctorId) {
      try {
        const [patients]: any = await connection.query(
          `CALL sp_GetDoctorPatients(?)`,
          [doctorId]
        );
        
        // Los procedimientos almacenados retornan múltiples result sets
        const result = patients[0] || [];
        
        return NextResponse.json(result);
      } catch (spError) {
        console.warn("Stored procedure failed, using view instead:", spError);
        // Continuar con vista normal
      }
    }

    // Usar vista optimizada para obtener pacientes
    let query = `
      SELECT * FROM vw_PatientsComplete WHERE role = 'patient'
    `;
    const params: any[] = [];

    if (patientId) {
      query += " AND patient_id = ?";
      params.push(patientId);
    }

    query += " ORDER BY last_name, first_name";

    const [patients] = await connection.execute(query, params);

    return NextResponse.json(patientId ? (patients as any[])[0] || null : patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user_id, first_name, last_name, birthdate, phone, address } =
      await request.json();
    const connection = await getConnection();

    const [result]: any = await connection.execute(
      `INSERT INTO Patients 
       (user_id, first_name, last_name, birthdate, phone, address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, first_name, last_name, birthdate, phone, address]
    );

    return NextResponse.json({
      message: "Paciente creado exitosamente",
      patient_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
