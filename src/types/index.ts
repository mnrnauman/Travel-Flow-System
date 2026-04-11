export type TripStatus = 'planning' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';
export type TravelerType = 'adult' | 'child' | 'infant';
export type DocumentType = 'passport' | 'visa' | 'ticket' | 'hotel' | 'insurance' | 'other';

export interface Traveler {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: TravelerType;
  passportNumber?: string;
  passportExpiry?: string;
  nationality: string;
  dateOfBirth: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  origin: string;
  departureDate: string;
  returnDate: string;
  status: TripStatus;
  travelers: string[];
  totalBudget: number;
  spentAmount: number;
  notes: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  tripId: string;
  type: 'flight' | 'hotel' | 'car' | 'tour' | 'other';
  provider: string;
  referenceNumber: string;
  status: BookingStatus;
  checkIn?: string;
  checkOut?: string;
  amount: number;
  currency: string;
  travelerIds: string[];
  notes: string;
  createdAt: string;
}

export interface Document {
  id: string;
  travelerId?: string;
  tripId?: string;
  type: DocumentType;
  name: string;
  expiryDate?: string;
  fileUrl?: string;
  notes: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  category: 'accommodation' | 'transport' | 'food' | 'activities' | 'shopping' | 'other';
  description: string;
  amount: number;
  currency: string;
  date: string;
  paidBy: string;
  createdAt: string;
}
