import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Shield, Clock, Wallet, Star, CheckCircle, Ticket, Plane } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-bus.jpg";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Bus,
      title: "Bus Tickets",
      description: "Travel comfortably between cities with our trusted bus operators",
    },
    {
      icon: Plane,
      title: "Flight Tickets",
      description: "Quick and convenient air travel across Zimbabwe",
    },
    {
      icon: Ticket,
      title: "Event Tickets",
      description: "Get tickets for concerts, parties, conferences, and more",
    },
    {
      icon: Wallet,
      title: "Easy Payments",
      description: "Pay with PayNow, EcoCash, InnBucks, or Omari",
    },
  ];

  const testimonials = [
    {
      name: "Tendai Moyo",
      comment: "TicketGo made my journey from Harare to Bulawayo so convenient. Now I also buy my concert tickets here!",
      rating: 5,
    },
    {
      name: "Chipo Ncube",
      comment: "I booked flight tickets and event tickets on the same platform. So convenient!",
      rating: 5,
    },
    {
      name: "Takudzwa Mutasa",
      comment: "Got tickets for the Summer Music Festival instantly. Payment with EcoCash was seamless!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/50" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Your One-Stop{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Ticket Platform
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Book bus tickets, flight tickets, and event tickets all in one place. From travel to entertainment, we've got you covered.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="hero"
                size="lg"
                onClick={() => navigate("/search")}
                className="text-lg"
              >
                Book Tickets Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg"
              >
                Sign Up Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Can You Book?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From transportation to entertainment, book all your tickets in one place
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-[var(--shadow-card)] hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Book your ticket in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-[var(--shadow-elegant)]">
                1
              </div>
              <h3 className="text-xl font-bold">Search Routes</h3>
              <p className="text-muted-foreground">
                Enter your departure and destination cities with your travel date
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-[var(--shadow-elegant)]">
                2
              </div>
              <h3 className="text-xl font-bold">Select Your Seat</h3>
              <p className="text-muted-foreground">
                Choose your preferred seat from our interactive seat map
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-[var(--shadow-elegant)]">
                3
              </div>
              <h3 className="text-xl font-bold">Pay & Travel</h3>
              <p className="text-muted-foreground">
                Complete payment and receive your QR code ticket instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-muted-foreground text-lg">Trusted by thousands of travelers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-[var(--shadow-card)]">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">"{testimonial.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands who trust TicketGo for travel tickets and event tickets
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate("/search")}
            className="text-lg shadow-xl hover:shadow-2xl"
          >
            Get Your Tickets Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 TicketGo. All rights reserved.</p>
          <p className="mt-2">Your all-in-one ticket platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
