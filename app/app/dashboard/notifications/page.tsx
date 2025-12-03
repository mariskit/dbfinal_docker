"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import type { Notification } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, loading: authLoading, isAuthenticated } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    const userId = user?.id || user?.user_id;
    console.log("[NOTIFICATIONS PAGE] useEffect auth check:", {
      authLoading,
      has_user: !!user,
      isAuthenticated,
      user_id: userId,
      user_object: user,
      user_keys: user ? Object.keys(user) : [],
    });

    if (!authLoading && (!user || !isAuthenticated)) {
      console.log("[NOTIFICATIONS PAGE] useEffect - Redirigiendo a login");
      router.push("/login");
    }
  }, [authLoading, user, isAuthenticated, router]);

  const fetchNotifications = useCallback(async () => {
    const userId = user?.id || user?.user_id;
    console.log("[NOTIFICATIONS PAGE] fetchNotifications - Iniciando", {
      user_id: userId,
      user_object: user,
      has_user: !!user,
      user_keys: user ? Object.keys(user) : [],
    });

    if (!userId) {
      console.log("[NOTIFICATIONS PAGE] fetchNotifications - Saltando: no hay user_id");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log("[NOTIFICATIONS PAGE] fetchNotifications - Estado: loading = true, error = null");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn("[NOTIFICATIONS PAGE] fetchNotifications - Timeout alcanzado (10s)");
        controller.abort();
      }, 10000);
      
      const url = `/api/notifications?user_id=${userId}`;
      console.log("[NOTIFICATIONS PAGE] fetchNotifications - Haciendo fetch a:", url);
      
      const startTime = Date.now();
      const response = await fetch(url, { signal: controller.signal });
      const fetchDuration = Date.now() - startTime;
      
      clearTimeout(timeoutId);
      
      console.log("[NOTIFICATIONS PAGE] fetchNotifications - Respuesta recibida:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration_ms: fetchDuration,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[NOTIFICATIONS PAGE] fetchNotifications - Error HTTP:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("[NOTIFICATIONS PAGE] fetchNotifications - Datos JSON recibidos:", {
        tipo: typeof data,
        tiene_notifications: 'notifications' in data,
        tiene_unread_count: 'unread_count' in data,
        es_array_directo: Array.isArray(data),
        data_keys: Object.keys(data),
      });
      
      let notificationsList = Array.isArray(data.notifications) 
        ? data.notifications 
        : Array.isArray(data) 
        ? data 
        : [];
      
      console.log("[NOTIFICATIONS PAGE] fetchNotifications - Lista extraída:", {
        cantidad: notificationsList.length,
        tipo: typeof notificationsList,
        es_array: Array.isArray(notificationsList),
        muestra: notificationsList.slice(0, 2),
      });
      
      // Asegurar que is_read sea boolean
      notificationsList = notificationsList.map((n: any, index: number) => {
        const original = n.is_read;
        const converted = Boolean(n.is_read);
        
        if (index < 5) {
          console.log(`[NOTIFICATIONS PAGE] fetchNotifications - Item ${index}:`, {
            notification_id: n.notification_id,
            title: n.title,
            is_read_original: original,
            is_read_tipo_original: typeof original,
            is_read_convertido: converted,
            is_read_tipo_convertido: typeof converted,
          });
        }
        
        return {
          ...n,
          is_read: converted,
        };
      });
      
      const unread = notificationsList.filter(
        (n: Notification) => !n.is_read
      ).length;
      
      console.log("[NOTIFICATIONS PAGE] fetchNotifications - Resultado final:", {
        total: notificationsList.length,
        unread: unread,
        read: notificationsList.length - unread,
      });
      
      setNotifications(notificationsList);
      setUnreadCount(unread);
      
      console.log("[NOTIFICATIONS PAGE] fetchNotifications - Estado actualizado correctamente");
    } catch (error: any) {
      console.error("[NOTIFICATIONS PAGE] fetchNotifications - Error completo:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        es_abort: error.name === 'AbortError',
      });
      
      if (error.name === 'AbortError') {
        setError("La solicitud tardó demasiado. Por favor, intenta de nuevo.");
      } else {
        setError("Error al cargar las notificaciones. Por favor, recarga la página.");
      }
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      console.log("[NOTIFICATIONS PAGE] fetchNotifications - Finalizado, loading = false");
    }
  }, [user?.id, user?.user_id]);

  useEffect(() => {
    const userId = user?.id || user?.user_id;
    console.log("[NOTIFICATIONS PAGE] useEffect fetch:", {
      user_id: userId,
      user_object: user,
      isAuthenticated,
      authLoading,
      debe_cargar: !!(userId && isAuthenticated && !authLoading),
    });

    if (userId && isAuthenticated && !authLoading) {
      console.log("[NOTIFICATIONS PAGE] useEffect fetch - Condiciones cumplidas, cargando notificaciones");
      fetchNotifications();
    } else {
      console.log("[NOTIFICATIONS PAGE] useEffect fetch - Condiciones NO cumplidas, no cargando");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.user_id, isAuthenticated, authLoading]);

  const markAsRead = async (notificationId: number) => {
    console.log("[NOTIFICATIONS PAGE] markAsRead - Iniciando:", {
      notification_id: notificationId,
    });

    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_id: notificationId,
          is_read: true,
        }),
      });

      console.log("[NOTIFICATIONS PAGE] markAsRead - Respuesta:", {
        status: response.status,
        ok: response.ok,
      });

      if (response.ok) {
        console.log("[NOTIFICATIONS PAGE] markAsRead - Éxito, recargando");
        fetchNotifications();
      } else {
        const errorData = await response.json();
        console.error("[NOTIFICATIONS PAGE] markAsRead - Error:", errorData);
        alert("Error al marcar la notificación como leída");
      }
    } catch (error) {
      console.error("[NOTIFICATIONS PAGE] markAsRead - Error capturado:", error);
      alert("Error al marcar la notificación como leída");
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    console.log("[NOTIFICATIONS PAGE] markAllAsRead - Iniciando:", {
      cantidad_no_leidas: unreadNotifications.length,
    });

    try {
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch("/api/notifications", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              notification_id: n.notification_id,
              is_read: true,
            }),
          })
        )
      );
      console.log("[NOTIFICATIONS PAGE] markAllAsRead - Todas marcadas, recargando");
      fetchNotifications();
    } catch (error) {
      console.error("[NOTIFICATIONS PAGE] markAllAsRead - Error:", error);
      alert("Error al marcar todas como leídas");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log("[NOTIFICATIONS PAGE] handleNotificationClick:", {
      notification_id: notification.notification_id,
      is_read: notification.is_read,
      appointment_id: notification.appointment_id,
    });

    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }
    if (notification.appointment_id) {
      router.push(`/appointments/${notification.appointment_id}`);
    }
  };

  console.log("[NOTIFICATIONS PAGE] Render:", {
    loading,
    authLoading,
    isAuthenticated,
    has_user: !!user,
    notifications_count: notifications.length,
    unread_count: unreadCount,
    error,
  });

  if (authLoading) {
    console.log("[NOTIFICATIONS PAGE] Render - Mostrando spinner de auth");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    console.log("[NOTIFICATIONS PAGE] Render - No autenticado, retornando null");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Mis Notificaciones</h1>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="btn-secondary text-sm"
                  disabled={loading}
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Reintentar
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="loading-spinner"></div>
                <span className="ml-3 text-gray-600">Cargando notificaciones...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-gray-500 text-lg">No hay notificaciones</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      !notification.is_read
                        ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-2">
                          {notification.message}
                        </p>
                        {notification.appointment_id && (
                          <p className="text-sm text-gray-500 mb-2">
                            ID de Cita: {notification.appointment_id}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {formatDate(notification.created_at, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.notification_id);
                          }}
                          className="ml-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
