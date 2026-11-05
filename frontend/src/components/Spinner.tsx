/** A ring that turns while the server works. With reduced motion it turns slowly instead of stopping. */
export function Spinner({ className = 'size-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`shrink-0 animate-spin motion-reduce:[animation-duration:2.4s] ${className}`}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M17.5 10A7.5 7.5 0 0 0 10 2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
