import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Car } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  economy: 'Économique', compact: 'Compacte', midsize: 'Intermédiaire',
  suv: 'SUV', van: 'Van',
  sedan: 'Berline', electric: 'Électrique', hybrid: 'Hybride',
};

const GRADIENT: Record<string, string> = {
  sedan: 'from-slate-800 to-slate-600',
  suv: 'from-emerald-900 to-emerald-700',
  electric: 'from-sky-900 to-sky-700',
  hybrid: 'from-teal-900 to-teal-700',
  economy: 'from-zinc-800 to-zinc-600',
  compact: 'from-zinc-800 to-zinc-600',
  midsize: 'from-zinc-700 to-zinc-500',
  van: 'from-stone-800 to-stone-600',
};

const BADGE: Record<string, string> = {
  sedan: 'bg-slate-600',
  suv: 'bg-emerald-600',
  electric: 'bg-sky-500',
  hybrid: 'bg-teal-600',
  economy: 'bg-zinc-600',
  compact: 'bg-zinc-600',
  midsize: 'bg-zinc-500',
  van: 'bg-stone-600',
};

export default function CarCard({ car }: { car: Car }) {
  return (
    <Link
      href={`/cars/${car.id}`}
      className="card group block hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      {/* Image / Placeholder */}
      <div
        className={`relative h-52 bg-gradient-to-br ${GRADIENT[car.category] || 'from-gray-800 to-gray-600'} overflow-hidden`}
      >
        {car.images && car.images.length > 0 ? (
          <img
            src={car.images[0]}
            alt={`${car.make} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
            <span className="text-8xl opacity-40 mb-3">🚗</span>
            <span className="text-white/30 text-xs tracking-widest uppercase font-medium">{car.make}</span>
          </div>
        )}

        <span
          className={`absolute top-3 left-3 text-white text-xs font-semibold px-3 py-1 rounded-full ${BADGE[car.category] || 'bg-gray-600'}`}
        >
          {CATEGORY_LABELS[car.category] || car.category}
        </span>

        <span className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {car.year}
        </span>

        {!car.is_available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold bg-red-600 px-4 py-2 rounded-full text-sm text-center leading-tight">
              Momentanément indisponible
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-xl leading-tight">
          {car.make} {car.model}
        </h3>
        <p className="text-gray-400 text-sm mt-1">{car.year}</p>
        <div className="mt-5 flex items-center justify-between">
          {car.is_available ? (
            <>
              <span className="text-sm font-medium text-brand-500">Voir le véhicule</span>
              <span className="text-brand-500 group-hover:translate-x-1 transition-transform inline-block">→</span>
            </>
          ) : (
            <span className="text-sm font-semibold text-red-500">Momentanément indisponible</span>
          )}
        </div>
      </div>
    </Link>
  );
}
