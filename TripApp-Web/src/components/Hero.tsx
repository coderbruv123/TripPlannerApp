import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Users,
  Search,
  Wallet,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";
import DatePicker from "./DatePicker";
import api from "../api/axiosInstance";

const API_URL = "http://localhost:5176/api/Destinations";

type SelectedDateRange = {
  from?: Date;
  to?: Date;
};
interface Destination {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export default function Hero() {
  const [planning, setPlanning] = useState(false);

  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  const [selectedDates, setSelectedDates] = useState<SelectedDateRange | undefined>(undefined);

  const [travelersOpen, setTravelersOpen] = useState(false);

  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}?search=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch destinations");
        }

        const data: Destination[] = await response.json();

        setResults(data);
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);


  const totalTravelers = adults + children;

  return (
    <section className="relative z-50 overflow-visible bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-16 lg:grid-cols-2 lg:px-10 lg:pt-24">

        {/* LEFT SIDE */}

        <div>          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
            Plan Your
            <br />
            Next Adventure
          </h1>

          <p className="mt-5 max-w-md text-slate-500">
            Discover destinations, create itineraries, and organize
            unforgettable trips all in one place.
          </p>

          <button className="mt-7 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Start planning
          </button>


          {/* Trip Planner Search */}

    <div className="mt-10 rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl">
       <div className="grid gap-2 lg:grid-cols-[2fr_1.3fr_1.2fr_1fr_auto]">

              {/* Destination */}

        <div className="relative flex items-start gap-3 rounded-2xl px-4 py-3 transition hover:bg-slate-50">
                <MapPin className="mt-1 h-5 w-5 text-slate-400" />

                <div className="w-full">

                  <p className="text-sm font-semibold">
                    Destination
                  </p>

                  <input
                    value={query}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() =>
                      setTimeout(
                        () => setShowDropdown(false),
                        200
                      )
                    }
                    onChange={(e) =>
                      setQuery(e.target.value)
                    }
                    placeholder="Destination?"
                    className="mt-1 w-full bg-transparent text-sm outline-none"
                  />


                  {showDropdown && (
                    <div className="absolute left-0 top-full z-[9999] mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

                      {loading && (
                        <p className="p-4 text-sm text-slate-500">
                          Searching destinations...
                        </p>
                      )}


                      {!loading &&
                        results.map((city) => (
                          <button
                            key={`${city.name}-${city.country}`}
onClick={async () => {
                                  setSelectedDestination(city);
                              setQuery(
                                `${city.name}, ${city.country}`
                              );
                              setShowDropdown(false);
                            }}
                            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                          >

                            <div>
                              <p className="font-medium">
                                {city.name}
                              </p>

                              <p className="text-xs text-slate-400">
                                {city.country}
                              </p>
                            </div>


                            <MapPin
                              size={16}
                              className="text-slate-300"
                            />

                          </button>
                        ))}


                      {!loading &&
                        query.length >= 2 &&
                        results.length === 0 && (
                          <p className="p-4 text-sm text-slate-500">
                            No destinations found.
                          </p>
                        )}

                    </div>
                  )}

                </div>

              </div>



              {/* Dates */}

              <div>
                <DatePicker
                  selected={selectedDates}
                  onSelect={(range) => setSelectedDates(range)}
                />
              </div>


              {/* Travelers */}

            <div className="relative flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-slate-50">

                <Users className="h-5 w-5 text-slate-400" />


                <button
                  onClick={() =>
                    setTravelersOpen(!travelersOpen)
                  }
                  className="text-left"
                >

                  <p className="text-sm font-semibold">
                    {totalTravelers} Travelers
                  </p>

                  <p className="text-sm text-slate-400">
                    Adults & children
                  </p>

                </button>



                {travelersOpen && (
                  <div className="absolute right-0 top-full z-50 mt-3 w-72 rounded-2xl border bg-white p-5 shadow-xl">


                    {/* Adults */}

                    <div className="flex items-center justify-between">

                      <div>
                        <p className="font-medium">
                          Adults
                        </p>

                        <p className="text-xs text-slate-400">
                          Age 13+
                        </p>
                      </div>


                      <div className="flex items-center gap-3">

                        <button
                          onClick={() =>
                            setAdults(
                              Math.max(1, adults - 1)
                            )
                          }
                          className="rounded-full border p-2"
                        >
                          <Minus size={14}/>
                        </button>


                        <span>
                          {adults}
                        </span>


                        <button
                          onClick={() =>
                            setAdults(adults + 1)
                          }
                          className="rounded-full border p-2"
                        >
                          <Plus size={14}/>
                        </button>

                      </div>

                    </div>



                    {/* Children */}

                    <div className="mt-5 flex items-center justify-between">


                      <div>
                        <p className="font-medium">
                          Children
                        </p>

                        <p className="text-xs text-slate-400">
                          Age 2-12
                        </p>
                      </div>


                      <div className="flex items-center gap-3">

                        <button
                          onClick={() =>
                            setChildren(
                              Math.max(0, children - 1)
                            )
                          }
                          className="rounded-full border p-2"
                        >
                          <Minus size={14}/>
                        </button>


                        <span>
                          {children}
                        </span>


                        <button
                          onClick={() =>
                            setChildren(children + 1)
                          }
                          className="rounded-full border p-2"
                        >
                          <Plus size={14}/>
                        </button>

                      </div>


                    </div>


                  </div>
                )}


              </div>



              {/* Budget */}

