export default function InfoTooltip({ content }: { content: string }) {
    return (
        <div className="relative group">
            {/* Info icon */}
            <svg
                className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                />
            </svg>

            {/* Tooltip */}
            <div
                className="
          absolute z-10
          bottom-full left-1/2 -translate-x-1/2 mb-2
          hidden group-hover:block
          px-3 py-2
          text-[var(--font-size-xs)]
          text-[var(--color-text-primary)]
          bg-[var(--color-bg-elevated)]
          border border-[var(--color-border)]
          rounded-[var(--radius-sm)]
          shadow-lg
          whitespace-nowrap
        "
            >
                {content}
            </div>
        </div>
    );
}
