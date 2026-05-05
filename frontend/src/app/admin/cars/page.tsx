'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, Loader2, Car, CheckCircle,
  XCircle, Pencil, ToggleLeft, ToggleRight, X, Save, ChevronLeft, ChevronRight,
  Trash2, AlertTriangle,
} from 'lucide-react';
import { carApi } from '@/lib/api';
import { formatPrice } from '@/lib/auth';
import toast from 'react-hot-toast';

interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  category: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  doors: number;
  price_per_day: number | string;
  deposit_amount: number | string;
  description: string;
  features: string[];
  city: string;
  is_available: boolean | number;
  images: string[];
}

const CATEGORIES     = ['economy', 'suv', 'hybrid', 'electric', 'luxury', 'minivan'];
const TRANSMISSIONS  = [{ v: 'automatic', l: 'Automatique' }, { v: 'manual', l: 'Manuelle' }];
const FUEL_TYPES     = [{ v: 'petrol', l: 'Essence' }, { v: 'diesel', l: 'Diesel' }, { v: 'electric', l: 'Électrique' }, { v: 'hybrid', l: 'Hybride' }];
const FUEL_LABELS: Record<string, string> = { petrol: 'Essence', diesel: 'Diesel', electric: 'Électrique', hybrid: 'Hybride' };
const TRANS_LABELS: Record<string, string> = { automatic: 'Automatique', manual: 'Manuelle' };
const CAT_LABELS: Record<string, string> = { economy: 'Économique', suv: 'SUV', hybrid: 'Hybride', electric: 'Électrique', luxury: 'Luxe', minivan: 'Minivan' };

const BLANK: Partial<CarData> = {
  make: '', model: '', year: new Date().getFullYear(), color: '',
  license_plate: '', category: 'economy', transmission: 'automatic',
  fuel_type: 'petrol', seats: 5, doors: 4, price_per_day: '',
  deposit_amount: '', description: '', features: [], city: 'Paris', images: [],
};

function AvailBadge({ available }: { available: boolean | number }) {
  return available
    ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Disponible</span>
    : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Indisponible</span>;
}

