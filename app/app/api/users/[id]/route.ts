import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";
import bcrypt from "bcryptjs";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await getConnection();

    const [users] = await connection.execute(
      `SELECT u.user_id, u.username, u.email, u.role, u.created_at,
              p.first_name, p.last_name, p.birthdate, p.phone, p.address,
              d.first_name as doc_first_name, d.last_name as doc_last_name,
              d.doc_license, d.phone as doc_phone, d.bio
       FROM Users u
       LEFT JOIN Patients p ON u.user_id = p.user_id
       LEFT JOIN Doctors d ON u.user_id = d.user_id
       WHERE u.user_id = ?`,
      [params.id]
    );

    const user = (users as any[])[0];
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
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
    const {
      username,
      email,
      password,
      role,
      first_name,
      last_name,
      birthdate,
      phone,
      address,
      doc_license,
      bio,
    } = await request.json();

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // Actualizar usuario
      let updateUserQuery = "UPDATE Users SET email = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?";
      const updateUserParams: any[] = [email, role, params.id];

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        updateUserQuery = "UPDATE Users SET email = ?, role = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?";
        updateUserParams.splice(2, 0, hashedPassword);
      }

      await connection.execute(updateUserQuery, updateUserParams);

      // Obtener rol actual
      const [currentUsers] = await connection.execute(
        "SELECT role FROM Users WHERE user_id = ?",
        [params.id]
      );
      const currentRole = (currentUsers as any[])[0]?.role;

      // Actualizar o crear perfil según el rol
      if (role === "patient") {
        // Eliminar registro de doctor si existe
        await connection.execute(
          "DELETE FROM Doctors WHERE user_id = ?",
          [params.id]
        );

        // Actualizar o crear paciente
        const [patients] = await connection.execute(
          "SELECT patient_id FROM Patients WHERE user_id = ?",
          [params.id]
        );

        if ((patients as any[]).length > 0) {
          await connection.execute(
            `UPDATE Patients 
             SET first_name = ?, last_name = ?, birthdate = ?, phone = ?, address = ?
             WHERE user_id = ?`,
            [first_name, last_name, birthdate || null, phone || null, address || null, params.id]
          );
        } else {
          await connection.execute(
            `INSERT INTO Patients (user_id, first_name, last_name, birthdate, phone, address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [params.id, first_name, last_name, birthdate || null, phone || null, address || null]
          );
        }
      } else if (role === "doctor") {
        // Eliminar registro de paciente si existe
        await connection.execute(
          "DELETE FROM Patients WHERE user_id = ?",
          [params.id]
        );

        // Actualizar o crear doctor
        const [doctors] = await connection.execute(
          "SELECT doctor_id FROM Doctors WHERE user_id = ?",
          [params.id]
        );

        if ((doctors as any[]).length > 0) {
          await connection.execute(
            `UPDATE Doctors 
             SET first_name = ?, last_name = ?, doc_license = ?, phone = ?, bio = ?
             WHERE user_id = ?`,
            [first_name, last_name, doc_license || null, phone || null, bio || null, params.id]
          );
        } else {
          await connection.execute(
            `INSERT INTO Doctors (user_id, first_name, last_name, doc_license, phone, bio)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [params.id, first_name, last_name, doc_license || null, phone || null, bio || null]
          );
        }
      } else if (role === "admin") {
        // Eliminar registros de paciente y doctor
        await connection.execute("DELETE FROM Patients WHERE user_id = ?", [params.id]);
        await connection.execute("DELETE FROM Doctors WHERE user_id = ?", [params.id]);
      }

      await connection.commit();
      return NextResponse.json({
        message: "Usuario actualizado exitosamente",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("Error updating user:", error);
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
    
    await connection.execute("DELETE FROM Users WHERE user_id = ?", [params.id]);

    return NextResponse.json({
      message: "Usuario eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

