import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard } from "lucide-react";

const passengerSchema = z.object({
  passengerName: z.string().min(2, "Name must be at least 2 characters"),
  passengerId: z.string().min(5, "ID number must be at least 5 characters"),
  passengerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  nextOfKinName: z.string().min(2, "Next of kin name must be at least 2 characters"),
  nextOfKinPhone: z.string().min(10, "Next of kin phone must be at least 10 digits"),
});

const Booking = () => {
  const { busId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const travelDate = searchParams.get("date");
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [showPassengerForm, setShowPassengerForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    passengerName: "",
    passengerId: "",
    passengerPhone: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
  });

  const { data: bus } = useQuery({
    queryKey: ["bus", busId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buses")
        .select(`*, route:routes(*)`)
        .eq("id", busId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: seats, refetch: refetchSeats } = useQuery({
    queryKey: ["seats", busId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seats")
        .select("*")
        .eq("bus_id", busId)
        .order("seat_number");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!travelDate) {
      toast.error("Travel date is required");
      navigate("/search");
    }
  }, [travelDate, navigate]);

  const handleSeatSelect = (seatId: string, isBooked: boolean) => {
    if (isBooked) {
      toast.error("This seat is already booked");
      return;
    }
    setSelectedSeat(seatId);
    setShowPassengerForm(true);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat || !paymentMethod) {
      toast.error("Please select a seat and payment method");
      return;
    }

    setLoading(true);
    try {
      const validatedData = passengerSchema.parse(formData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to complete booking");
        navigate("/auth");
        return;
      }

      const bookingReference = `BG${Date.now().toString().slice(-8)}`;

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        bus_id: busId,
        seat_id: selectedSeat,
        booking_reference: bookingReference,
        passenger_name: validatedData.passengerName,
        passenger_id_number: validatedData.passengerId,
        passenger_phone: validatedData.passengerPhone,
        next_of_kin_name: validatedData.nextOfKinName,
        next_of_kin_phone: validatedData.nextOfKinPhone,
        travel_date: travelDate,
        payment_method: paymentMethod as any,
        payment_status: "completed",
        status: "confirmed",
        total_amount: bus?.price || 0,
      });

      if (error) throw error;

      toast.success("Booking confirmed!");
      navigate(`/confirmation/${bookingReference}`);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to create booking");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Select Your Seat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-center gap-6 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-muted rounded border-2"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded border-2 flex items-center justify-center">✓</div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-muted-foreground/20 rounded border-2"></div>
                    <span>Booked</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                  {seats?.map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatSelect(seat.id, seat.is_booked)}
                      disabled={seat.is_booked}
                      className={`
                        h-12 rounded border-2 font-medium transition-all
                        ${
                          seat.is_booked
                            ? "bg-muted-foreground/20 cursor-not-allowed"
                            : selectedSeat === seat.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted hover:bg-muted/80 border-border"
                        }
                      `}
                    >
                      {seat.seat_number}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {showPassengerForm && (
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Passenger Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBooking} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passengerName">Full Name</Label>
                    <Input
                      id="passengerName"
                      value={formData.passengerName}
                      onChange={(e) =>
                        setFormData({ ...formData, passengerName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passengerId">ID/Passport Number</Label>
                    <Input
                      id="passengerId"
                      value={formData.passengerId}
                      onChange={(e) =>
                        setFormData({ ...formData, passengerId: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passengerPhone">Phone Number</Label>
                    <Input
                      id="passengerPhone"
                      type="tel"
                      value={formData.passengerPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, passengerPhone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextOfKinName">Next of Kin Name</Label>
                    <Input
                      id="nextOfKinName"
                      value={formData.nextOfKinName}
                      onChange={(e) =>
                        setFormData({ ...formData, nextOfKinName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextOfKinPhone">Next of Kin Phone</Label>
                    <Input
                      id="nextOfKinPhone"
                      type="tel"
                      value={formData.nextOfKinPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, nextOfKinPhone: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Label className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Method
                    </Label>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paynow" id="paynow" />
                        <Label htmlFor="paynow" className="cursor-pointer">PayNow</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ecocash" id="ecocash" />
                        <Label htmlFor="ecocash" className="cursor-pointer">EcoCash</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="innbucks" id="innbucks" />
                        <Label htmlFor="innbucks" className="cursor-pointer">InnBucks</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="omari" id="omari" />
                        <Label htmlFor="omari" className="cursor-pointer">Omari</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-primary">${bus?.price}</span>
                    </div>
                    <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                      {loading ? "Processing..." : "Confirm Booking"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
