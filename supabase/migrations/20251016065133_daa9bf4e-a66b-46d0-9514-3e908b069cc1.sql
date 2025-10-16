-- Create events table for concerts, parties, conferences, etc.
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  description TEXT NOT NULL,
  venue TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  price NUMERIC NOT NULL,
  total_tickets INTEGER NOT NULL DEFAULT 100,
  available_tickets INTEGER NOT NULL DEFAULT 100,
  category TEXT NOT NULL DEFAULT 'concert',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_tickets table
CREATE TABLE public.event_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  ticket_type TEXT NOT NULL DEFAULT 'general',
  is_booked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, ticket_number)
);

-- Add event columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
ADD COLUMN event_ticket_id UUID REFERENCES public.event_tickets(id) ON DELETE CASCADE;

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events"
ON public.events
FOR SELECT
USING (true);

-- Enable RLS on event_tickets
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event_tickets"
ON public.event_tickets
FOR SELECT
USING (true);

-- Update the seat booking trigger to handle events
CREATE OR REPLACE FUNCTION public.update_seat_booking()
RETURNS TRIGGER AS $$
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
    
    -- Handle event booking
    IF NEW.event_id IS NOT NULL THEN
      UPDATE public.event_tickets SET is_booked = true WHERE id = NEW.event_ticket_id;
      UPDATE public.events SET available_tickets = available_tickets - 1 WHERE id = NEW.event_id;
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
    
    -- Handle event cancellation
    IF NEW.event_id IS NOT NULL THEN
      UPDATE public.event_tickets SET is_booked = false WHERE id = NEW.event_ticket_id;
      UPDATE public.events SET available_tickets = available_tickets + 1 WHERE id = NEW.event_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;