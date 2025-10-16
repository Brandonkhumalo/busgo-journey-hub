import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search as SearchIcon, MapPin, Calendar, Clock, ArrowLeft, Bus, Plane, Ticket } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BusResult {
  id: string;
  bus_name: string;
  bus_number: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  available_seats: number;
  amenities: string[];
  route: {
    from_city: string;
    to_city: string;
    distance_km: number;
  };
}

interface FlightResult {
  id: string;
  airline_name: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  available_seats: number;
  amenities: string[];
  route: {
    from_city: string;
    to_city: string;
    distance_km: number;
  };
}

interface EventResult {
  id: string;
  event_name: string;
  description: string;
  venue: string;
  event_date: string;
  event_time: string;
  price: number;
  available_tickets: number;
  category: string;
  image_url?: string;
}

const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    from: "",
    to: "",
    date: "",
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [ticketType, setTicketType] = useState<"bus" | "flight" | "event">("bus");

  const { data: buses, isLoading: busesLoading } = useQuery({
    queryKey: ["buses", searchParams],
    queryFn: async () => {
      if (!searchParams.from || !searchParams.to) return [];

      const { data, error } = await supabase
        .from("buses")
        .select(`
          *,
          route:routes(*)
        `);

      if (error) throw error;
      
      const filtered = (data as unknown as BusResult[]).filter(bus => {
        if (!bus?.route?.from_city || !bus?.route?.to_city) return false;
        const fromMatch = bus.route.from_city.toLowerCase().includes(searchParams.from.toLowerCase());
        const toMatch = bus.route.to_city.toLowerCase().includes(searchParams.to.toLowerCase());
        return fromMatch && toMatch;
      });
      
      return filtered;
    },
    enabled: hasSearched && ticketType === "bus",
  });

  const { data: flights, isLoading: flightsLoading } = useQuery({
    queryKey: ["flights", searchParams],
    queryFn: async () => {
      if (!searchParams.from || !searchParams.to) return [];

      const { data, error } = await supabase
        .from("flights")
        .select(`
          *,
          route:routes(*)
        `);

      if (error) throw error;
      
      const filtered = (data as unknown as FlightResult[]).filter(flight => {
        if (!flight?.route?.from_city || !flight?.route?.to_city) return false;
        const fromMatch = flight.route.from_city.toLowerCase().includes(searchParams.from.toLowerCase());
        const toMatch = flight.route.to_city.toLowerCase().includes(searchParams.to.toLowerCase());
        return fromMatch && toMatch;
      });
      
      return filtered;
    },
    enabled: hasSearched && ticketType === "flight",
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events", searchParams],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date");

      if (error) throw error;
      
      return (data as unknown as EventResult[]);
    },
    enabled: hasSearched && ticketType === "event",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketType !== "event" && (!searchParams.from || !searchParams.to || !searchParams.date)) {
      toast.error("Please fill in all search fields");
      return;
    }
    setHasSearched(true);
  };

  const handleBookNow = (id: string, type: "bus" | "flight" | "event") => {
    if (type !== "event" && !searchParams.date) {
      toast.error("Please select a travel date");
      return;
    }
    const dateParam = type === "event" ? "" : `?date=${searchParams.date}&type=${type}`;
    const typeParam = type === "event" ? `?type=${type}` : `&type=${type}`;
    navigate(`/booking/${id}${dateParam}${type === "event" ? typeParam : ""}`);
  };

  const isLoading = busesLoading || flightsLoading || eventsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <Card className="mb-8 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <SearchIcon className="h-6 w-6 text-primary" />
              Search Routes
            </CardTitle>
            <CardDescription>Find your perfect journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <Tabs value={ticketType} onValueChange={(v) => setTicketType(v as "bus" | "flight" | "event")} className="w-full">
                <TabsList className="grid w-full max-w-2xl grid-cols-3">
                  <TabsTrigger value="bus" className="gap-2">
                    <Bus className="h-4 w-4" />
                    Bus
                  </TabsTrigger>
                  <TabsTrigger value="flight" className="gap-2">
                    <Plane className="h-4 w-4" />
                    Flight
                  </TabsTrigger>
                  <TabsTrigger value="event" className="gap-2">
                    <Ticket className="h-4 w-4" />
                    Events
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {ticketType !== "event" ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from">From</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="from"
                        placeholder="Harare"
                        className="pl-10"
                        value={searchParams.from}
                        onChange={(e) =>
                          setSearchParams({ ...searchParams, from: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to">To</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="to"
                        placeholder="Bulawayo"
                        className="pl-10"
                        value={searchParams.to}
                        onChange={(e) =>
                          setSearchParams({ ...searchParams, to: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Travel Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        type="date"
                        className="pl-10"
                        value={searchParams.date}
                        onChange={(e) =>
                          setSearchParams({ ...searchParams, date: e.target.value })
                        }
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                      {isLoading ? "Searching..." : "Search Routes"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <Button type="submit" variant="hero" size="lg" disabled={isLoading}>
                    {isLoading ? "Loading Events..." : "Browse Events"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {hasSearched && (
          <div className="space-y-4">
            {ticketType === "bus" && (
              <>
                <h2 className="text-2xl font-bold">
                  {busesLoading 
                    ? "Searching for buses..."
                    : buses && buses.length > 0
                      ? `Found ${buses.length} Available ${buses.length === 1 ? "Bus" : "Buses"}`
                      : "No buses found"}
                </h2>
                {buses?.map((bus) => (
                  <Card key={bus.id} className="shadow-[var(--shadow-card)] hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                <Bus className="h-5 w-5" />
                                {bus.bus_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">{bus.bus_number}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">${bus.price}</p>
                              <p className="text-xs text-muted-foreground">per seat</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="font-medium">{bus.route?.from_city || 'N/A'}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium">{bus.route?.to_city || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span>{bus.departure_time} - {bus.arrival_time}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {bus.amenities?.map((amenity) => (
                              <Badge key={amenity} variant="secondary">
                                {amenity}
                              </Badge>
                            ))}
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {bus.available_seats} seats available
                          </p>
                        </div>

                        <div className="flex items-center">
                          <Button
                            variant="hero"
                            onClick={() => handleBookNow(bus.id, "bus")}
                            disabled={bus.available_seats === 0}
                          >
                            {bus.available_seats === 0 ? "Fully Booked" : "Book Now"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {ticketType === "flight" && (
              <>
                <h2 className="text-2xl font-bold">
                  {flightsLoading
                    ? "Searching for flights..."
                    : flights && flights.length > 0
                      ? `Found ${flights.length} Available ${flights.length === 1 ? "Flight" : "Flights"}`
                      : "No flights found"}
                </h2>
                {flights?.map((flight) => (
                  <Card key={flight.id} className="shadow-[var(--shadow-card)] hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                <Plane className="h-5 w-5" />
                                {flight.airline_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">{flight.flight_number}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">${flight.price}</p>
                              <p className="text-xs text-muted-foreground">per seat</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="font-medium">{flight.route?.from_city || 'N/A'}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium">{flight.route?.to_city || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span>{flight.departure_time} - {flight.arrival_time}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {flight.amenities?.map((amenity) => (
                              <Badge key={amenity} variant="secondary">
                                {amenity}
                              </Badge>
                            ))}
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {flight.available_seats} seats available
                          </p>
                        </div>

                        <div className="flex items-center">
                          <Button
                            variant="hero"
                            onClick={() => handleBookNow(flight.id, "flight")}
                            disabled={flight.available_seats === 0}
                          >
                            {flight.available_seats === 0 ? "Fully Booked" : "Book Now"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {ticketType === "event" && (
              <>
                <h2 className="text-2xl font-bold">
                  {eventsLoading
                    ? "Loading events..."
                    : events && events.length > 0
                      ? `Found ${events.length} Upcoming ${events.length === 1 ? "Event" : "Events"}`
                      : "No events found"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events?.map((event) => (
                    <Card key={event.id} className="shadow-[var(--shadow-card)] hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                <Ticket className="h-5 w-5" />
                                {event.event_name}
                              </h3>
                              <Badge variant="secondary" className="mt-2">{event.category}</Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">${event.price}</p>
                              <p className="text-xs text-muted-foreground">per ticket</p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="font-medium">{event.venue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span>{new Date(event.event_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span>{event.event_time}</span>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {event.available_tickets} tickets available
                          </p>

                          <Button
                            variant="hero"
                            className="w-full"
                            onClick={() => handleBookNow(event.id, "event")}
                            disabled={event.available_tickets === 0}
                          >
                            {event.available_tickets === 0 ? "Sold Out" : "Buy Tickets"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;