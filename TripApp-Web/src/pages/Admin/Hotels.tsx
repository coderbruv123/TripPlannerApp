import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import AdminSidebar from "../../components/AdminComponents/AdminSidebar";
import AdminTopbar from "../../components/AdminComponents/AdminTopbar";
import api from "../../api/axiosInstance";

type Hotel = {
  id: number;
  name: string;
  address?: string;
  city: string;
  latitude: number;
  longitude: number;
  stars?: number;
  website?: string;
  phone?: string;
  estimatedPricePerNight?: number | null;
};

const emptyForm = {
  name: "",
  city: "",
  address: "",
  stars: "",
  estimatedPricePerNight: "",
  website: "",
  phone: "",
  latitude: "",
  longitude: "",
};

export default function AdminHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => {
    api
      .get<Hotel[]>("/hotels")
      .then((res) => setHotels(res.data || []))
      .catch((err) => {
        console.error("Failed to load hotels:", err);
        setError("Unable to load hotels.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const set = (field: keyof typeof emptyForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim() || undefined,
      website: form.website.trim() || undefined,
      phone: form.phone.trim() || undefined,
      stars: form.stars ? Number(form.stars) : undefined,
      estimatedPricePerNight: form.estimatedPricePerNight
        ? Number(form.estimatedPricePerNight)
        : undefined,
      latitude: form.latitude ? Number(form.latitude) : 0,
      longitude: form.longitude ? Number(form.longitude) : 0,
    };

    try {
      await api.post("/hotels", payload);
      setMessage("Hotel added.");
      setForm(emptyForm);
      load();
    } catch (err) {
      console.error("Failed to add hotel:", err);
      setError("Failed to add hotel. Check the values and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this hotel?")) return;

    try {
      await api.delete(`/hotels/${id}`);
      setHotels((current) =>
        current.filter((h) => h.id !== id)
      );
    } catch (err) {
      console.error("Failed to delete hotel:", err);
      setError("Failed to delete hotel.");
    }
  };

  const inputClass =
    "w-full bg-[#0D1A15] border border-[#1B3428] text-[#d9e5de] rounded-lg px-3 py-2 text-sm outline-none transition-all placeholder:text-[#bec9bf]/50 focus:border-[#48B77B] focus:ring-2 focus:ring-[#48B77B]/20";

  return (
    <div className="min-h-screen bg-[#07110D] text-[#d9e5de] antialiased">
      <AdminSidebar />

      <main className="flex min-h-screen flex-col md:ml-[260px]">
        <AdminTopbar />

        <div className="flex-1 overflow-x-hidden p-4 md:p-8">
          <div className="mb-8">
            <h2 className="text-[30px] leading-[38px] font-bold text-[#d9e5de]">
              Hotels
            </h2>
            <p className="mt-1 text-[14px] text-[#bec9bf]">
              Manage the featured hotels shown on the site.
            </p>
          </div>

          {message && (
            <div className="mb-4 rounded-lg border border-[#48B77B]/40 bg-[#48B77B]/10 px-4 py-2 text-sm text-[#7cd9a6]">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 px-4 py-2 text-sm text-[#ffb4ab]">
              {error}
            </div>
          )}

          {/* Add form */}
          <form
            onSubmit={submit}
            className="mb-8 rounded-xl border border-[#1B3428] bg-[#0B1511] p-6"
          >
            <h3 className="mb-4 text-base font-semibold text-[#D9E5DE]">
              Add a hotel
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <input
                required
                value={form.name}
                onChange={set("name")}
                placeholder="Hotel name"
                className={inputClass}
              />
              <input
                required
                value={form.city}
                onChange={set("city")}
                placeholder="City"
                className={inputClass}
              />
              <input
                value={form.address}
                onChange={set("address")}
                placeholder="Address"
                className={inputClass}
              />
              <input
                value={form.stars}
                onChange={set("stars")}
                placeholder="Stars (1-5)"
                type="number"
                min={1}
                max={5}
                className={inputClass}
              />
              <input
                value={form.estimatedPricePerNight}
                onChange={set("estimatedPricePerNight")}
                placeholder="Price / night"
                type="number"
                min={0}
                className={inputClass}
              />
              <input
                value={form.website}
                onChange={set("website")}
                placeholder="Website"
                className={inputClass}
              />
              <input
                value={form.phone}
                onChange={set("phone")}
                placeholder="Phone"
                className={inputClass}
              />
              <input
                value={form.latitude}
                onChange={set("latitude")}
                placeholder="Latitude"
                type="number"
                step="any"
                className={inputClass}
              />
              <input
                value={form.longitude}
                onChange={set("longitude")}
                placeholder="Longitude"
                type="number"
                step="any"
                className={inputClass}
              />
            </div>

            <button
              disabled={saving}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#2F8F62] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              <Plus size={16} />
              {saving ? "Adding…" : "Add hotel"}
            </button>
          </form>

          {/* List */}
          {loading ? (
            <p className="py-8 text-center text-sm text-[#bec9bf]">
              Loading hotels…
            </p>
          ) : hotels.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#1B3428] bg-[#0B1511] p-8 text-center text-sm text-[#bec9bf]">
              No hotels yet. Add your first one above.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#1B3428]">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#1B3428] bg-[#06100C]">
                    <th className="px-6 py-3 text-[12px] font-semibold uppercase text-[#bec9bf]">
                      Name
                    </th>
                    <th className="px-6 py-3 text-[12px] font-semibold uppercase text-[#bec9bf]">
                      City
                    </th>
                    <th className="px-6 py-3 text-[12px] font-semibold uppercase text-[#bec9bf]">
                      Stars
                    </th>
                    <th className="px-6 py-3 text-[12px] font-semibold uppercase text-[#bec9bf]">
                      Price / night
                    </th>
                    <th className="px-6 py-3 text-right text-[12px] font-semibold uppercase text-[#bec9bf]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B3428]">
                  {hotels.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-[#2F8F62]/[0.04]">
                      <td className="px-6 py-3 text-sm font-medium text-white">
                        {hotel.name}
                      </td>
                      <td className="px-6 py-3 text-sm text-[#d9e5de]">
                        {hotel.city}
                      </td>
                      <td className="px-6 py-3 text-sm text-[#d9e5de]">
                        {hotel.stars ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-[#7cd9a6]">
                        {hotel.estimatedPricePerNight != null
                          ? `$${Math.round(hotel.estimatedPricePerNight)}`
                          : "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => remove(hotel.id)}
                          className="inline-flex items-center rounded-md p-1.5 text-[#bec9bf] transition hover:bg-[#ffb4ab]/10 hover:text-[#ffb4ab]"
                          title="Delete hotel"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
