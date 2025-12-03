"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import type { Notification } from "@/lib/types";

export default function PatientNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, loading: authLoading, isPatient } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isPatient)) {
      router.push("/dashboard");
    }
  }, [authLoading, user, isPatient, router]);

  useEffect(() => {
    const userId = user?.id || user?.user_id;
    console.log("[PATIENT NOTIFICATIONS] useEffect - Verificando usuario:", {
      user_object: user,
      user_id: userId,
      user_keys: user ? Object.keys(user) : [],
    });
    
    if (userId) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    const userId = user?.id || user?.user_id;
    console.log("[PATIENT NOTIFICATIONS] fetchNotifications - Iniciando:", {
      user_id: userId,
      user_object: user,
    });
    
    if (!userId) {
      console.error("[PATIENT NOTIFICATIONS] fetchNotifications - No hay user_id");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_id: notificationId,
          is_read: true,
        }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read);
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
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isPatient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Notificaciones de Citas</h1>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="btn-secondary text-sm"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay notificaciones</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`border rounded-lg p-4 ${
                      !notification.is_read
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{notification.title}</h3>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-2">
                          {notification.message}
                        </p>
                        {notification.start_datetime && (
                          <p className="text-sm text-gray-500">
                            Fecha:{" "}
                            {new Date(
                              notification.start_datetime
                            ).toLocaleString("es-ES")}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(
                            notification.created_at
                          ).toLocaleString("es-ES")}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={() =>
                            markAsRead(notification.notification_id)
                          }
                          className="ml-4 text-sm text-blue-600 hover:text-blue-800"
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

