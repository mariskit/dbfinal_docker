"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import type { Notification } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    const userId = user?.id || user?.user_id;
    console.log("[NOTIFICATIONS DROPDOWN] fetchNotifications - Iniciando", {
      user_id: userId,
      user_object: user,
      isAuthenticated,
      has_user: !!user,
      user_keys: user ? Object.keys(user) : [],
    });

    if (!userId || !isAuthenticated) {
      console.log("[NOTIFICATIONS DROPDOWN] fetchNotifications - Saltando: usuario no válido");
      return;
    }
    
    try {
      setLoading(true);
      console.log("[NOTIFICATIONS DROPDOWN] fetchNotifications - Estado: loading = true");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn("[NOTIFICATIONS DROPDOWN] fetchNotifications - Timeout alcanzado (5s)");
        controller.abort();
      }, 5000);
      
      const url = `/api/notifications?user_id=${userId}`;
      console.log("[NOTIFICATIONS DROPDOWN] fetchNotifications - Haciendo fetch a:", url);
      
      const response = await fetch(url, { signal: controller.signal });
      
      clearTimeout(timeoutId);
      
      console.log("[NOTIFICATIONS DROPDOWN] fetchNotifications - Respuesta recibida:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("[NOTIFICATIONS DROPDOWN] fetchNotifications - Datos recibidos:", {
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
        
        console.log("[NOTIFICATIONS DROPDOWN] fetchNotifications - Lista procesada:", {
          cantidad: notificationsList.length,
          tipo: typeof notificationsList,
          es_array: Array.isArray(notificationsList),
          primer_item: notificationsList[0] || null,
        });
        
        // Asegurar que is_read sea boolean
        notificationsList = notificationsList.map((n: any, index: number) => {
          const original = n.is_read;
          const converted = Boolean(n.is_read);
          
          if (index < 3) {
            console.log(`[NOTIFICATIONS DROPDOWN] fetchNotifications - Item ${index}:`, {
              notification_id: n.notification_id,
              is_read_original: original,
              is_read_tipo: typeof original,
              is_read_convertido: converted,
              is_read_tipo_convertido: typeof converted,
            });
          }
          
          return {
            ...n,
            is_read: converted,
          };
        });
        
        console.log("[NOTIFICATIONS DROPDOWN] fetchNotifications - Notificaciones finales:", {
          total: notificationsList.length,
          unread: notificationsList.filter((n: Notification) => !n.is_read).length,
        });
        
        setNotifications(notificationsList);
        const unread = notificationsList.filter(
          (n: Notification) => !n.is_read
        ).length;
        setUnreadCount(unread);
        
        console.log("[NOTIFICATIONS DROPDOWN] fetchNotifications - Estado actualizado:", {
          notifications_count: notificationsList.length,
          unread_count: unread,
        });
      } else {
        const errorText = await response.text();
        console.error("[NOTIFICATIONS DROPDOWN] fetchNotifications - Error en respuesta:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error: any) {
      console.error("[NOTIFICATIONS DROPDOWN] fetchNotifications - Error capturado:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        es_abort: error.name === 'AbortError',
      });
      
      if (error.name !== 'AbortError') {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
      console.log("[NOTIFICATIONS DROPDOWN] fetchNotifications - Finalizado, loading = false");
    }
  }, [user?.id, user?.user_id, isAuthenticated]);

  useEffect(() => {
    const userId = user?.id || user?.user_id;
    console.log("[NOTIFICATIONS DROPDOWN] useEffect - Verificando autenticación:", {
      isAuthenticated,
      user_id: userId,
      user_object: user,
      has_user: !!user,
      user_keys: user ? Object.keys(user) : [],
    });

    if (!isAuthenticated || !userId) {
      console.log("[NOTIFICATIONS DROPDOWN] useEffect - No autenticado, limpiando estado");
      setNotifications([]);
      setUnreadCount(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log("[NOTIFICATIONS DROPDOWN] useEffect - Autenticado, cargando notificaciones iniciales");
    // Cargar notificaciones inicialmente
    fetchNotifications();
    
    console.log("[NOTIFICATIONS DROPDOWN] useEffect - Configurando intervalo de 60s");
    // Actualizar notificaciones cada 60 segundos (aumentado de 30 para reducir carga)
    intervalRef.current = setInterval(() => {
      console.log("[NOTIFICATIONS DROPDOWN] useEffect - Intervalo ejecutado, recargando notificaciones");
      fetchNotifications();
    }, 60000);
    
    return () => {
      console.log("[NOTIFICATIONS DROPDOWN] useEffect - Cleanup, limpiando intervalo");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, user?.user_id]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const markAsRead = async (notificationId: number) => {
    console.log("[NOTIFICATIONS DROPDOWN] markAsRead - Iniciando:", {
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

      console.log("[NOTIFICATIONS DROPDOWN] markAsRead - Respuesta:", {
        status: response.status,
        ok: response.ok,
      });

      if (response.ok) {
        console.log("[NOTIFICATIONS DROPDOWN] markAsRead - Éxito, recargando notificaciones");
        fetchNotifications();
      } else {
        const errorData = await response.json();
        console.error("[NOTIFICATIONS DROPDOWN] markAsRead - Error:", errorData);
      }
    } catch (error) {
      console.error("[NOTIFICATIONS DROPDOWN] markAsRead - Error capturado:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    console.log("[NOTIFICATIONS DROPDOWN] markAllAsRead - Iniciando:", {
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
      console.log("[NOTIFICATIONS DROPDOWN] markAllAsRead - Todas marcadas, recargando");
      fetchNotifications();
    } catch (error) {
      console.error("[NOTIFICATIONS DROPDOWN] markAllAsRead - Error:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log("[NOTIFICATIONS DROPDOWN] handleNotificationClick:", {
      notification_id: notification.notification_id,
      is_read: notification.is_read,
      appointment_id: notification.appointment_id,
    });

    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }
    if (notification.appointment_id) {
      router.push(`/appointments/${notification.appointment_id}`);
      setIsOpen(false);
    }
  };

  if (!isAuthenticated || !user) {
    console.log("[NOTIFICATIONS DROPDOWN] Render - No renderizando: no autenticado");
    return null;
  }

  console.log("[NOTIFICATIONS DROPDOWN] Render - Renderizando dropdown:", {
    notifications_count: notifications.length,
    unread_count: unreadCount,
    is_open: isOpen,
    loading,
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          console.log("[NOTIFICATIONS DROPDOWN] Button click:", {
            is_open_actual: isOpen,
            nuevo_estado: !isOpen,
          });
          setIsOpen(!isOpen);
          if (!isOpen) {
            console.log("[NOTIFICATIONS DROPDOWN] Button click - Abriendo, recargando notificaciones");
            fetchNotifications(); // Recargar al abrir
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notificaciones"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 text-xs font-semibold text-white bg-red-500 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg z-50 border border-gray-200 max-h-96 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center">
                <div className="loading-spinner mx-auto"></div>
                <p className="text-xs text-gray-500 mt-2">Cargando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-3"
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
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.notification_id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-colors ${
                      !notification.is_read
                        ? "bg-blue-50 hover:bg-blue-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className={`text-sm font-semibold ${
                              !notification.is_read
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(notification.created_at, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  router.push("/dashboard/notifications");
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
