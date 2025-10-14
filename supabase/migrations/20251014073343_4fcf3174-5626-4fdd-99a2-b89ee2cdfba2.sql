-- Make user_id nullable to allow guest bookings
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies to allow guest bookings
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;

-- Allow anyone to create bookings (guest or authenticated)
CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own bookings or bookings they made as guests (by booking reference)
CREATE POLICY "Users can view own bookings or guest bookings" 
ON public.bookings 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR user_id IS NULL
);

-- Allow users to update their own bookings
CREATE POLICY "Users can update own bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create airlines/flights table
CREATE TABLE public.flights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flight_number TEXT NOT NULL,
  airline_name TEXT NOT NULL,
  route_id UUID NOT NULL REFERENCES public.routes(id),
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  price NUMERIC NOT NULL,
  total_seats INTEGER NOT NULL DEFAULT 180,
  available_seats INTEGER NOT NULL DEFAULT 180,
  amenities TEXT[] DEFAULT ARRAY['In-flight meal', 'WiFi', 'Entertainment'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on flights
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

-- Anyone can view flights
CREATE POLICY "Anyone can view flights" 
ON public.flights 
FOR SELECT 
USING (true);

-- Create flight_seats table
CREATE TABLE public.flight_seats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  seat_class TEXT NOT NULL DEFAULT 'economy',
  is_booked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on flight_seats
ALTER TABLE public.flight_seats ENABLE ROW LEVEL SECURITY;

-- Anyone can view flight seats
CREATE POLICY "Anyone can view flight_seats" 
ON public.flight_seats 
FOR SELECT 
USING (true);

-- Add flight_id to bookings table (nullable, either bus_id or flight_id will be set)
ALTER TABLE public.bookings ADD COLUMN flight_id UUID REFERENCES public.flights(id);
ALTER TABLE public.bookings ADD COLUMN flight_seat_id UUID REFERENCES public.flight_seats(id);

-- Make bus_id and seat_id nullable (since we can now book flights instead)
ALTER TABLE public.bookings ALTER COLUMN bus_id DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN seat_id DROP NOT NULL;

-- Add a check to ensure either bus or flight is selected
ALTER TABLE public.bookings ADD CONSTRAINT booking_type_check 
CHECK (
  (bus_id IS NOT NULL AND flight_id IS NULL) OR 
  (bus_id IS NULL AND flight_id IS NOT NULL)
);

-- Update the seat booking trigger to handle both buses and flights
CREATE OR REPLACE FUNCTION public.update_seat_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Handle bus booking
    IF NEW.bus_id IS NOT NULL THEN
      UPDATE public.seats SET is_booked = true WHERE id = NEW.seat_id;
      UPDATE public.buses SET available_seats = available_seats - 1 WHERE id = NEW.bus_id;
    END IF;
    
    -- Handle flight booking
    IF NEW.flight_id IS NOT NULL THEN
      UPDATE public.flight_seats SET is_booked = true WHERE id = NEW.flight_seat_id;
      UPDATE public.flights SET available_seats = available_seats - 1 WHERE id = NEW.flight_id;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Handle bus cancellation
    IF NEW.bus_id IS NOT NULL THEN
      UPDATE public.seats SET is_booked = false WHERE id = NEW.seat_id;
      UPDATE public.buses SET available_seats = available_seats + 1 WHERE id = NEW.bus_id;
    END IF;
    
    -- Handle flight cancellation
    IF NEW.flight_id IS NOT NULL THEN
      UPDATE public.flight_seats SET is_booked = false WHERE id = NEW.flight_seat_id;
      UPDATE public.flights SET available_seats = available_seats + 1 WHERE id = NEW.flight_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;