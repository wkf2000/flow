import { Briefcase } from 'lucide-react';
import { Card } from '../components/common/Card';

export default function Portfolio() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="text-center py-12 px-8 max-w-sm">
        <Briefcase className="h-12 w-12 text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-50 mb-2">Portfolio Coming Soon</h2>
        <p className="text-sm text-slate-400">
          Track your holdings, monitor P&L, and view allocation breakdowns.
        </p>
      </Card>
    </div>
  );
}
