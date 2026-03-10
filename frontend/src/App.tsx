import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Chart from './pages/Chart';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import Screener from './pages/Screener';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chart/:symbol?" element={<Chart />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/screener" element={<Screener />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
