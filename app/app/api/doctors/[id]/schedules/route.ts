import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await getConnection();

    const [schedules] = await connection.execute(
      "SELECT * FROM DoctorSchedules WHERE doctor_id = ? ORDER BY weekday, start_time",
      [params.id]
    );

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching doctor schedules:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
