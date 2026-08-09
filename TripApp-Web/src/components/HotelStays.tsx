import { Star, Heart, BedDouble, Bath, Users, Wifi } from "lucide-react";

type Hotel = {
  name: string;
  rating: number;
  reviews: number;
  location: string;
  price: number;
  beds: number;
  baths: number;
  guests: number;
  liked?: boolean;
  badge?: string;
  img: string;
};

const HOTELS: Hotel[] = [
  {
    name: "Oceanview Grand Suite",
    rating: 4.9,
    reviews: 812,
    location: "12 Marina Bay Blvd",
    price: 189,
    beds: 2,
    baths: 2,
    guests: 4,
    liked: true,
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  },
  {
    name: "The Willowbrook Inn",
    rating: 4.3,
    reviews: 356,
    location: "88 Willowbrook Lane",
    price: 96,
    beds: 1,
    baths: 1,
    guests: 2,
    img: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80",
  },
  {
    name: "Palm Court Resort",
    rating: 4.6,
    reviews: 1204,
    location: "5 Palm Court Road",
    price: 245,
    beds: 3,
    baths: 2,
    guests: 6,
    badge: "-20% today",
    img: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80",
  },
  {
    name: "Skyline Boutique Hotel",
    rating: 4.1,
    reviews: 289,
    location: "301 Skyline Terrace",
    price: 132,
    beds: 1,
    baths: 1,
    guests: 2,
    img: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80",
  },
  {
    name: "Lakeside Garden Villa",
    rating: 4.8,
    reviews: 673,
    location: "22 Lakeside Drive",
    price: 210,
    beds: 3,
    baths: 3,
    guests: 5,
    liked: true,
    img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80",
  },
  {
    name: "Cedar & Stone Lodge",
    rating: 4.4,
    reviews: 421,
    location: "9 Cedar Hollow Path",
    price: 118,
    beds: 2,
    baths: 1,
    guests: 3,
    img: "https://images.unsplash.com/photo-1521783988139-89397d761dce?w=400&q=80",
  },
];

function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <div className="relative flex gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm shadow-slate-100">
      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-50">
        <img
          src={hotel.img}
          alt={hotel.name}
          className="h-full w-full object-cover"
        />
        {hotel.badge && (
          <span className="absolute left-1 top-1 rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {hotel.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {hotel.name}
            </h3>
            <Heart
              className={`h-4 w-4 shrink-0 ${
                hotel.liked ? "fill-rose-500 text-rose-500" : "text-slate-300"
              }`}
            />
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-medium text-slate-700">
              {hotel.rating}
            </span>
            <span>({hotel.reviews})</span>
            <span className="mx-1">·</span>
            <span className="truncate">{hotel.location}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3 w-3" /> {hotel.beds} beds
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3" /> {hotel.baths} baths
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {hotel.guests} guests
          </span>
          <span className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
          </span>
        </div>

        <p className="text-right text-sm font-bold text-slate-900">
          ${hotel.price}
          <span className="text-xs font-normal text-slate-400"> /night</span>
        </p>
      </div>
    </div>
  );
}

export default function HotelStays() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Popular hotels right now
        </h2>
        <p className="mt-2 text-slate-500">
          Handpicked stays with the best guest ratings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {HOTELS.map((hotel) => (
          <HotelCard key={hotel.name} hotel={hotel} />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          View all hotels
        </button>
      </div>
    </section>
  );
}