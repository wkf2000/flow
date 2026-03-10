import { SlidersHorizontal } from 'lucide-react';
import { ComingSoonPage } from '../components/common/ComingSoonPage';

export default function Screener() {
  return (
    <ComingSoonPage
      icon={SlidersHorizontal}
      title="Screener"
      description="Screen stocks by technical and fundamental criteria."
    />
  );
}
