interface Props {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
}

export default function Pagination({
  total,
  limit,
  offset,
  onChange,
}: Props) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  return (
    <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <button
        type="button"
        className="pagination-btn btn-secondary"
        disabled={offset === 0}
        onClick={() => onChange(offset - limit)}
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
        disabled={offset + limit >= total}
        onClick={() => onChange(offset + limit)}
        style={{ padding: "8px 16px", fontSize: 14 }}
      >
        Next ▶
      </button>
    </div>
  );
}
