import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Calendar, MapPin, Clock, User, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { QRCodeSVG } from "qrcode.react";

const Confirmation = () => {
  const { bookingRef } = useParams();
  const navigate = useNavigate();

  const { data: booking } = useQuery({
    queryKey: ["booking", bookingRef],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          bus:buses(
            *,
            route:routes(*)
          ),
          seat:seats(seat_number)
        `)
        .eq("booking_reference", bookingRef)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Card className="max-w-2xl mx-auto shadow-[var(--shadow-card)]">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-3xl">Booking Confirmed!</CardTitle>
            <p className="text-muted-foreground">
              Your journey is booked. Keep this reference for boarding.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center p-6 bg-muted rounded-lg">
              <QRCodeSVG value={booking.booking_reference} size={200} />
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Booking Reference</p>
                <p className="font-bold text-lg">{booking.booking_reference}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seat Number</p>
                <p className="font-bold text-lg">{booking.seat.seat_number}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Route</p>
                  <p className="text-muted-foreground">
                    {booking.bus.route.from_city} → {booking.bus.route.to_city}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Travel Date</p>
                  <p className="text-muted-foreground">
                    {new Date(booking.travel_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Departure Time</p>
                  <p className="text-muted-foreground">{booking.bus.departure_time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Passenger</p>
                  <p className="text-muted-foreground">{booking.passenger_name}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
              <span className="font-medium">Total Paid</span>
              <span className="text-2xl font-bold text-primary">${booking.total_amount}</span>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                View All Bookings
              </Button>
              <Button variant="hero" className="flex-1" onClick={() => navigate("/search")}>
                Book Another Trip
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Confirmation;
