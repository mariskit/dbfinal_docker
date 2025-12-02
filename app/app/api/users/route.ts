import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";

export async function GET() {
  try {
    const connection = await getConnection();

    const [users] = await connection.execute(`
      SELECT u.user_id, u.username, u.email, u.role, u.created_at,
             p.first_name, p.last_name,
             d.first_name as doc_first_name, d.last_name as doc_last_name
      FROM Users u
      LEFT JOIN Patients p ON u.user_id = p.user_id
      LEFT JOIN Doctors d ON u.user_id = d.user_id
      ORDER BY u.role, u.created_at DESC
    `);

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { user_id, role, active } = await request.json();
    const connection = await getConnection();

    await connection.execute(
      "UPDATE Users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
      [role, user_id]
    );

    return NextResponse.json({
      message: "Usuario actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
