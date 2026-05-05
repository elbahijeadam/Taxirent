export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  address?: string;
  driver_license_number?: string;
  driver_license_date?: string;
  professional_card_number?: string;
  license_number?: string;
  commune?: string;
  reason_for_immobilization?: string;
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  // Admin list extras
  doc_count?: number;
}

export interface AdminStats {
  users: { total: number; pending: number; approved: number; rejected: number };
  reservations: { total: number; pending: number; confirmed: number; active: number; cancelled: number };
  documents: { pending: number };
  cars?: { total: number; available: number; unavailable: number };
}

export interface PendingDocument {
  id: string;
  type: DocumentType;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  status: 'pending' | 'verified' | 'rejected';
  auto_status: AutoStatus;
  confidence_score?: number | null;
  uploaded_at: string;
  user_id: string;
  url: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface City {
  id: string;
  name: string;
  postal_code: string;
  country: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  category: 'economy' | 'compact' | 'midsize' | 'suv' | 'luxury' | 'van' | 'sedan' | 'electric' | 'hybrid';
  transmission: 'automatic' | 'manual';
  fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  seats: number;
  doors: number;
  price_per_day: number;
  deposit_amount: number;
  description: string;
  features: string[];
  images: string[];
  is_available: boolean;
  mileage: number;
  city: string;
}

export interface Reservation {
  id: string;
  user_id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  pickup_location?: string;
  dropoff_location?: string;
  pickup_time?: string;
  return_time?: string;
  reason?: 'engine_failure' | 'accident' | 'body_damage';
  vehicle_location?: string;
  total_days: number;
  price_per_day: number;
  total_amount: number;
  deposit_amount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'prepaid' | 'paid' | 'refunded';
  immobilized_plate?: string;
  admin_note?: string;
  notes?: string;
  created_at: string;
  contractReady?: boolean;
  depositClientSecret?: string;
  depositAmount?: number;
  // Joined fields
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  images?: string[];
  license_plate?: string;
}

export type DocumentType =
  | 'driver_license_front'
  | 'driver_license_back'
  | 'professional_card_front'
  | 'professional_card_back'
  | 'vehicle_registration'
  | 'license_document'
  | 'kbis';

export type AutoStatus = 'pending_review' | 'auto_approved' | 'auto_rejected' | 'manual_review';

export interface Document {
  id: string;
  type: DocumentType;
  file_name: string;
  mime_type: string;
  file_size: number;
  status: 'pending' | 'verified' | 'rejected';
  auto_status: AutoStatus;
  confidence_score?: number | null;
  uploaded_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}
