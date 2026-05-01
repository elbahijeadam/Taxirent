'use client';
import { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import { citiesApi } from '@/lib/api';
import { City } from '@/types';

interface Props {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CitySearch({ value, onChange, placeholder = 'Rechercher une ville...', className = '' }: Props) {
  const [query, setQuery]           = useState(value);
  const [results, setResults]       = useState<City[]>([]);
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef                = useRef<HTMLDivElement>(null);

  // Keep input in sync when parent clears the value
  useEffect(() => { if (!value) setQuery(''); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      onChange('');
      setResults([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await citiesApi.search(val);
        setResults(res.data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const select = (city: City) => {
    setQuery(city.name);
    onChange(city.name);
    setOpen(false);
    setResults([]);
  };

  const clear = () => {
    setQuery('');
    onChange('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={placeholder}
          className="input pl-9 pr-8 py-2 text-sm w-full"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(city); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-900">{city.name}</span>
                <span className="text-gray-400 text-xs ml-auto">{city.postal_code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && loading && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
          Recherche en cours...
        </div>
      )}
    </div>
  );
}
