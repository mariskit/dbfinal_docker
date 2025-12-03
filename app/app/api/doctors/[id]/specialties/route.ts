import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await getConnection();

    const [specialties] = await connection.execute(
      `SELECT s.specialty_id, s.name, s.description
       FROM Specialties s
       INNER JOIN DoctorSpecialties ds ON s.specialty_id = ds.specialty_id
       WHERE ds.doctor_id = ?`,
      [params.id]
    );

    return NextResponse.json(specialties);
  } catch (error) {
    console.error("Error fetching doctor specialties:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { specialty_ids } = await request.json();
    const connection = await getConnection();

    await connection.beginTransaction();

    try {
      // Eliminar todas las especialidades actuales
      await connection.execute(
        "DELETE FROM DoctorSpecialties WHERE doctor_id = ?",
        [params.id]
      );

      // Agregar las nuevas especialidades
      if (specialty_ids && specialty_ids.length > 0) {
        const values = specialty_ids.map((id: number) => [params.id, id]);
        await connection.query(
          "INSERT INTO DoctorSpecialties (doctor_id, specialty_id) VALUES ?",
          [values]
        );
      }

      await connection.commit();
      return NextResponse.json({
        message: "Especialidades actualizadas exitosamente",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("Error updating doctor specialties:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

