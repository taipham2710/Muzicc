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
            minWidth: 200,
            maxWidth: 320,
            padding: "8px 12px",
            borderRadius: 4,
            fontSize: 13,
            cursor: "pointer",
            color: "#fff",
            backgroundColor:
              toast.type === "success" ? "#16a34a" : "#dc2626",
            boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
