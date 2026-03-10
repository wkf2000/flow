interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'bullish' | 'bearish';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-accent/20 text-accent',
  bullish: 'bg-bullish/20 text-bullish',
  bearish: 'bg-bearish/20 text-bearish',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
