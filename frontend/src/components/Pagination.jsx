export default function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="flex items-center gap-4 justify-center mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
      >
        &laquo; Prev
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
      >
        Next &raquo;
      </button>
    </div>
  )
}
