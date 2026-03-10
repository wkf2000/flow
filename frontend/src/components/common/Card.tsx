interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  const base = 'bg-surface-secondary border border-border-primary rounded-xl p-4';
  const interactive = onClick
    ? 'cursor-pointer hover:border-border-hover transition-colors duration-200'
    : '';

  return (
    <div className={`${base} ${interactive} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
