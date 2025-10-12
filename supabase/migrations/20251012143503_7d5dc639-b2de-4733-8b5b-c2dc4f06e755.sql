-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create routes table
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  distance_km INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view routes"
  ON public.routes FOR SELECT
  USING (true);

-- Create buses table
CREATE TABLE public.buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  bus_name TEXT NOT NULL,
  bus_number TEXT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_seats INTEGER NOT NULL DEFAULT 40,
  available_seats INTEGER NOT NULL DEFAULT 40,
  amenities TEXT[] DEFAULT ARRAY['AC', 'WiFi', 'USB Charging'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view buses"
  ON public.buses FOR SELECT
  USING (true);

-- Create seats table
CREATE TABLE public.seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bus_id, seat_number)
);

ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seats"
  ON public.seats FOR SELECT
  USING (true);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE CASCADE,
  booking_reference TEXT NOT NULL UNIQUE,
  passenger_name TEXT NOT NULL,
  passenger_id_number TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  next_of_kin_name TEXT NOT NULL,
  next_of_kin_phone TEXT NOT NULL,
  travel_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('paynow', 'ecocash', 'innbucks', 'omari')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'BG' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create function to update seat availability
CREATE OR REPLACE FUNCTION update_seat_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.seats SET is_booked = true WHERE id = NEW.seat_id;
    UPDATE public.buses SET available_seats = available_seats - 1 WHERE id = NEW.bus_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    UPDATE public.seats SET is_booked = false WHERE id = NEW.seat_id;
    UPDATE public.buses SET available_seats = available_seats + 1 WHERE id = NEW.bus_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update seat booking status
CREATE TRIGGER on_booking_change
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_seat_booking();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bookings
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample routes
INSERT INTO public.routes (from_city, to_city, distance_km) VALUES
  ('Harare', 'Bulawayo', 439),
  ('Harare', 'Mutare', 263),
  ('Bulawayo', 'Victoria Falls', 440),
  ('Harare', 'Masvingo', 292),
  ('Bulawayo', 'Gweru', 165);

-- Insert sample buses for each route
INSERT INTO public.buses (route_id, bus_name, bus_number, departure_time, arrival_time, price, total_seats, available_seats) 
SELECT 
  r.id,
  'Intercity Express',
  'IC' || LPAD((ROW_NUMBER() OVER())::TEXT, 3, '0'),
  '06:00'::TIME,
  '12:00'::TIME,
  25.00,
  40,
  40
FROM public.routes r;

INSERT INTO public.buses (route_id, bus_name, bus_number, departure_time, arrival_time, price, total_seats, available_seats)
SELECT 
  r.id,
  'Luxury Cruiser',
  'LC' || LPAD((ROW_NUMBER() OVER())::TEXT, 3, '0'),
  '14:00'::TIME,
  '20:00'::TIME,
  35.00,
  40,
  40
FROM public.routes r;

-- Generate seats for all buses
INSERT INTO public.seats (bus_id, seat_number)
SELECT 
  b.id,
  seat_num
FROM public.buses b
CROSS JOIN (
  SELECT LPAD(generate_series(1, 40)::TEXT, 2, '0') AS seat_num
) seats;