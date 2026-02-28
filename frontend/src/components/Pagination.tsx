interface Props {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
  disabled?: boolean;
}

export default function Pagination({
  total,
  limit,
  offset,
  onChange,
  disabled = false,
}: Props) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  const prevOffset = Math.max(0, offset - limit);
  const nextOffset = offset + limit;

  const scrollMainToTop = () => {
    const el = document.querySelector("main");
    // main is a scroll container in AuthLayout
    if (el && "scrollTo" in el) {
      (el as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <button
        type="button"
        className="pagination-btn btn-secondary"
        disabled={disabled || offset === 0}
        onClick={() => {
          onChange(prevOffset);
          scrollMainToTop();
        }}
        style={{ padding: "8px 16px", fontSize: 14 }}
      >
        ◀ Prev
      </button>
      <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
        Page {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        className="pagination-btn btn-secondary"
        disabled={disabled || offset + limit >= total}
        onClick={() => {
          onChange(nextOffset);
          scrollMainToTop();
        }}
        style={{ padding: "8px 16px", fontSize: 14 }}
      >
        Next ▶
      </button>
    </div>
  );
}
