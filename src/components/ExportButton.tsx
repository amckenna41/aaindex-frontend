interface Props {
  onClick: () => void
  label: string
  className?: string
}

export default function ExportButton({ onClick, label, className = '' }: Props) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
    >
      ↓ {label}
    </button>
  )
}
