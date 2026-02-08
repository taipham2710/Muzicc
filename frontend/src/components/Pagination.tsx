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
    <div>
      <button
        disabled={offset === 0}
        onClick={() => onChange(offset - limit)}
      >
        {"<"}
      </button>

      <span>
        Page {currentPage} / {totalPages}
      </span>

      <button
        disabled={offset + limit >= total}
        onClick={() => onChange(offset + limit)}
      >
        {">"}
      </button>
    </div>
  );
}
