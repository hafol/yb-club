"use client";
import { Toaster as Sonner } from "sonner";

export const ToastProvider = () => {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          background: "rgba(23, 23, 23, 0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#fff",
          borderRadius: "1.25rem",
          padding: "1rem 1.25rem",
          fontSize: "0.875rem",
          fontWeight: "600",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        },
        className: "liquid-glass-toast",
      }}
    />
  );
};
