// App shell: holds filters state, applies filtering/sorting, renders grid
import React, { useMemo, useState } from 'react';
import { Toolbar } from './components/Toolbar.jsx';
import { ListingCard } from './components/ListingCard.jsx';
import { LISTINGS } from './data/mock.js';

export default function App() {
  // Centralized filter state for the dashboard
  const [filters, setFilters] = useState({
    location: '',
    guests: 1,
    price: [0, 1000],
    type: null,
    amenities: [],
    rating: 0,
    sort: 'recommended'
  });

  // Reset all filters to their defaults
  const reset = () => setFilters({ location: '', guests: 1, price: [0, 1000], type: null, amenities: [], rating: 0, sort: 'recommended' });

  // Apply filter criteria to our data set (memoized for performance)
  const filtered = useMemo(() => LISTINGS.filter((p) => {
    const inLocation = filters.location
      ? p.location.toLowerCase().includes(filters.location.toLowerCase()) || p.title.toLowerCase().includes(filters.location.toLowerCase())
      : true;
    const inGuests = p.guests >= (filters.guests || 1);
    const inPrice = p.pricePerNight >= filters.price[0] && p.pricePerNight <= filters.price[1];
    const inType = filters.type ? p.type === filters.type : true;
    const inAmenities = (filters.amenities?.length)
      ? filters.amenities.every(a => (p.amenities || []).includes(a))
      : true;
    const inRating = (p.rating || 0) >= (filters.rating || 0);
    return inLocation && inGuests && inPrice && inType && inAmenities && inRating;
  }), [filters]);

  // Sort the filtered list based on the chosen strategy
  const sorted = useMemo(() => {
    const arr = filtered.slice();
    switch (filters.sort) {
      case 'price-asc':
        arr.sort((a, b) => a.pricePerNight - b.pricePerNight); break;
      case 'price-desc':
        arr.sort((a, b) => b.pricePerNight - a.pricePerNight); break;
      case 'rating-desc':
        arr.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      default:
        arr.sort((a, b) => {
          const r = (b.rating || 0) - (a.rating || 0);
          return r !== 0 ? r : (b.reviewCount || 0) - (a.reviewCount || 0);
        });
    }
    return arr;
  }, [filtered, filters.sort]);

  return (
    <main>
      {/* Top bar with brand and results count */}
      <div className="surface-card">
        <div className="wrap">
          <div className="flex align-items-center justify-content-between py-3">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-home text-primary text-xl" />
              <h2 className="m-0">StayFinder</h2>
            </div>
            <div className="text-600">{sorted.length} stay{sorted.length === 1 ? '' : 's'} found</div>
          </div>
        </div>
      </div>

      {/* Filters toolbar (PrimeReact inputs) */}
      <Toolbar filters={filters} setFilters={setFilters} onReset={reset} />

      {/* Responsive grid of listing cards */}
      <div className="wrap">
        <div className="grid mt-3">
          {sorted.length === 0 && (
            <div className="col-12">
              <div className="p-4 border-200 border-round border-1 text-600">No stays match your filters.</div>
            </div>
          )}
          {sorted.map((p) => (
            <div key={p.id} className="col-12 md:col-4 lg:col-3 p-2">
              <ListingCard p={p} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
