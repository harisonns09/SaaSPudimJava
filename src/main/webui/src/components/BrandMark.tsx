export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B45309] text-[#FAF7F2]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4.5 w-4.5"
          aria-hidden="true"
        >
          <path
            d="M5 17.5C5 16.67 5.67 16 6.5 16H17.5C18.33 16 19 16.67 19 17.5C19 18.33 18.33 19 17.5 19H6.5C5.67 19 5 18.33 5 17.5Z"
            fill="currentColor"
            fillOpacity="0.45"
          />
          <path
            d="M6.8 15.5L8.3 8.2C8.6 6.9 9.7 6 11 6H13C14.3 6 15.4 6.9 15.7 8.2L17.2 15.5H6.8Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M8.1 9.5C9.3 10.6 10.4 9.1 12 10.2C13.6 11.3 14.7 9.3 15.9 10.1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight text-[#291D16]">
          PudimFlow
        </span>
      )}
    </div>
  );
}
