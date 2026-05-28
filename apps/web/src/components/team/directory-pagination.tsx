export function DirectoryPagination({
  page,
  perPage,
  totalCount,
  onPageChange,
}: {
  page: number;
  perPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(totalCount / perPage));
  const current = page + 1;
  const shownCount = Math.max(
    0,
    Math.min((page + 1) * perPage, totalCount) - Math.min(page * perPage, totalCount),
  );

  return (
    <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
      <span className="text-lg text-white/70">
        Showing {shownCount} of {totalCount} members
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={current <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-10 w-10 rounded-md border border-white/15 text-white/80 disabled:opacity-40"
        >
          ‹
        </button>
        <span className="min-w-8 rounded-md border border-white/15 bg-white/10 px-3 py-1 text-center text-white">
          {current}
        </span>
        <button
          type="button"
          disabled={current >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="h-10 w-10 rounded-md border border-white/15 text-white/80 disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}
