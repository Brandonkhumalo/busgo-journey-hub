import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search as SearchIcon, MapPin, Calendar, Clock, DollarSign } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface Bus {
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

const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    from: "",
    to: "",
    date: "",
  });
  const [hasSearched, setHasSearched] = useState(false);

  const { data: buses, isLoading } = useQuery({
    queryKey: ["buses", searchParams],
    queryFn: async () => {
      if (!searchParams.from || !searchParams.to) return [];

      const { data, error } = await supabase
        .from("buses")
        .select(`
          *,
          route:routes(*)
        `)
        .ilike("route.from_city", `%${searchParams.from}%`)
        .ilike("route.to_city", `%${searchParams.to}%`);

      if (error) throw error;
      return data as unknown as Bus[];
    },
    enabled: hasSearched,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.from || !searchParams.to || !searchParams.date) {
      toast.error("Please fill in all search fields");
      return;
    }
    setHasSearched(true);
  };

  const handleBookNow = (busId: string) => {
    if (!searchParams.date) {
      toast.error("Please select a travel date");
      return;
    }
    navigate(`/booking/${busId}?date=${searchParams.date}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <SearchIcon className="h-6 w-6 text-primary" />
              Search Routes
            </CardTitle>
            <CardDescription>Find your perfect bus journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            </form>
          </CardContent>
        </Card>

        {hasSearched && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              {buses && buses.length > 0
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
                          <h3 className="text-xl font-bold text-primary">{bus.bus_name}</h3>
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
                          <span className="font-medium">{bus.route.from_city}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">{bus.route.to_city}</span>
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
                        onClick={() => handleBookNow(bus.id)}
                        disabled={bus.available_seats === 0}
                      >
                        {bus.available_seats === 0 ? "Fully Booked" : "Book Now"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
