// Trip Analytics Types and Interfaces

export interface DriverAnalytics {
  driver_id: number;
  driver_name: string;
  phone_number: string;
  onboarding_date: Date;
  total_trips: number;
  total_earnings: number;
  average_rating: number;
  trips: TripDetail[];
}

export interface TripDetail {
  trip_id: number;
  start_location: string;
  end_location: string;
  trip_date: Date;
  amount: number;
  rating_value: number;
  comment: string;
}

// Database model types (for internal use)
export interface Driver {
  id: number;
  driver_name: string;
  phone_number: string;
  onboarding_date: Date;
}

export interface Trip {
  id: number;
  driver_id: number;
  start_location: string;
  end_location: string;
  trip_date: Date;
}

export interface Payment {
  id: number;
  trip_id: number;
  amount: number;
  payment_date: Date;
}

export interface Rating {
  id: number;
  trip_id: number;
  rating_value: number;
  comment: string | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Performance metrics types
export interface PerformanceMetrics {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  totalTime: number;
}

// Query parameters types
export interface DriverAnalyticsQuery {
  driverId: string;
  optimized?: string;
}

// Error types
export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
}
