interface Props {
  onClick: () => void
  label: string
  className?: string
}

export default function ExportButton({ onClick, label, className = '' }: Props) {
  return (
    <button onClick={onClick} className={`btn-text ${className}`}>
      ↓ {label}
    </button>
  )
}
