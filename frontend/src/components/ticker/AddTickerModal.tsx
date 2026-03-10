import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useAddTicker } from '../../hooks/useTickers';

interface AddTickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTickerModal({ isOpen, onClose }: AddTickerModalProps) {
  const [symbol, setSymbol] = useState('');
  const [error, setError] = useState('');
  const { mutateAsync, isPending } = useAddTicker();

  const handleClose = useCallback(() => {
    setSymbol('');
    setError('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed || !/^[A-Z]{1,5}$/.test(trimmed)) {
      setError('Enter a valid ticker symbol (1-5 letters)');
      return;
    }

    try {
      await mutateAsync(trimmed);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ticker');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-surface-secondary border border-border-primary rounded-xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-50">Add Ticker</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200 cursor-pointer transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
            maxLength={5}
            className="w-full bg-surface-primary border border-border-primary rounded-lg px-3 py-2 text-slate-50 placeholder-slate-500 focus:outline-none focus:border-accent transition-colors duration-200 uppercase font-mono mb-3"
            autoFocus
          />

          {error && (
            <p className="text-bearish text-sm mb-3">{error}</p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white rounded-lg px-4 py-2 cursor-pointer transition-colors duration-200"
            >
              {isPending ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