function CarModal({
  car, onClose, onSaved,
}: {
  car: Partial<CarData> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!car?.id;
  const [form, setForm] = useState<Partial<CarData>>(car ?? BLANK);
  const [featuresStr, setFeaturesStr] = useState((car?.features ?? []).join(', '));
  const [imagesStr, setImagesStr] = useState((car?.images ?? []).join('\n'));
  const [saving, setSaving] = useState(false);

  const set = (k: keyof CarData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.make || !form.model || !form.year || !form.license_plate || !form.price_per_day) {
      toast.error('Remplissez les champs obligatoires');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      features: featuresStr.split(',').map((s) => s.trim()).filter(Boolean),
      images: imagesStr.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (isEdit && car?.id) {
        await carApi.update(car.id, payload);
        toast.success('Véhicule mis à jour');
      } else {
        await carApi.create(payload);
        toast.success('Véhicule créé');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-brand-500" />
            {isEdit ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Marque <span className="text-red-500">*</span></label>
              <input type="text" value={form.make || ''} onChange={set('make')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Renault" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Modèle <span className="text-red-500">*</span></label>
              <input type="text" value={form.model || ''} onChange={set('model')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Trafic" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Année <span className="text-red-500">*</span></label>
              <input type="number" value={form.year || ''} onChange={set('year')} min={2000} max={2030} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Couleur</label>
              <input type="text" value={form.color || ''} onChange={set('color')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Blanc" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Immatriculation <span className="text-red-500">*</span></label>
              <input type="text" value={form.license_plate || ''} onChange={set('license_plate')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="AB-123-CD" />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Catégorie</label>
              <select value={form.category || 'economy'} onChange={set('category')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABELS[c] || c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Transmission</label>
              <select value={form.transmission || 'automatic'} onChange={set('transmission')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {TRANSMISSIONS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Carburant</label>
              <select value={form.fuel_type || 'petrol'} onChange={set('fuel_type')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {FUEL_TYPES.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
              </select>
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Places</label>
              <input type="number" value={form.seats || 5} onChange={set('seats')} min={1} max={9} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Portes</label>
              <input type="number" value={form.doors || 4} onChange={set('doors')} min={2} max={6} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prix/jour (€) <span className="text-red-500">*</span></label>
              <input type="number" value={form.price_per_day || ''} onChange={set('price_per_day')} min={0} step="0.01" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="89.00" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dépôt (€)</label>
              <input type="number" value={form.deposit_amount || ''} onChange={set('deposit_amount')} min={0} step="0.01" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="1500.00" />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ville de disponibilité</label>
            <input type="text" value={form.city || ''} onChange={set('city')} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Paris" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
            <textarea value={form.description || ''} onChange={set('description')} rows={2} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="Description du véhicule..." />
          </div>

          {/* Features */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Équipements <span className="text-gray-400 font-normal">(séparés par des virgules)</span></label>
            <input type="text" value={featuresStr} onChange={(e) => setFeaturesStr(e.target.value)} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Climatisation, GPS, Bluetooth, Caméra de recul" />
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">URLs des photos <span className="text-gray-400 font-normal">(une par ligne)</span></label>
            <textarea value={imagesStr} onChange={(e) => setImagesStr(e.target.value)} rows={3} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="https://images.unsplash.com/photo-xxx..." />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Sauvegarde...' : isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 12;

export default function AdminCarsPage() {
  const [cars, setCars] = useState<CarData[]>([]);
  const [filtered, setFiltered] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CarData | null>(null);
  const [modal, setModal] = useState<Partial<CarData> | null | false>(false);
  const [q, setQ] = useState('');
  const [filterAvail, setFilterAvail] = useState<'' | '1' | '0'>('');
  const [page, setPage] = useState(1);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const res = await carApi.list();
      setCars(res.data);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  useEffect(() => {
    let list = cars;
    if (filterAvail === '1') list = list.filter((c) => c.is_available);
    if (filterAvail === '0') list = list.filter((c) => !c.is_available);
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter((c) =>
        `${c.make} ${c.model} ${c.license_plate} ${c.city} ${c.category}`.toLowerCase().includes(lower)
      );
    }
    setFiltered(list);
    setPage(1);
  }, [cars, q, filterAvail]);

  const handleDelete = async (car: CarData) => {
    setDeleteConfirm(null);
    setDeleting(car.id);
    try {
      await carApi.delete(car.id);
      setCars((prev) => prev.filter((c) => c.id !== car.id));
      toast.success(`${car.make} ${car.model} supprimé`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const toggleAvailability = async (car: CarData) => {
    setToggling(car.id);
    try {
      const newVal = car.is_available ? 0 : 1;
      await carApi.update(car.id, { is_available: newVal });
      setCars((prev) => prev.map((c) => c.id === car.id ? { ...c, is_available: newVal } : c));
      toast.success(newVal ? 'Véhicule remis en service' : 'Véhicule marqué indisponible');
    } catch {
      toast.error('Erreur');
    } finally {
      setToggling(null);
    }
  };

  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {modal !== false && (
        <CarModal
          car={modal}
          onClose={() => setModal(false)}
          onSaved={fetchCars}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">Supprimer le véhicule</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Supprimer <strong>{deleteConfirm.make} {deleteConfirm.model}</strong> ({deleteConfirm.license_plate}) ?
              Cette action est irréversible. Les réservations actives bloquent la suppression.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={!!deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Flotte de véhicules</h1>
          <p className="text-gray-500 mt-1">{cars.length} véhicule{cars.length !== 1 ? 's' : ''} · {cars.filter((c) => c.is_available).length} disponible{cars.filter((c) => c.is_available).length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchCars} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button onClick={() => setModal(null)} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition">
            <Plus className="w-4 h-4" /> Ajouter un véhicule
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par marque, modèle, immatriculation, ville..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2">
          {([['', 'Tous'], ['1', 'Disponibles'], ['0', 'Indisponibles']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilterAvail(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                filterAvail === v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: cars.length, color: 'bg-blue-100 text-blue-600' },
          { label: 'Disponibles', value: cars.filter((c) => c.is_available).length, color: 'bg-green-100 text-green-700' },
          { label: 'Indisponibles', value: cars.filter((c) => !c.is_available).length, color: 'bg-red-100 text-red-600' },
          { label: 'Électriques/Hybrides', value: cars.filter((c) => ['electric', 'hybrid'].includes(c.fuel_type)).length, color: 'bg-emerald-100 text-emerald-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className={`text-2xl font-extrabold ${color.split(' ')[1]}`}>{value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Cars grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🚗</p>
          <p className="font-medium">Aucun véhicule trouvé</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((car) => (
            <div key={car.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
              {/* Image */}
              <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                {car.images && car.images.length > 0
                  ? <img src={car.images[0]} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">🚗</div>
                }
                <div className="absolute top-3 left-3">
                  <AvailBadge available={car.is_available} />
                </div>
                {car.category && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/90 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {CAT_LABELS[car.category] || car.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-lg leading-tight">{car.make} {car.model}</h3>
                    <p className="text-sm text-gray-400">{car.year} · {car.color}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-brand-500 text-xl">{formatPrice(car.price_per_day)}</p>
                    <p className="text-xs text-gray-400">/ jour</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">👥 {car.seats}pl</span>
                  <span className="flex items-center gap-1">⚙️ {TRANS_LABELS[car.transmission] || car.transmission}</span>
                  <span className="flex items-center gap-1">⛽ {FUEL_LABELS[car.fuel_type] || car.fuel_type}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span className="font-mono font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">{car.license_plate}</span>
                  {car.city && <span className="text-gray-500">📍 {car.city}</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setModal(car)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button
                    onClick={() => toggleAvailability(car)}
                    disabled={toggling === car.id}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50 ${
                      car.is_available
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    }`}
                  >
                    {toggling === car.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : car.is_available
                        ? <><ToggleRight className="w-3.5 h-3.5" /> Désactiver</>
                        : <><ToggleLeft className="w-3.5 h-3.5" /> Activer</>
                    }
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(car)}
                    disabled={deleting === car.id}
                    className="p-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deleting === car.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-sm text-gray-500">Page {page} sur {pages} · {filtered.length} véhicule{filtered.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
