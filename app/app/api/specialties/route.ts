import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET() {
  try {
    const connection = await getConnection();

    const [specialties] = await connection.execute(
      "SELECT * FROM Specialties ORDER BY name"
    );

    return NextResponse.json(specialties);
  } catch (error) {
    console.error("Error fetching specialties:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    const [result] = await connection.execute(
      "INSERT INTO Specialties (name, description) VALUES (?, ?)",
      [name, description || null]
    );

    return NextResponse.json({
      message: "Especialidad creada exitosamente",
      specialty_id: (result as any).insertId,
    });
  } catch (error: any) {
    console.error("Error creating specialty:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

