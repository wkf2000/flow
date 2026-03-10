import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface ComingSoonPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoonPage({ icon: Icon, title, description }: ComingSoonPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="text-center py-12 px-8 max-w-sm">
        <Icon className="h-12 w-12 text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-50 mb-2">{title} Coming Soon</h2>
        <p className="text-sm text-slate-400">{description}</p>
      </Card>
    </div>
  );
}
