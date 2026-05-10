'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { fr } from 'date-fns/locale';
import { Users, Settings, Fuel, Shield, Check, ArrowRight, Loader2, Clock, MapPin, AlertTriangle, Building2 } from 'lucide-react';
import { carApi, reservationApi, authApi } from '@/lib/api';
import { Car } from '@/types';
import { formatPrice, isLoggedIn, isVerified } from '@/lib/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';

const FUEL_LABELS: Record<string, string> = { petrol: 'Essence', diesel: 'Diesel', electric: 'Électrique', hybrid: 'Hybride' };
const TRANS_LABELS: Record<string, string> = { automatic: 'Automatique', manual: 'Manuelle' };

const REASONS = [
  { value: 'engine_failure', label: 'Panne moteur',           icon: '🔧' },
  { value: 'accident',       label: 'Accident de la route',   icon: '🚨' },
  { value: 'body_damage',    label: 'Dommages carrosserie',   icon: '🔨' },
  { value: 'other',          label: 'Autre (à préciser)',     icon: '📝' },
];

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [car, setCar] = useState<Car | null>(null);
  const [bookedRanges, setBookedRanges] = useState<{ start_date: string; end_date: string }[]>([]);
  const [range, setRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);

  // B2B fields
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [vehicleLocation, setVehicleLocation] = useState('');
  const [immobilizedPlate, setImmobilizedPlate] = useState('');
  const [pickupTime, setPickupTime] = useState('09:00');
  const [returnTime, setReturnTime] = useState('18:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([carApi.get(id), carApi.getAvailability(id)])
      .then(([carRes, availRes]) => {
        setCar(carRes.data);
        setBookedRanges(availRes.data);
      })
      .catch((err) => toast.error(err?.response?.data?.error || err?.message || 'Erreur de chargement', { duration: 6000 }))
      .finally(() => setLoading(false));

    if (isLoggedIn()) {
      authApi.getMe().then((meRes) => setProfileUser(meRes.data)).catch(() => {});
    }
  }, [id]);

  const disabledDays = [
    { before: new Date() },
    ...bookedRanges.map(({ start_date, end_date }) => ({ from: new Date(start_date), to: new Date(end_date) })),
  ];

  const totalDays = range?.from && range?.to
    ? Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const totalAmount = car ? totalDays * parseFloat(String(car.price_per_day)) : 0;

  const handleReserve = async () => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    if (!isVerified()) {
      toast.error('Vérifiez votre compte avant de réserver', { duration: 4000 });
      router.push('/auth/verify');
      return;
    }
    if (!range?.from || !range?.to) { toast.error('Sélectionnez les dates de location'); return; }
    if (!reason) { toast.error('Veuillez indiquer le motif de location'); return; }
    if (reason === 'other' && !otherReason.trim()) { toast.error('Veuillez préciser le motif'); return; }
    if (!vehicleLocation.trim()) { toast.error('Veuillez indiquer la localisation du véhicule immobilisé'); return; }
    if (!immobilizedPlate.trim()) { toast.error('Veuillez indiquer la plaque du véhicule immobilisé'); return; }

    setSubmitting(true);
    try {
      const res = await reservationApi.create({
        car_id: id,
        start_date: range.from.toISOString().split('T')[0],
        end_date: range.to.toISOString().split('T')[0],
        pickup_time: pickupTime,
        return_time: returnTime,
        reason,
        vehicle_location: vehicleLocation.trim(),
        immobilized_plate: immobilizedPlate.trim().toUpperCase(),
        notes: reason === 'other'
          ? (otherReason.trim() + (notes.trim() ? '\n\n' + notes.trim() : ''))
          : (notes || undefined),
      });
      toast.success('Demande enregistrée ! Votre contrat a été envoyé par email.');
      router.push(`/reservations/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="pt-28 text-center">
        <p className="text-2xl">Véhicule introuvable</p>
        <Link href="/cars" className="btn-primary mt-6 inline-block">Retour</Link>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Left — car info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="card overflow-hidden">
              <div className="h-72 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-8xl">
                {car.images && car.images.length > 0
                  ? <img src={car.images[0]} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
                  : '🚗'}
              </div>
            </div>

            {/* Details */}
            <div className="card p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900">{car.make} {car.model}</h1>
                  <p className="text-gray-500 text-lg mt-1">{car.year} · {car.color}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold text-brand-500">{formatPrice(car.price_per_day)}</p>
                  <p className="text-gray-400 text-sm">par jour</p>
                </div>
              </div>

              {car.city && (
                <div className="flex items-center gap-2 mb-5 text-sm text-gray-500">
                  <Building2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>Disponible à <span className="font-semibold text-gray-800">{car.city}</span></span>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: Users, label: `${car.seats} places` },
                  { icon: Settings, label: TRANS_LABELS[car.transmission] },
                  { icon: Fuel, label: FUEL_LABELS[car.fuel_type] },
                  { icon: Shield, label: `${formatPrice(car.deposit_amount)} dépôt` },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center bg-gray-50 rounded-xl p-4">
                    <Icon className="w-6 h-6 text-brand-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 text-center">{label}</span>
                  </div>
                ))}
              </div>

              {car.description && <p className="text-gray-600 leading-relaxed mb-6">{car.description}</p>}

              {car.features && car.features.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Équipements</h3>
                  <div className="flex flex-wrap gap-2">
                    {car.features.map((f) => (
                      <span key={f} className="flex items-center gap-1.5 bg-green-50 text-green-700 text-sm px-3 py-1.5 rounded-lg font-medium border border-green-200">
                        <Check className="w-3.5 h-3.5" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — booking panel */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20 space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Demande de location</h2>

              {/* Profile completeness warning */}
              {isLoggedIn() && profileUser && (() => {
                const missing: string[] = [];
                if (!profileUser.driver_license_number) missing.push('N° permis de conduire');
                if (!profileUser.driver_license_date) missing.push('Date de délivrance du permis');
                if (!profileUser.professional_card_number) missing.push('N° carte professionnelle');
                if (!profileUser.license_number) missing.push('N° conventionnement');
                if (!profileUser.address && !profileUser.commune) missing.push('Adresse');
                return missing.length > 0 ? (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">Profil incomplet — votre contrat aura des champs vides :</p>
                      <ul className="mt-1 space-y-0.5">
                        {missing.map((f) => <li key={f}>• {f}</li>)}
                      </ul>
                      <Link href="/profile?tab=professional" className="inline-block mt-2 font-bold underline hover:text-amber-900">
                        Compléter mon profil →
                      </Link>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Reason */}
              <div>
                <label className="label text-xs">Motif de la demande <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setReason(r.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition text-sm font-medium ${
                        reason === r.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{r.icon}</span>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Other reason text input */}
              {reason === 'other' && (
                <div>
                  <label className="label text-xs">Précisez le motif <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    className="input py-2 text-sm"
                    placeholder="Décrivez le motif d'immobilisation..."
                    maxLength={200}
                  />
                </div>
              )}

              {/* Vehicle location */}
              <div>
                <label className="label text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Localisation du véhicule immobilisé <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vehicleLocation}
                  onChange={(e) => setVehicleLocation(e.target.value)}
                  className="input py-2 text-sm"
                  placeholder="Ex: Garage Peugeot, 12 rue de la Paix, Paris"
                />
              </div>

              {/* Immobilized plate */}
              <div>
                <label className="label text-xs">Immatriculation du taxi immobilisé <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={immobilizedPlate}
                  onChange={(e) => setImmobilizedPlate(e.target.value.toUpperCase())}
                  className="input py-2 text-sm font-mono tracking-widest"
                  placeholder="Ex: AB-123-CD"
                  maxLength={10}
                />
              </div>

              {/* Calendar */}
              <div>
                <label className="label text-xs">Dates de location</label>
                <div className="flex justify-center">
                  <DayPicker
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    locale={fr}
                    disabled={disabledDays}
                    numberOfMonths={1}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Heure prise en charge</label>
                  <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="input py-2 text-sm" />
                </div>
                <div>
                  <label className="label text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Heure restitution</label>
                  <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} className="input py-2 text-sm" />
                </div>
              </div>

              {/* City info + notes */}
              <div className="space-y-2">
                {car.city && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span>Prise en charge à <strong>{car.city}</strong></span>
                  </div>
                )}
                <div>
                  <label className="label text-xs">Notes (optionnel)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input py-2 text-sm resize-none" rows={2} placeholder="Informations complémentaires..." />
                </div>
              </div>

              {/* Price summary */}
              {totalDays > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{formatPrice(car.price_per_day)} × {totalDays} jour{totalDays > 1 ? 's' : ''}</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  {parseFloat(String(car.deposit_amount)) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Dépôt de garantie</span>
                      <span>{formatPrice(car.deposit_amount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-base">
                    <span>Estimation totale</span>
                    <span className="text-brand-500">{formatPrice(totalAmount)}</span>
                  </div>
                  <p className="text-xs text-gray-400">Tarif indicatif — confirmation par notre équipe.</p>
                </div>
              )}

              {/* Missing fields warning */}
              {(!reason || !vehicleLocation.trim() || !immobilizedPlate.trim() || !range?.from || !range?.to) && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Champs requis manquants :</p>
                    <ul className="mt-1 space-y-0.5">
                      {!reason && <li>• Motif de la demande</li>}
                      {!vehicleLocation.trim() && <li>• Localisation du véhicule immobilisé</li>}
                      {!immobilizedPlate.trim() && <li>• Immatriculation du taxi immobilisé</li>}
                      {(!range?.from || !range?.to) && <li>• Dates de location</li>}
                    </ul>
                  </div>
                </div>
              )}

              <button
                onClick={handleReserve}
                disabled={submitting || !range?.from || !range?.to || !reason || !vehicleLocation.trim() || !immobilizedPlate.trim()}
                className="btn-primary w-full py-3 rounded-xl"
              >
                {submitting
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours...</>
                  : <>{totalDays > 0 ? `Confirmer la demande · ${formatPrice(totalAmount)}` : 'Soumettre la demande'} <ArrowRight className="w-5 h-5" /></>}
              </button>

              {!isLoggedIn() && (
                <p className="text-xs text-center text-gray-400">
                  <Link href="/auth/login" className="text-brand-500 hover:underline">Connectez-vous</Link> pour soumettre une demande
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
