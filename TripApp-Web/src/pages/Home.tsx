import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HotelStays from "../components/HotelStays";
import TripPlannerFeature from "../components/TripPlannedFeature";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <HotelStays />
      <TripPlannerFeature />
    </div>
  );
}
 