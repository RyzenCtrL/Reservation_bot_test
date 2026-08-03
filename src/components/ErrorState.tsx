interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message = 'Не получилось загрузить данные.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center gap-4 px-5 py-16 text-center">
      <p className="text-sm text-text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex min-h-[44px] items-center justify-center rounded-2xl border border-border bg-surface px-6 text-sm font-medium text-text active:bg-surface-2"
      >
        Повторить
      </button>
    </div>
  );
}
