// User types
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'court_owner' | 'admin';
  reward_points?: number;
  is_verified?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  role?: 'customer' | 'court_owner';
}

// Court types
export interface Court {
  id: number;
  name: string;
  description?: string;
  location: string;
  hourly_rate: number;
  owner_id: number;
  owner_name?: string;
  skill_level?: string;
  image_url?: string;
  is_available: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CourtFormData {
  name: string;
  description?: string;
  location: string;
  hourly_rate: number;
  skill_level?: string;
  image_url?: string;
  is_available: boolean;
}

// Booking types
export interface Booking {
  id: number;
  court_id: number;
  court_name?: string;
  user_id: number;
  user_name?: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at?: string;
}

export interface BookingFormData {
  court_id: number;
  start_time: string;
  end_time: string;
}

// Payment types
export interface Payment {
  id: number;
  booking_id: number;
  user_id: number;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}

// Promotion types
export interface Promotion {
  id: number;
  code: string;
  description?: string;
  discount_percent: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Notification types
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
