'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { carApi } from '@/lib/api';
import { Car } from '@/types';
import CarCard from '@/components/CarCard';
import CitySearch from '@/components/CitySearch';

const CATEGORIES = [
  { value: '', label: 'Tous' },
  { value: 'sedan', label: 'Berline' },
  { value: 'suv', label: 'SUV' },
  { value: 'hybrid', label: 'Hybride' },
  { value: 'electric', label: 'Électrique' },
];

export default function CarsPage() {
  const [cars, setCars]         = useState<Car[]>([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('');
  const [city, setCity]         = useState('');

  const fetchCars = async (cat: string, cty: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (cat) params.category = cat;
      if (cty) params.city = cty;
      const res = await carApi.list(params);
      setCars(res.data);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCars('', ''); }, []);

  const handleCategory = (val: string) => {
    setCategory(val);
    fetchCars(val, city);
  };

  const handleCity = (val: string) => {
    setCity(val);
    fetchCars(category, val);
  };

  const hasFilters = category || city;

  return (
    <div className="pt-16 min-h-screen">
      {/* Header */}
      <div className="bg-dark-900 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold mb-3">Notre flotte</h1>
          <p className="text-gray-400 text-lg">{cars.length} véhicule{cars.length !== 1 ? 's' : ''} disponible{cars.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* City search */}
          <div className="w-full sm:w-64">
            <CitySearch
              value={city}
              onChange={handleCity}
              placeholder="Filtrer par ville..."
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => handleCategory(c.value)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition border ${
                  category === c.value
                    ? 'bg-dark-900 text-white border-dark-900'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                }`}
              >
                {c.label}
              </button>
            ))}
            {hasFilters && (
              <button
                onClick={() => { setCategory(''); setCity(''); fetchCars('', ''); }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 ml-2"
              >
                <X className="w-3.5 h-3.5" /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Cars grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card h-80 animate-pulse">
                <div className="h-52 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🔍</p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun véhicule trouvé</h3>
            <p className="text-gray-500">Modifiez les filtres pour voir plus de résultats.</p>
            <button
              onClick={() => { setCategory(''); setCity(''); fetchCars('', ''); }}
              className="btn-primary mt-6"
            >
              Voir tous les véhicules
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => <CarCard key={car.id} car={car} />)}
          </div>
        )}
      </div>
    </div>
  );
}
