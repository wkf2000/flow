import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Loader2, Download } from 'lucide-react';
import { SearchInput } from '../common/SearchInput';
import { useTickers } from '../../hooks/useTickers';
import { useHealth, useIngest } from '../../hooks/useHealth';
import { useUIStore } from '../../stores/uiStore';

export function TopBar() {
  const navigate = useNavigate();
  const setSidebarMobileOpen = useUIStore((s) => s.setSidebarMobileOpen);

  const { data: tickers } = useTickers();
  const { data: health, isError: healthError } = useHealth();
  const ingest = useIngest();

  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = search.length > 0 && tickers
    ? tickers.filter((t) =>
        t.symbol.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHealthy = health && !healthError;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-30 flex items-center justify-between px-4 bg-surface-secondary border-b border-border-primary">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="md:hidden text-slate-400 hover:text-slate-200 cursor-pointer transition-colors duration-200"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-xl font-bold text-accent">Flow</span>
      </div>

      {/* Center - Search */}
      <div ref={wrapperRef} className="hidden sm:block relative w-full max-w-xs mx-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setDropdownOpen(v.length > 0);
          }}
          placeholder="Search tickers..."
        />
        {dropdownOpen && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-secondary border border-border-primary rounded-lg shadow-xl overflow-hidden">
            {filtered.slice(0, 8).map((t) => (
              <button
                key={t.symbol}
                onClick={() => {
                  navigate(`/chart/${t.symbol}`);
                  setSearch('');
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-surface-tertiary cursor-pointer transition-colors duration-200"
              >
                {t.symbol}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => ingest.mutate()}
          disabled={ingest.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50 cursor-pointer transition-colors duration-200"
        >
          {ingest.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Ingest</span>
        </button>

        <div className="flex items-center gap-1.5" title={isHealthy ? 'API healthy' : 'API unhealthy'}>
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              isHealthy ? 'bg-bullish' : 'bg-bearish'
            }`}
          />
        </div>
      </div>
    </header>
  );
}
