import { useEffect } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import HotelStays from "../components/HotelStays";
import TripPlannerFeature from "../components/TripPlannedFeature";
import SavedTrips from "../components/SavedTrips";

export default function Home() {
  /* Anchor links from the navbar ("Saved trips", "How it works") should
     land on the right section when we arrive with a hash. */
  useEffect(() => {
    const { hash } = window.location;

    if (!hash) return;

    const target = document.querySelector(hash);

    if (target) {
      requestAnimationFrame(() =>
        target.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <Hero />
      <HotelStays />
      <TripPlannerFeature />
      <SavedTrips />

      <Footer />
    </div>
  );
}
