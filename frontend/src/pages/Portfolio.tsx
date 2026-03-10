import { Briefcase } from 'lucide-react';
import { ComingSoonPage } from '../components/common/ComingSoonPage';

export default function Portfolio() {
  return (
    <ComingSoonPage
      icon={Briefcase}
      title="Portfolio"
      description="Track your holdings, monitor P&L, and view allocation breakdowns."
    />
  );
}
