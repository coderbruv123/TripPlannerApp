import { useState } from "react";

interface Recommendation {
  id: number;
  name: string;
  subtitle: string;
  category: string;
  destination: string;
  rating: number;
  reviews: string;
  status: "Published" | "Draft";
  updated: string;
  image: string;
}

const recommendations: Recommendation[] = [
  {
    id: 1,
    name: "Eiffel Tower Night Tour",
    subtitle: "Exclusive VIP Access",
    category: "Attractions",
    destination: "Paris, France",
    rating: 4.9,
    reviews: "2.4k",
    status: "Published",
    updated: "2 hours ago",
    image:
      "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: 2,
    name: "Ichiran Ramen Shibuya",
    subtitle: "Authentic Tonkotsu",
    category: "Restaurants",
    destination: "Tokyo, Japan",
    rating: 4.8,
    reviews: "8.1k",
    status: "Draft",
    updated: "Oct 12, 2023",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: 3,
    name: "Aman Tokyo Retreat",
    subtitle: "5-Star Luxury",
    category: "Hotels",
    destination: "Tokyo, Japan",
    rating: 5.0,
    reviews: "412",
    status: "Published",
    updated: "Oct 10, 2023",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80",
  },
];

const categories = [
  "All",
  "Attractions",
  "Restaurants",
  "Hotels",
  "Activities",
  "Experiences",
  "Travel Tips",
];

const categoryIcons: Record<string, string> = {
  Attractions: "attractions",
  Restaurants: "restaurant",
  Hotels: "hotel",
  Activities: "directions_run",
  Experiences: "explore",
  "Travel Tips": "lightbulb",
};

