import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HotelStays from "../components/HotelStays";
import TripPlannerFeature from "../components/TripPlannedFeature";
import { useDarkMode } from "../hooks/useDarkMode";

export default function Home() {
  const [darkMode] = useDarkMode();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: darkMode ? "#0D1117" : "#FFFFFF" }}
    >
      <Navbar />
      <Hero />
      <HotelStays />
      <TripPlannerFeature />
    </div>
  );
}
 