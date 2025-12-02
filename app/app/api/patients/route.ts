import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET() {
  try {
    const connection = await getConnection();

    const [patients] = await connection.execute(`
      SELECT p.*, u.email, u.username
      FROM Patients p
      JOIN Users u ON p.user_id = u.user_id
      WHERE u.role = 'patient'
      ORDER BY p.last_name, p.first_name
    `);

    return NextResponse.json(patients);
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

    const [result] = await connection.execute(
      `INSERT INTO Patients 
       (user_id, first_name, last_name, birthdate, phone, address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, first_name, last_name, birthdate, phone, address]
    );

    return NextResponse.json({
      message: "Paciente creado exitosamente",
      patient_id: (result as any).insertId,
    });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