export default function RecommendationsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filteredRecommendations = recommendations.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;

    const searchValue = search.toLowerCase();

    const matchesSearch =
      item.name.toLowerCase().includes(searchValue) ||
      item.destination.toLowerCase().includes(searchValue) ||
      item.category.toLowerCase().includes(searchValue);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0b1511] text-[#d9e5de] font-[Manrope,sans-serif]">
      <div className="mx-auto w-full max-w-[1600px] p-6 md:p-8 flex flex-col gap-8">

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#d9e5de]">
              Recommendations
            </h1>

            <p className="text-sm md:text-base text-[#bec9bf]">
              Manage content users see as travel suggestions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#88948a] text-[20px]">
                search
              </span>

              <input
                type="text"
                placeholder="Search entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
                  w-full sm:w-64
                  rounded-lg
                  border border-[#1B3428]
                  bg-[#0b1511]
                  py-2.5 pl-10 pr-4
                  text-sm text-[#d9e5de]
                  placeholder:text-[#88948a]
                  outline-none
                  transition-all
                  focus:border-[#7cd9a6]
                  focus:ring-1
                  focus:ring-[#7cd9a6]/50
                "
              />
            </div>

            {/* Add Recommendation */}
            <button
              className="
                flex items-center justify-center gap-2
                rounded-[10px]
                bg-[#44a173]
                px-5 py-2.5
                text-sm font-semibold
                text-[#00311c]
                shadow-[0_0_15px_rgba(68,161,115,0.15)]
                transition-all
                hover:brightness-110
              "
            >
              <span className="material-symbols-outlined text-[20px]">
                add
              </span>

              Add Recommendation
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((category) => {
            const active = activeCategory === category;

            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`
                  rounded-full
                  border
                  px-4 py-2
                  text-xs font-semibold
                  transition-all
                  ${
                    active
                      ? "border-[#7cd9a6] bg-[#7cd9a6]/10 text-[#7cd9a6]"
                      : "border-[#1B3428] text-[#bec9bf] hover:border-[#7cd9a6]/50 hover:text-[#d9e5de]"
                  }
                `}
              >
                {category}
              </button>
            );
          })}

          {/* Filters */}
          <div className="ml-auto">
            <button
              className="
                flex items-center gap-2
                rounded-lg
                border border-[#1B3428]
                px-3 py-2
                text-xs font-medium
                text-[#bec9bf]
                transition-colors
                hover:bg-[#2c3732]/30
              "
            >
              <span className="material-symbols-outlined text-[16px]">
                filter_list
              </span>

              Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          className="
            flex flex-col
            overflow-hidden
            rounded-xl
            border border-[#1B3428]
            bg-[#0b1511]
            shadow-lg shadow-black/20
          "
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-[#1B3428] bg-[#06100C]">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#d9e5de]">
                    Image
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#d9e5de]">
                    Recommendation Name
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#d9e5de]">
                    Category
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#d9e5de]">
                    Destination
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#d9e5de]">
                    Rating
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#d9e5de]">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#d9e5de]">
                    Last Updated
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#d9e5de]">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-[#1B3428]">
                {filteredRecommendations.length > 0 ? (
                  filteredRecommendations.map((recommendation) => (
                    <RecommendationRow
                      key={recommendation.id}
                      recommendation={recommendation}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-[#88948a]"
                    >
                      No recommendations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className="
              flex flex-col gap-4
              border-t border-[#1B3428]
              bg-[#06100C]
              px-6 py-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <p className="text-sm text-[#bec9bf]">
              Showing 1 to {filteredRecommendations.length} of 45
              recommendations
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled
                className="
                  rounded-md
                  border border-[#1B3428]
                  p-1.5
                  text-[#88948a]
                  opacity-50
                "
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
              </button>

              <button
                className="
                  flex h-8 w-8 items-center justify-center
                  rounded-md
                  border border-[#7cd9a6]/30
                  bg-[#7cd9a6]/20
                  text-xs font-semibold
                  text-[#7cd9a6]
                "
              >
                1
              </button>

              <button
                className="
                  flex h-8 w-8 items-center justify-center
                  rounded-md
                  text-xs font-semibold
                  text-[#bec9bf]
                  transition-colors
                  hover:bg-[#2c3732]
                "
              >
                2
              </button>

              <button
                className="
                  flex h-8 w-8 items-center justify-center
                  rounded-md
                  text-xs font-semibold
                  text-[#bec9bf]
                  transition-colors
                  hover:bg-[#2c3732]
                "
              >
                3
              </button>

              <span className="px-1 text-[#88948a]">...</span>

              <button
                className="
                  rounded-md
                  border border-[#1B3428]
                  p-1.5
                  text-[#bec9bf]
                  transition-colors
                  hover:bg-[#2c3732]
                  hover:text-[#d9e5de]
                "
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ------------------------------------------------ */
/* Recommendation Row                               */
/* ------------------------------------------------ */

function RecommendationRow({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const isPublished = recommendation.status === "Published";

  return (
    <tr className="group cursor-default transition-colors hover:bg-[#7cd9a6]/5">
      {/* Image */}
      <td className="px-6 py-3">
        <div
          className="
            h-14 w-14
            overflow-hidden
            rounded-lg
            border border-[#1B3428]
            transition-colors
            group-hover:border-[#7cd9a6]/30
          "
        >
          <img
            src={recommendation.image}
            alt={recommendation.name}
            className="h-full w-full object-cover"
          />
        </div>
      </td>

      {/* Name */}
      <td className="px-6 py-3">
        <p className="text-sm font-semibold text-[#d9e5de]">
          {recommendation.name}
        </p>

        <p className="mt-0.5 text-xs text-[#bec9bf]">
          {recommendation.subtitle}
        </p>
      </td>

      {/* Category */}
      <td className="px-6 py-3">
        <span
          className="
            inline-flex items-center gap-1.5
            rounded-md
            border border-[#1B3428]
            bg-[#2c3732]
            px-2.5 py-1
            text-xs font-medium
            text-[#d9e5de]
          "
        >
          <span
            className={`
              material-symbols-outlined
              text-[14px]
              ${
                recommendation.category === "Restaurants"
                  ? "text-[#bbcac2]"
                  : recommendation.category === "Hotels"
                  ? "text-[#44a173]"
                  : "text-[#7cd9a6]"
              }
            `}
          >
            {categoryIcons[recommendation.category] || "explore"}
          </span>

          {recommendation.category}
        </span>
      </td>

      {/* Destination */}
      <td className="px-6 py-3 text-sm text-[#d9e5de]">
        {recommendation.destination}
      </td>

      {/* Rating */}
      <td className="px-6 py-3">
        <div className="flex items-center gap-1">
          <span
            className="material-symbols-outlined text-[16px] text-yellow-500"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>

          <span className="mt-0.5 text-xs font-semibold text-[#d9e5de]">
            {recommendation.rating}
          </span>

          <span className="ml-1 text-xs text-[#bec9bf]">
            ({recommendation.reviews})
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-3">
        {isPublished ? (
          <span
            className="
              inline-flex items-center gap-1.5
              rounded-full
              border border-[#6edc9c]/20
              bg-[#6edc9c]/15
              px-2.5 py-1
              text-[11px] font-medium
              text-[#6edc9c]
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#6edc9c] shadow-[0_0_5px_rgba(110,220,156,0.8)]" />
            Published
          </span>
        ) : (
          <span
            className="
              inline-flex items-center gap-1.5
              rounded-full
              border border-[#1B3428]
              bg-[#2c3732]
              px-2.5 py-1
              text-[11px] font-medium
              text-[#bec9bf]
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#88948a]" />
            Draft
          </span>
        )}
      </td>

      {/* Updated */}
      <td className="px-6 py-3 text-xs text-[#d9e5de]">
        {recommendation.updated}
      </td>

      {/* Actions */}
      <td className="px-6 py-3">
        <div
          className="
            flex items-center justify-end gap-2
            opacity-60
            transition-opacity
            group-hover:opacity-100
          "
        >
          {/* Edit */}
          <button
            title="Edit"
            className="
              rounded-md p-1.5
              text-[#bec9bf]
              transition-colors
              hover:bg-[#2c3732]/50
              hover:text-[#7cd9a6]
            "
          >
            <span className="material-symbols-outlined text-[18px]">
              edit
            </span>
          </button>

          {/* Publish / Unpublish */}
          <button
            title={isPublished ? "Unpublish" : "Publish"}
            className="
              rounded-md p-1.5
              text-[#bec9bf]
              transition-colors
              hover:bg-[#2c3732]/50
              hover:text-[#6edc9c]
            "
          >
            <span className="material-symbols-outlined text-[18px]">
              {isPublished ? "visibility_off" : "visibility"}
            </span>
          </button>

          {/* Feature */}
          <button
            title="Feature"
            className="
              rounded-md p-1.5
              text-[#bec9bf]
              transition-colors
              hover:bg-[#2c3732]/50
              hover:text-[#7cd9a6]
            "
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{
                fontVariationSettings: "'FILL' 1",
              }}
            >
              push_pin
            </span>
          </button>

          {/* Delete */}
          <button
            title="Delete"
            className="
              rounded-md p-1.5
              text-[#bec9bf]
              transition-colors
              hover:bg-red-500/10
              hover:text-[#ffb4ab]
            "
          >
            <span className="material-symbols-outlined text-[18px]">
              delete
            </span>
          </button>
        </div>
      </td>
    </tr>
  );
}