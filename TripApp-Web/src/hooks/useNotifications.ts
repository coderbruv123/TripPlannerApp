import { useEffect, useState } from "react";
import api from "../api/axiosInstance";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationState = {
  notifications: NotificationItem[];
  unread: number;
  markAllRead: () => void;
};

export function useNotifications(
  enabled: boolean
): NotificationState {
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    api
      .get<{ unread: number; items: NotificationItem[] }>(
        "/notifications"
      )
      .then((res) => {
        if (!active) return;
        setNotifications(res.data.items || []);
        setUnread(res.data.unread || 0);
      })
      .catch((error) =>
        console.error("Notifications failed:", error)
      );

    return () => {
      active = false;
    };
  }, [enabled]);

  const markAllRead = () => {
    if (unread === 0) return;

    api
      .post("/notifications/read")
      .then(() => {
        setUnread(0);
        setNotifications((current) =>
          current.map((n) => ({ ...n, isRead: true }))
        );
      })
      .catch((error) =>
        console.error("Mark read failed:", error)
      );
  };

  return { notifications, unread, markAllRead };
}
