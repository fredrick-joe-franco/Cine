import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, Play } from "lucide-react";

// Simple Modal Component
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="relative bg-white/10 backdrop-blur-3xl border border-white/20 shadow-2xl rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
          <Play className="w-6 h-6 text-blue-400" /> {title}
        </h2>
        <div className="text-white">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// Simple in-memory providers cache to avoid refetching the same provider list
// Entries are { data, ts }
const providersCache = new Map();
const PROVIDER_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Modern, accessible select/dropdown built with Tailwind
function ModernSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  className = "",
  id,
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(-1);
  const ref = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const uidRef = useRef(Math.random().toString(36).slice(2));
  const [menuVisible, setMenuVisible] = useState(false);
  const closeTimer = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      const el = e.target;
      const clickedInsideControl = ref.current.contains(el);
      const clickedInsideMenu = menuRef.current && menuRef.current.contains(el);
      if (!clickedInsideControl && !clickedInsideMenu) closeMenu();
    }
    function onOtherOpen(e) {
      const otherId = e?.detail?.uid;
      if (otherId && otherId !== uidRef.current) closeMenu();
    }
    // use pointerdown for more reliable outside detection (captures before focus changes)
    window.addEventListener("pointerdown", onDoc);
    window.addEventListener("modern-select-open", onOtherOpen);
    return () => {
      window.removeEventListener("pointerdown", onDoc);
      window.removeEventListener("modern-select-open", onOtherOpen);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function closeMenu() {
    if (!open) return;
    setMenuVisible(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 160);
  }

  const selected = options.find((o) => String(o.value) === String(value));

  function toggle() {
    if (!open) {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect();
        setMenuStyle({
          left: r.left + window.scrollX,
          top: r.bottom + window.scrollY,
          width: r.width,
        });
      }
      setOpen(true);
      // notify other ModernSelects to close
      window.dispatchEvent(
        new CustomEvent("modern-select-open", {
          detail: { uid: uidRef.current },
        })
      );
    } else {
      closeMenu();
    }
  }

  function handleKey(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setFocused((f) => Math.min(f + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((f) => Math.max(f - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && focused >= 0) onChange(options[focused].value);
      closeMenu();
    } else if (e.key === "Escape") {
      closeMenu();
    }
  }

  useEffect(() => {
    if (!open) {
      setFocused(-1);
      setMenuVisible(false);
      return;
    }
    requestAnimationFrame(() => setMenuVisible(true));
    setFocused(-1);
  }, [open]);

  return (
    <div
      ref={ref}
      className={`relative inline-block text-left ${className}`}
      onKeyDown={handleKey}
      id={id}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className="relative flex items-center gap-2 w-full min-w-[140px] justify-between bg-white/5 text-white rounded px-3 py-1 hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        style={{ zIndex: 110000 }}
      >
        <span
          className={`truncate text-sm ${
            selected ? "text-blue-300" : "text-white/70"
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            open ? "-rotate-180" : "rotate-0"
          }`}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 8L10 12L14 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open &&
        menuStyle &&
        createPortal(
          <ul
            role="listbox"
            tabIndex={-1}
            ref={menuRef}
            style={{
              position: "absolute",
              left: menuStyle.left + "px",
              top: menuStyle.top + "px",
              width: menuStyle.width + "px",
              zIndex: 120000,
            }}
            className={`bg-white/6 backdrop-blur-sm border border-white/10 rounded shadow-lg max-h-56 overflow-auto pointer-events-auto transform transition-all duration-150 ${
              menuVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2"
            }`}
          >
            {options.map((opt, i) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <li
                  key={opt.value + "-opt"}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setFocused(i)}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onChange(opt.value);
                    closeMenu();
                  }}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "text-white/95 hover:bg-blue-600/20"
                  } ${i === focused && !isSelected ? "bg-white/10" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    {opt.logo ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w45${opt.logo}`}
                        alt={opt.label}
                        className="w-6 h-6 rounded"
                      />
                    ) : (
                      <span className="w-6 h-6 bg-white/10 rounded" />
                    )}
                    <span>{opt.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}

export default function StreamScoutApp() {
  const API_KEY = "9e84044a5f9b5d0253c4e9708178a155";
  const [query, setQuery] = useState("");
  const [type, setType] = useState("movie");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("release_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterMinDate, setFilterMinDate] = useState("");
  const [filterMaxDate, setFilterMaxDate] = useState("");
  const [filterMinRating, setFilterMinRating] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [availableProviders, setAvailableProviders] = useState([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  function compareDates(a, b) {
    if (!a) return 1;
    if (!b) return -1;
    return new Date(a) - new Date(b);
  }

  function sortResults(arr) {
    return [...arr].sort((a, b) => {
      let aDate = a.release_date || a.first_air_date || "";
      let bDate = b.release_date || b.first_air_date || "";
      if (sortBy === "release_date") {
        const cmp = compareDates(aDate, bDate);
        return sortOrder === "desc" ? -cmp : cmp;
      } else if (sortBy === "vote_average") {
        const cmp = (b.vote_average || 0) - (a.vote_average || 0);
        return sortOrder === "desc" ? cmp : -cmp;
      }
      return 0;
    });
  }

  function filterResults(arr) {
    const today = new Date().toISOString().slice(0, 10);
    return arr.filter((item) => {
      let date = item.release_date || item.first_air_date || "";
      let rating = item.vote_average || 0;
      if (!date || date > today) return false;
      if (filterMinDate && date) if (date < filterMinDate) return false;
      if (filterMaxDate && date) if (date > filterMaxDate) return false;
      if (filterMinRating && rating < parseFloat(filterMinRating)) return false;
      return true;
    });
  }

  async function fetchProvidersAllCountries(id, mediaType) {
    const key = `${mediaType}:${id}`;
    if (providersCache.has(key)) return providersCache.get(key);
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${id}/watch/providers?api_key=${API_KEY}`
      );
      if (!res.ok) return {};
      const data = await res.json();
      const results = data.results || {};
      providersCache.set(key, results);
      return results;
    } catch {
      providersCache.set(key, {});
      return {};
    }
  }

  async function searchTitles() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    setAvailableProviders([]);
    setProviderFilter("");
    try {
      let movieData = { results: [] };
      let tvData = { results: [] };
      if (type === "movie") {
        const movieRes = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
            query
          )}`
        );
        if (!movieRes.ok) throw new Error("API request failed");
        movieData = await movieRes.json();
      }
      if (type === "series" || type === "tv") {
        const tvRes = await fetch(
          `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(
            query
          )}`
        );
        if (!tvRes.ok) throw new Error("API request failed");
        tvData = await tvRes.json();
      }

      let combined = [
        ...(movieData.results || []).map((r) => ({
          ...r,
          media_type: "movie",
        })),
        ...(tvData.results || []).map((r) => ({ ...r, media_type: "tv" })),
      ];

      combined = filterResults(combined);
      combined = sortResults(combined);

      const withProviders = await Promise.all(
        combined.map(async (item) => {
          const providers = await fetchProvidersAllCountries(
            item.id,
            item.media_type
          );
          // compute top providers (unique by id) across countries, include logo path
          const top = [];
          const seen = new Set();
          Object.values(providers || {}).forEach((prov) => {
            (prov.flatrate || []).forEach((p) => {
              if (top.length >= 3) return;
              if (!seen.has(p.provider_id)) {
                seen.add(p.provider_id);
                top.push({
                  id: p.provider_id,
                  name: p.provider_name,
                  logo: p.logo_path,
                });
              }
            });
          });
          return { ...item, providers, topProviders: top };
        })
      );

      // collect providers with logo info (use map to dedupe by id)
      const provMap = new Map();
      withProviders.forEach((item) => {
        if (!item.providers) return;
        Object.values(item.providers).forEach((prov) => {
          (prov.flatrate || []).forEach((p) => {
            if (!provMap.has(p.provider_id))
              provMap.set(p.provider_id, {
                value: String(p.provider_id),
                label: p.provider_name,
                logo: p.logo_path,
              });
          });
        });
      });
      setAvailableProviders(
        Array.from(provMap.values()).sort((a, b) =>
          a.label.localeCompare(b.label)
        )
      );
      setResults(withProviders);
    } catch (e) {
      setError("Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const displayedResults = useMemo(() => {
    return results.filter((item) => {
      if (!providerFilter) return true;
      if (!item.providers) return false;
      return Object.values(item.providers).some((prov) =>
        (prov.flatrate || []).some(
          (p) =>
            String(p.provider_id) === String(providerFilter) ||
            p.provider_name === providerFilter
        )
      );
    });
  }, [results, providerFilter]);

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white p-6 overflow-x-hidden">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">StreamScout</h1>
        <p className="text-white/70">
          Find where to watch your favorite Movies & TV Shows
        </p>
      </header>

      <div className="flex flex-col items-center mb-12 gap-4 w-full">
        {/* Primary search row: keep minimal and prominent */}
        <div className="flex items-center gap-3 bg-white/6 backdrop-blur-md border border-white/10 rounded-full px-4 py-3 shadow-lg w-full max-w-3xl">
          <ModernSelect
            value={type}
            onChange={(v) => setType(v)}
            options={[
              { value: "movie", label: "Movies" },
              { value: "series", label: "TV Shows" },
            ]}
            placeholder="Type"
            className="pr-2 border-r border-white/10"
          />

          <input
            type="text"
            placeholder="Search for a title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchTitles()}
            className="flex-1 bg-transparent text-white placeholder-white/60 focus:outline-none px-4 py-1 text-lg"
            aria-label="Search titles"
          />

          <button
            className="ml-2 p-2 rounded-full bg-blue-500 hover:bg-blue-600 transition shadow"
            onClick={searchTitles}
            disabled={loading}
            aria-label="Search"
          >
            {loading ? (
              <span className="w-5 h-5 animate-spin border-2 border-white border-t-transparent rounded-full inline-block" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Advanced filters toggle */}
        <div className="w-full max-w-3xl flex items-center justify-between">
          <button
            onClick={() => setAdvancedOpen((s) => !s)}
            className="flex items-center gap-2 text-sm text-white/80 px-3 py-1 rounded hover:bg-white/3 transition"
            aria-expanded={advancedOpen}
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                advancedOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 8L10 12L14 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Advanced filters
          </button>

          <div className="flex items-center gap-3">
            {availableProviders.length > 0 ? (
              <ModernSelect
                value={providerFilter}
                onChange={(v) => setProviderFilter(v)}
                options={[
                  { value: "", label: "All providers" },
                  ...availableProviders,
                ]}
                placeholder="Provider"
                className="backdrop-blur-sm"
              />
            ) : (
              <div className="text-white/60">
                Provider: <span className="ml-1 text-white/50">—</span>
              </div>
            )}
          </div>
        </div>

        {/* Advanced panel (collapsible) */}
        <div
          className={`w-full max-w-3xl transition-all duration-200 ${
            advancedOpen
              ? "h-auto opacity-100 mt-3"
              : "h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="bg-white/4 border border-white/6 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-white/80 w-24">Sort</label>
              <ModernSelect
                value={sortBy}
                onChange={(v) => setSortBy(v)}
                options={[
                  { value: "release_date", label: "Release Date" },
                  { value: "vote_average", label: "Rating" },
                ]}
                placeholder="Sort by"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-white/80 w-24">Order</label>
              <ModernSelect
                value={sortOrder}
                onChange={(v) => setSortOrder(v)}
                options={[
                  { value: "desc", label: "Descending" },
                  { value: "asc", label: "Ascending" },
                ]}
                placeholder="Order"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-white/80 w-24">Min date</label>
              <input
                type="date"
                value={filterMinDate}
                onChange={(e) => setFilterMinDate(e.target.value)}
                className="bg-white/6 text-white rounded px-2 py-1 focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-white/80 w-24">Max date</label>
              <input
                type="date"
                value={filterMaxDate}
                onChange={(e) => setFilterMaxDate(e.target.value)}
                className="bg-white/6 text-white rounded px-2 py-1 focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-white/80 w-24">Min rating</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={filterMinRating}
                onChange={(e) => setFilterMinRating(e.target.value)}
                className="bg-white/6 text-white rounded px-2 py-1 focus:outline-none w-full"
                placeholder="0"
              />
            </div>

            <div className="sm:col-span-2 text-right">
              <button
                onClick={() => {
                  setFilterMinDate("");
                  setFilterMaxDate("");
                  setFilterMinRating("");
                  setSortBy("release_date");
                  setSortOrder("desc");
                }}
                className="text-sm text-white/70 hover:text-white transition"
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="text-center text-red-400 mb-4">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {displayedResults.length === 0 && !loading ? (
          <div className="col-span-full text-center text-white/70 py-12">
            No results found.
          </div>
        ) : (
          displayedResults.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              className="cursor-pointer relative group overflow-hidden rounded-xl shadow-lg transform transition-transform hover:scale-105"
            >
              <img
                src={
                  item.poster_path
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                    : "/vite.svg"
                }
                alt={item.title || item.name}
                className="w-full h-72 object-cover"
              />
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-3">
                <h3 className="text-lg font-semibold">
                  {item.title || item.name}
                </h3>
                <p className="text-white/60 text-sm">
                  {item.release_date || item.first_air_date || ""}
                </p>
                {item.topProviders && item.topProviders.length > 0 && (
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {item.topProviders.map((p) => (
                      <img
                        key={p.id}
                        src={
                          p.logo
                            ? `https://image.tmdb.org/t/p/w45${p.logo}`
                            : "/vite.svg"
                        }
                        alt={p.name}
                        className="w-6 h-6 rounded bg-white/5"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || selected?.name}
      >
        {selected && <ModalProviderTable selected={selected} />}
      </Modal>
    </div>
  );
}

// ModalProviderTable component defined after StreamScoutApp
function ModalProviderTable({ selected }) {
  const [serviceFilter, setServiceFilter] = useState("");
  // Use the browser's Intl API for country names when available
  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames(["en"], { type: "region" });
    } catch (e) {
      return null;
    }
  }, []);

  const getCountryName = (code) => {
    if (!code) return code || "Unknown";
    if (regionNames) return regionNames.of(code) || code;
    return code;
  };

  // Build a flat list of provider options (deduped)
  const providerOptions = useMemo(() => {
    const providers = selected?.providers || {};
    const map = new Map();
    Object.values(providers).forEach((entry) => {
      ["flatrate", "buy", "rent", "ads", "free"].forEach((kind) => {
        (entry[kind] || []).forEach((p) => {
          if (!map.has(p.provider_id)) {
            map.set(p.provider_id, {
              value: String(p.provider_id),
              label: p.provider_name,
              logo: p.logo_path,
            });
          }
        });
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [selected]);

  // Rows grouped by country
  const rows = useMemo(() => {
    const providers = selected?.providers || {};
    return Object.keys(providers)
      .sort((a, b) => getCountryName(a).localeCompare(getCountryName(b)))
      .map((countryCode) => {
        const entry = providers[countryCode] || {};
        const services = [];
        ["flatrate", "buy", "rent", "ads", "free"].forEach((kind) => {
          (entry[kind] || []).forEach((s) => {
            if (
              !serviceFilter ||
              String(s.provider_id) === String(serviceFilter)
            ) {
              services.push(s);
            }
          });
        });
        return {
          country: countryCode,
          countryName: getCountryName(countryCode),
          services,
        };
      })
      .filter((r) => r.services.length > 0);
  }, [selected, serviceFilter, regionNames]);

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="text-sm text-white/80">Availability by country</div>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-white/70">Filter provider:</label>
          {providerOptions.length > 0 ? (
            <ModernSelect
              value={serviceFilter}
              onChange={(v) => setServiceFilter(v)}
              options={[
                { value: "", label: "All providers" },
                ...providerOptions,
              ]}
              className="min-w-[180px] backdrop-blur-sm"
              id="modal-provider-filter"
            />
          ) : (
            <span className="text-white/60 ml-2">No providers</span>
          )}
        </div>
      </div>

      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
        {rows.length === 0 ? (
          <div className="text-white/60 py-6 text-center">
            No provider info found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-white/90">
              <thead>
                <tr className="text-left text-white/70">
                  <th className="px-3 py-2">Country</th>
                  <th className="px-3 py-2">Providers</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.country}
                    className="align-top border-t border-white/6"
                  >
                    <td className="px-3 py-3 font-semibold whitespace-nowrap">
                      {row.countryName}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.services.length > 0 ? (
                          row.services.map((s) => (
                            <span
                              key={s.provider_id}
                              className="inline-flex items-center gap-2 bg-white/10 px-2 py-1 rounded"
                            >
                              {s.logo_path ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w45${s.logo_path}`}
                                  alt={s.provider_name}
                                  className="w-6 h-6 rounded"
                                />
                              ) : (
                                <span className="w-6 h-6 bg-white/10 rounded" />
                              )}
                              <span className="text-sm">{s.provider_name}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-white/60">Not available</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
