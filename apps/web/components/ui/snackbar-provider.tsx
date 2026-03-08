"use client";

import { useNotifyStore } from "@/lib/hooks/use-notify";
import {
  ToastProvider,
  ToastViewport,
  Snackbar,
  SnackbarClose,
  SnackbarDescription,
  SnackbarTitle,
} from "@/components/ui/snackbar";

export function SnackbarProvider() {
  const { notifications, dismiss } = useNotifyStore();

  return (
    <ToastProvider>
      {notifications.map((n) => (
        <Snackbar
          key={n.id}
          variant={n.variant}
          open={n.open}
          onOpenChange={(open) => {
            if (!open) dismiss(n.id);
          }}
        >
          <div className="grid gap-1">
            {n.title && <SnackbarTitle>{n.title}</SnackbarTitle>}
            {n.description && (
              <SnackbarDescription>{n.description}</SnackbarDescription>
            )}
          </div>
          <SnackbarClose />
        </Snackbar>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
