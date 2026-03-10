interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`bg-surface-tertiary animate-pulse rounded ${className}`} />;
}
