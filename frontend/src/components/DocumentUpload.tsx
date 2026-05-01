'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Check, Loader2, FileText, Image as ImageIcon, AlertCircle, ShieldX } from 'lucide-react';
import { userApi } from '@/lib/api';
import { Document, DocumentType } from '@/types';
import { getUser } from '@/lib/auth';
import Link from 'next/link';
import toast from 'react-hot-toast';

const DOC_GROUPS = [
  {
    label: 'Permis de conduire',
    items: [
      { value: 'driver_license_front' as DocumentType, label: 'Permis — Recto', icon: '🪪', required: true },
      { value: 'driver_license_back' as DocumentType, label: 'Permis — Verso', icon: '🪪', required: true },
    ],
  },
  {
    label: 'Carte professionnelle',
    items: [
      { value: 'professional_card_front' as DocumentType, label: 'Carte pro — Recto', icon: '💼', required: true },
      { value: 'professional_card_back' as DocumentType, label: 'Carte pro — Verso', icon: '💼', required: true },
    ],
  },
  {
    label: 'Documents véhicule & entreprise',
    items: [
      { value: 'vehicle_registration' as DocumentType, label: 'Carte grise', icon: '📋', required: true },
      { value: 'license_document' as DocumentType, label: 'Licence professionnelle', icon: '📄', required: true },
      { value: 'kbis' as DocumentType, label: 'KBIS', icon: '🏢', required: true },
    ],
  },
];

const ALL_REQUIRED: DocumentType[] = [
  'driver_license_front', 'driver_license_back',
  'professional_card_front', 'professional_card_back',
  'vehicle_registration', 'license_document', 'kbis',
];

interface Props {
  existing: Document[];
  onUploaded: (doc: Document) => void;
}

export default function DocumentUpload({ existing, onUploaded }: Props) {
  const [selectedType, setSelectedType] = useState<DocumentType>('driver_license_front');
  const [uploading, setUploading] = useState(false);

  const currentUser = getUser();
  const verified = !!(currentUser?.email_verified && currentUser?.phone_verified);

  if (!verified) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">Vérification requise</p>
          <p className="text-gray-500 text-sm mt-1 max-w-xs">
            Vous devez vérifier votre email et votre téléphone avant de pouvoir uploader des documents.
          </p>
        </div>
        <Link
          href="/auth/verify"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
        >
          Vérifier mon compte →
        </Link>
      </div>
    );
  }

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    setUploading(true);
    try {
      const res = await userApi.uploadDocument(files[0], selectedType);
      onUploaded(res.data);
      toast.success('Document uploadé avec succès !');
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  }, [selectedType, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'application/pdf': [] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const isUploaded = (type: DocumentType) => existing.some((d) => d.type === type);
  const uploadedCount = ALL_REQUIRED.filter(isUploaded).length;
  const allComplete = uploadedCount === ALL_REQUIRED.length;

  const selectedLabel = DOC_GROUPS.flatMap((g) => g.items).find((t) => t.value === selectedType)?.label || '';

  return (
    <div className="space-y-6">
      {/* Completion indicator */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${allComplete ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        {allComplete
          ? <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          : <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
        <div className="flex-1">
          <p className={`font-semibold text-sm ${allComplete ? 'text-green-700' : 'text-amber-700'}`}>
            {allComplete ? 'Dossier complet — Tous les documents ont été fournis' : `Dossier incomplet — ${uploadedCount}/${ALL_REQUIRED.length} documents fournis`}
          </p>
          {!allComplete && (
            <p className="text-xs text-amber-600 mt-0.5">
              Tous les documents sont requis pour valider votre demande de location.
            </p>
          )}
        </div>
        <div className="text-sm font-bold text-gray-600">{uploadedCount}/{ALL_REQUIRED.length}</div>
      </div>

      {/* Document groups */}
      {DOC_GROUPS.map((group) => (
        <div key={group.label}>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{group.label}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.items.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition ${
                  selectedType === t.value ? 'border-brand-500 bg-brand-50' : isUploaded(t.value) ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xl flex-shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.label}</p>
                  {isUploaded(t.value)
                    ? <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Uploadé</p>
                    : <p className="text-xs text-gray-400">Requis</p>}
                </div>
                {isUploaded(t.value) && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
          isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
            <p className="text-sm text-gray-600">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Upload className="w-7 h-7 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez ou cliquez pour uploader'}
              </p>
              <p className="text-sm text-gray-400 mt-1">PNG, JPG, WebP ou PDF · Max 5 MB</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-200">
                Document sélectionné : {selectedLabel}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded list */}
      {existing.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Documents envoyés :</p>
          <div className="space-y-2">
            {existing.map((doc) => {
              const label = DOC_GROUPS.flatMap((g) => g.items).find((t) => t.value === doc.type)?.label || doc.type;
              return (
                <div key={doc.id} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  {doc.mime_type === 'application/pdf'
                    ? <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                    : <ImageIcon className="w-5 h-5 text-green-600 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-800">{label}</p>
                    <p className="text-xs text-green-600 truncate">{doc.file_name}</p>
                  </div>
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
