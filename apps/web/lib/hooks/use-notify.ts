"use client";

import { create } from "zustand";

type Variant = "default" | "success" | "error" | "warning";

interface Notification {
  id: string;
  title?: string;
  description?: string;
  variant: Variant;
  open: boolean;
}

interface NotifyState {
  notifications: Notification[];
  dismiss: (id: string) => void;
  addNotification: (n: Omit<Notification, "id" | "open">) => void;
}

let counter = 0;

export const useNotifyStore = create<NotifyState>((set) => ({
  notifications: [],

  addNotification: (n) => {
    const id = `notify-${++counter}`;
    set((s) => ({
      notifications: [...s.notifications, { ...n, id, open: true }],
    }));
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((s) => ({
        notifications: s.notifications.filter((item) => item.id !== id),
      }));
    }, 5000);
  },

  dismiss: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, open: false } : n
      ),
    })),
}));

/**
 * Imperative notification function.
 *
 * Usage:
 *   notify.success("Upload complete", "12 records processed");
 *   notify.error("Upload failed", error.message);
 *   notify.warning("Price mismatch detected");
 *   notify("Custom message");
 */
export function notify(description: string, title?: string): void;
export function notify(opts: { title?: string; description?: string; variant?: Variant }): void;
export function notify(
  arg: string | { title?: string; description?: string; variant?: Variant },
  title?: string
) {
  const store = useNotifyStore.getState();
  if (typeof arg === "string") {
    store.addNotification({ description: arg, title, variant: "default" });
  } else {
    store.addNotification({
      title: arg.title,
      description: arg.description,
      variant: arg.variant ?? "default",
    });
  }
}

notify.success = (description: string, title?: string) =>
  useNotifyStore.getState().addNotification({ description, title, variant: "success" });

notify.error = (description: string, title?: string) =>
  useNotifyStore.getState().addNotification({ description, title, variant: "error" });

notify.warning = (description: string, title?: string) =>
  useNotifyStore.getState().addNotification({ description, title, variant: "warning" });
