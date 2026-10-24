/* Stay catalogue for the Stays page and the home-page highlight strip.
   Imagery is remote (Unsplash); everything else is local so the page
   renders instantly and stays usable offline. */

export type Stay = {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  address: string;
  city: string;
  country: string;
  price: number;
  beds: number;
  baths: number;
  guests: number;
  badge?: string;
  img: string;
  description: string;
  amenities: string[];
};

export const STAYS: Stay[] = [
  {
    id: "oceanview-grand-suite",
    name: "Oceanview Grand Suite",
    rating: 4.9,
    reviews: 812,
    address: "12 Marina Bay Blvd",
    city: "Marina Bay",
    country: "Singapore",
    price: 189,
    beds: 2,
    baths: 2,
    guests: 4,
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    description:
      "Floor-to-ceiling windows over the bay, a rainfall shower and a rooftop pool that stays open late.",
    amenities: ["Free Wi-Fi", "Pool", "Breakfast included", "Air conditioning", "Gym"],
  },
  {
    id: "willowbrook-inn",
    name: "The Willowbrook Inn",
    rating: 4.3,
    reviews: 356,
    address: "88 Willowbrook Lane",
    city: "Cotswolds",
    country: "United Kingdom",
    price: 96,
    beds: 1,
    baths: 1,
    guests: 2,
    img: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
    description:
      "A stone cottage inn with low beams, a log fire in the lounge and cooked breakfasts served until ten.",
    amenities: ["Free Wi-Fi", "Breakfast included", "Parking", "Pet friendly"],
  },
  {
    id: "palm-court-resort",
    name: "Palm Court Resort",
    rating: 4.6,
    reviews: 1204,
    address: "5 Palm Court Road",
    city: "Ubud",
    country: "Indonesia",
    price: 245,
    beds: 3,
    baths: 2,
    guests: 6,
    badge: "-20% today",
    img: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
    description:
      "Private villas set in terraced gardens, each with a plunge pool and a shaded veranda for slow mornings.",
    amenities: ["Free Wi-Fi", "Pool", "Spa", "Air conditioning", "Airport shuttle"],
  },
  {
    id: "skyline-boutique-hotel",
    name: "Skyline Boutique Hotel",
    rating: 4.1,
    reviews: 289,
    address: "301 Skyline Terrace",
    city: "Tokyo",
    country: "Japan",
    price: 132,
    beds: 1,
    baths: 1,
    guests: 2,
    img: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
    description:
      "Compact, design-led rooms two minutes from the metro, with a coffee bar in the lobby and late checkout.",
    amenities: ["Free Wi-Fi", "Air conditioning", "Laundry", "Luggage storage"],
  },
  {
    id: "lakeside-garden-villa",
    name: "Lakeside Garden Villa",
    rating: 4.8,
    reviews: 673,
    address: "22 Lakeside Drive",
    city: "Lake Como",
    country: "Italy",
    price: 210,
    beds: 3,
    baths: 3,
    guests: 5,
    img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    description:
      "A restored villa with a walled garden, a private jetty and a kitchen made for long lunches.",
    amenities: ["Free Wi-Fi", "Kitchen", "Parking", "Garden", "Pets welcome"],
  },
  {
    id: "cedar-stone-lodge",
    name: "Cedar & Stone Lodge",
    rating: 4.4,
    reviews: 421,
    address: "9 Cedar Hollow Path",
    city: "Banff",
    country: "Canada",
    price: 118,
    beds: 2,
    baths: 1,
    guests: 3,
    img: "https://images.unsplash.com/photo-1521783988139-89397d761dce?w=800&q=80",
    description:
      "Timber lodge rooms with mountain views, a wood sauna downstairs and trailheads at the end of the road.",
    amenities: ["Free Wi-Fi", "Parking", "Sauna", "Fireplace", "Ski storage"],
  },
  {
    id: "harbourlight-loft",
    name: "Harbourlight Loft",
    rating: 4.7,
    reviews: 508,
    address: "17 Rua do Sol",
    city: "Lisbon",
    country: "Portugal",
    price: 142,
    beds: 2,
    baths: 1,
    guests: 4,
    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    description:
      "A top-floor loft in Alfama with tiled floors, a small balcony and tram 28 stopping around the corner.",
    amenities: ["Free Wi-Fi", "Kitchen", "Air conditioning", "Balcony", "Washer"],
  },
  {
    id: "desert-bloom-retreat",
    name: "Desert Bloom Retreat",
    rating: 4.5,
    reviews: 194,
    address: "Route de l'Ourika km 12",
    city: "Marrakech",
    country: "Morocco",
    price: 104,
    beds: 2,
    baths: 2,
    guests: 4,
    img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    description:
      "An olive-grove retreat with a courtyard pool, hammam and dinner served under the stars.",
    amenities: ["Free Wi-Fi", "Pool", "Breakfast included", "Spa", "Parking"],
  },
  {
    id: "alpine-glass-chalet",
    name: "Alpine Glass Chalet",
    rating: 4.9,
    reviews: 132,
    address: "3 Matterhorn View",
    city: "Zermatt",
    country: "Switzerland",
    price: 268,
    beds: 3,
    baths: 2,
    guests: 6,
    img: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
    description:
      "A glass-fronted chalet facing the Matterhorn, with a hot tub on the deck and a boot room by the door.",
    amenities: ["Free Wi-Fi", "Hot tub", "Kitchen", "Fireplace", "Ski storage"],
  },
];

export function findStay(id: string): Stay | undefined {
  return STAYS.find((stay) => stay.id === id);
}
