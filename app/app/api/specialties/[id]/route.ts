import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description } = await request.json();
    const connection = await getConnection();

    await connection.execute(
      "UPDATE Specialties SET name = ?, description = ? WHERE specialty_id = ?",
      [name, description || null, params.id]
    );

    return NextResponse.json({
      message: "Especialidad actualizada exitosamente",
    });
  } catch (error: any) {
    console.error("Error updating specialty:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await getConnection();
    
    await connection.execute(
      "DELETE FROM Specialties WHERE specialty_id = ?",
      [params.id]
    );

    return NextResponse.json({
      message: "Especialidad eliminada exitosamente",
    });
  } catch (error: any) {
    console.error("Error deleting specialty:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

