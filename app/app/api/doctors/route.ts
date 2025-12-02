import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET() {
  try {
    const connection = await getConnection();

    const [doctors] = await connection.execute(`
      SELECT d.*, u.email, 
             GROUP_CONCAT(s.name) as specialties
      FROM Doctors d
      JOIN Users u ON d.user_id = u.user_id
      LEFT JOIN DoctorSpecialties ds ON d.doctor_id = ds.doctor_id
      LEFT JOIN Specialties s ON ds.specialty_id = s.specialty_id
      WHERE u.role = 'doctor'
      GROUP BY d.doctor_id
    `);

    return NextResponse.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
