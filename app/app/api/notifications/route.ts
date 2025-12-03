import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: Request) {
  const startTime = Date.now();
  console.log("[NOTIFICATIONS API] GET - Iniciando consulta de notificaciones");
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const isRead = searchParams.get("is_read");

    console.log("[NOTIFICATIONS API] GET - Parámetros recibidos:", {
      userId,
      isRead,
      url: request.url,
    });

    if (!userId) {
      console.error("[NOTIFICATIONS API] GET - Error: user_id es requerido");
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    // Para todas las notificaciones, usar consulta optimizada
    let query = `
      SELECT n.*, 
             a.appointment_id,
             a.start_datetime,
             a.status as appointment_status
      FROM Notifications n
      LEFT JOIN Appointments a ON n.appointment_id = a.appointment_id
      WHERE n.user_id = ?
    `;
    const params: any[] = [userId];

    if (isRead !== null && (isRead === "false" || isRead === "0")) {
      query += " AND n.is_read = 0";
      console.log("[NOTIFICATIONS API] GET - Filtro: solo no leídas");
    } else if (isRead === "true" || isRead === "1") {
      query += " AND n.is_read = 1";
      console.log("[NOTIFICATIONS API] GET - Filtro: solo leídas");
    } else {
      console.log("[NOTIFICATIONS API] GET - Sin filtro de lectura, obteniendo todas");
    }

    query += " ORDER BY n.created_at DESC LIMIT 100";

    console.log("[NOTIFICATIONS API] GET - Ejecutando query:", {
      query: query.substring(0, 100) + "...",
      params,
    });

    const notifications = await executeQuery<any[]>(query, params);

    console.log("[NOTIFICATIONS API] GET - Resultados de BD:", {
      cantidad: notifications?.length || 0,
      tipo: typeof notifications,
      esArray: Array.isArray(notifications),
      primeras3: notifications?.slice(0, 3),
    });

    // Convertir is_read de 0/1 a boolean y asegurar formato correcto
    const formattedNotifications = (notifications || []).map((n: any) => {
      const originalIsRead = n.is_read;
      const booleanIsRead = Boolean(n.is_read);
      console.log(`[NOTIFICATIONS API] GET - Conversión is_read: ${originalIsRead} (${typeof originalIsRead}) -> ${booleanIsRead} (${typeof booleanIsRead})`, {
        notification_id: n.notification_id,
        original: originalIsRead,
        converted: booleanIsRead,
      });
      
      return {
        ...n,
        is_read: booleanIsRead,
      };
    });

    // Calcular conteo de no leídas
    const unreadCount = formattedNotifications.filter((n: any) => !n.is_read).length;

    const responseData = {
      notifications: formattedNotifications,
      unread_count: unreadCount,
    };

    const duration = Date.now() - startTime;
    console.log("[NOTIFICATIONS API] GET - Respuesta exitosa:", {
      total_notifications: formattedNotifications.length,
      unread_count: unreadCount,
      duration_ms: duration,
      data_structure: {
        has_notifications: Array.isArray(responseData.notifications),
        notifications_length: responseData.notifications?.length,
        has_unread_count: typeof responseData.unread_count === "number",
      },
    });

    return NextResponse.json(responseData);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[NOTIFICATIONS API] GET - Error completo:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      duration_ms: duration,
    });
    
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        notifications: [],
        unread_count: 0,
        debug: {
          message: error.message,
          duration_ms: duration,
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const startTime = Date.now();
  console.log("[NOTIFICATIONS API] PUT - Iniciando actualización de notificación");
  
  try {
    const body = await request.json();
    const { notification_id, is_read } = body;
    
    console.log("[NOTIFICATIONS API] PUT - Datos recibidos:", {
      notification_id,
      is_read,
      tipo_is_read: typeof is_read,
      body_completo: body,
    });

    if (!notification_id) {
      console.error("[NOTIFICATIONS API] PUT - Error: notification_id es requerido");
      return NextResponse.json(
        { error: "notification_id es requerido" },
        { status: 400 }
      );
    }

    const isReadValue = is_read ? 1 : 0;
    console.log("[NOTIFICATIONS API] PUT - Actualizando notificación:", {
      notification_id,
      is_read_original: is_read,
      is_read_db: isReadValue,
    });

    await executeQuery(
      "UPDATE Notifications SET is_read = ? WHERE notification_id = ?",
      [isReadValue, notification_id]
    );

    const duration = Date.now() - startTime;
    console.log("[NOTIFICATIONS API] PUT - Actualización exitosa:", {
      notification_id,
      is_read: isReadValue,
      duration_ms: duration,
    });

    return NextResponse.json({
      message: "Notificación actualizada exitosamente",
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[NOTIFICATIONS API] PUT - Error completo:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      duration_ms: duration,
    });
    
    return NextResponse.json(
      { 
        error: error.message || "Error interno del servidor",
        debug: {
          message: error.message,
          duration_ms: duration,
        },
      },
      { status: 500 }
    );
  }
}
