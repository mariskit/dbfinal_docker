import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await getConnection();

    await connection.execute(
      "DELETE FROM DoctorSchedules WHERE schedule_id = ?",
      [params.id]
    );

    return NextResponse.json({
      message: "Horario eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
