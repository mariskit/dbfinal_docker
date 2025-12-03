import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET() {
  try {
    const connection = await getConnection();

    // Usar vista optimizada que incluye especialidades
    const [doctors] = await connection.execute(`
      SELECT * FROM vw_DoctorsComplete
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
