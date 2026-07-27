interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Загрузка...' }: LoadingStateProps) {
  return (
    <div className="flex min-h-[240px] flex-1 items-center justify-center px-5 py-16 text-sm text-text-muted">
      <span className="animate-pulse-soft">{label}</span>
    </div>
  );
}