<div className="flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-slate-50">
                <Wallet className="h-5 w-5 text-slate-400"/>


                <div>

                  <p className="text-sm font-semibold">
                    Budget
                  </p>


                  <input
                    value={budget}
                    onChange={(e)=>
                      setBudget(e.target.value)
                    }
                    placeholder="Optional"
                    className="mt-1 w-full bg-transparent text-sm outline-none"
                  />

                </div>

              </div>


            </div>



            {/* Button */}

    <button
  disabled={planning || !selectedDestination}
  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full py-3 font-semibold text-white sm:w-auto sm:px-8 ${
    planning || !selectedDestination
      ? "cursor-not-allowed bg-slate-400"
      : "bg-indigo-600 hover:bg-indigo-700"
  }`}
  onClick={() => {
    if (!selectedDestination) return;

    if (!navigator.geolocation) {
      alert("Geolocation is not supported.");
      return;
    }

    setPlanning(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await api.post(
            "/trips/search",
            {
              originLat: position.coords.latitude,
              originLng: position.coords.longitude,

              destinationLat: selectedDestination.latitude,
              destinationLng: selectedDestination.longitude,
            }
          );

          const data = result.data;

          navigate("/trip", {
            state: {
              destination: selectedDestination,

              origin: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },

              journeys: data.journeys,

              budget,
              adults,
              children,
              selectedDates,
            },
          });
        } catch (err) {
          console.error(err);
          alert("Failed to plan trip.");
        } finally {
          setPlanning(false);
        }
      },
      () => {
        setPlanning(false);
        alert("Location permission denied.");
      }
    );
  }}
>
  <Search size={18} />
  {planning ? "Planning..." : "Plan My Trip"}
</button>


          </div>
                    {/* AI Planner Preview */}

          <div className="mt-6 rounded-3xl border border-indigo-100 bg-indigo-50 p-5">

            <div className="flex items-start justify-between gap-4">

              <div className="flex gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                </div>


                <div>

                  <h3 className="font-semibold text-slate-900">
                    AI Trip Planner
                  </h3>


                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Tell us your dream trip and AI will create a
                    personalized itinerary for you.
                  </p>

                </div>

              </div>


              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-600">
                Coming Soon
              </span>


            </div>

          </div>


        </div>



        {/* RIGHT SIDE IMAGES */}


        <div className="relative hidden grid-cols-2 gap-4 lg:grid">


          <div className="flex flex-col gap-4 pt-10">


            <img
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80"
              className="h-52 rounded-3xl object-cover"
              alt="travel destination"
            />


            <img
              src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80"
              className="h-52 rounded-3xl object-cover"
              alt="travel destination"
            />


          </div>



          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80"
            className="h-full rounded-3xl object-cover"
            alt="mountain destination"
          />


        </div>


      </div>

    </section>
  );
}