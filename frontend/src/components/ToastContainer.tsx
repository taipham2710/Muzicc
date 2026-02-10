import { useToastStore } from "../stores/toast.store";

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const remove = useToastStore((state) => state.remove);

  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 80,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 1100,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => remove(toast.id)}
          style={{
            minWidth: 220,
            maxWidth: 340,
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: 14,
            cursor: "pointer",
            color: "#fff",
            backgroundColor: toast.type === "success" ? "var(--primary)" : "var(--danger)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
