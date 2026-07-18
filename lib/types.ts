export type Vehicle = {
  id: string;
  user_id: string;
  nickname: string | null;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  vin: string | null;
  specs: Record<string, string> | null;
  current_mileage: number;
  photo_url: string | null;
  is_archived: boolean;
  created_at: string;
};

export type ServiceType = {
  id: number;
  name: string;
  icon: string | null;
  default_interval_miles: number | null;
  default_interval_months: number | null;
};

export type MaintenanceLog = {
  id: string;
  vehicle_id: string;
  service_type_id: number | null;
  title: string;
  notes: string | null;
  mileage: number | null;
  cost: number | null;
  currency: string;
  performed_at: string;
  shop_name: string | null;
  is_diy: boolean;
  created_at: string;
};

export type Reminder = {
  id: string;
  vehicle_id: string;
  service_type_id: number | null;
  title: string;
  due_mileage: number | null;
  due_date: string | null;
  is_recurring: boolean;
  interval_miles: number | null;
  interval_months: number | null;
  is_completed: boolean;
  created_at: string;
};

export type Mod = {
  id: string;
  vehicle_id: string;
  name: string;
  category: string | null;
  brand: string | null;
  cost: number | null;
  installed_at: string | null;
  mileage: number | null;
  notes: string | null;
  created_at: string;
};

export type FuelLog = {
  id: string;
  vehicle_id: string;
  mileage: number;
  gallons: number;
  price_per_gallon: number | null;
  total_cost: number | null;
  is_full_tank: boolean;
  logged_at: string;
  created_at: string;
};
