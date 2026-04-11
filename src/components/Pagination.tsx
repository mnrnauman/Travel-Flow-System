interface PaginationProps {
  page: number
  total: number
  limit: number
  onPage: (p: number) => void
}

export default function Pagination({ page, total, limit, onPage }: PaginationProps) {
  const pages = Math.ceil(total / limit)
  if (pages <= 1) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  const getPages = () => {
    const arr: (number | '...')[] = []
    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) arr.push(i)
    } else {
      arr.push(1)
      if (page > 4) arr.push('...')
      for (let i = Math.max(2, page - 2); i <= Math.min(pages - 1, page + 2); i++) arr.push(i)
      if (page < pages - 3) arr.push('...')
      arr.push(pages)
    }
    return arr
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', marginTop: 8 }}>
      <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
        Showing {start}–{end} of {total}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          style={{
            padding: '5px 10px', borderRadius: 6, border: '1px solid var(--gray-200)',
            background: 'white', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer',
            color: page === 1 ? 'var(--gray-300)' : 'var(--gray-700)'
          }}>
          ‹
        </button>
        {getPages().map((p, i) => (
          <button key={i}
            onClick={() => typeof p === 'number' && onPage(p)}
            disabled={p === '...'}
            style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 13, minWidth: 34,
              border: p === page ? 'none' : '1px solid var(--gray-200)',
              background: p === page ? 'var(--primary)' : 'white',
              color: p === page ? 'white' : p === '...' ? 'var(--gray-400)' : 'var(--gray-700)',
              cursor: p === '...' ? 'default' : 'pointer', fontWeight: p === page ? 600 : 400
            }}>
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === pages}
          style={{
            padding: '5px 10px', borderRadius: 6, border: '1px solid var(--gray-200)',
            background: 'white', fontSize: 13, cursor: page === pages ? 'not-allowed' : 'pointer',
            color: page === pages ? 'var(--gray-300)' : 'var(--gray-700)'
          }}>
          ›
        </button>
      </div>
    </div>
  )
}
