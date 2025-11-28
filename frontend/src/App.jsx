/*
 * Main App - the homepage where you see all the listings
 * This is where guests browse properties and can filter/sort them
 */
import React, { useMemo, useState, useEffect } from 'react';
import { Toolbar } from './components/Toolbar.jsx';
import { ListingCard } from './components/ListingCard.jsx';
import { useWeb3 } from './context/Web3Context.jsx';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { LISTINGS } from './data/mock.js';

export default function App() {
  // grab wallet and contract stuff from our context
  const { contracts, loading: web3Loading, error: web3Error, account } = useWeb3();

  // all the listings we'll show
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // filter settings - what the user is searching for
  const [filters, setFilters] = useState({
    location: '',          // where they want to stay
    guests: 1,             // how many people
    price: [0, 1000],      // price range in ETH
    type: null,            // apartment, house, etc
    amenities: [],         // wifi, pool, etc
    rating: 0,             // minimum rating
    sort: 'recommended'    // how to sort results
  });

  // reset all filters back to default
  const reset = () => setFilters({
    location: '',
    guests: 1,
    price: [0, 1000],
    type: null,
    amenities: [],
    rating: 0,
    sort: 'recommended'
  });

  // grab all listings from the blockchain when the app loads
  useEffect(() => {
    const loadListings = async () => {
      // if contracts aren't loaded yet, just use our fake data
      if (!contracts.listings) {
        setListings(LISTINGS);
        return;
      }

      try {
        setLoadingListings(true);

        // get how many listings exist
        const count = await contracts.listings.methods.listingCount().call();
        const fetchedListings = [];

        // loop through and grab each one
        for (let i = 1; i <= count; i++) {
          const listing = await contracts.listings.methods.listings(i).call();

          // only show active listings (not deactivated ones)
          if (listing.isActive) {
            fetchedListings.push({
              id: i,
              title: listing.name,
              location: listing.location,
              pricePerNight: parseFloat(listing.pricePerNight) / 1e18, // convert wei to ETH
              owner: listing.owner,

              // TODO: add these to the smart contract later
              // for now just using placeholder values
              type: 'Apartment',
              beds: 2,
              baths: 1,
              guests: 4,
              rating: 4.5,
              reviewCount: 0,
              isSuperhost: false,
              images: ['https://placehold.co/800x600'],
              amenities: []
            });
          }
        }

        setListings(fetchedListings);
      } catch (err) {
        console.error('💥 Error loading listings:', err);
        // if something goes wrong, just show the mock data
        setListings(LISTINGS);
      } finally {
        setLoadingListings(false);
      }
    };

    loadListings();
  }, [contracts.listings]);

  // filter the listings based on what the user searched for
  const filtered = useMemo(() => listings.filter((p) => {
    // check if location matches (searches both location and title)
    const inLocation = filters.location
      ? p.location.toLowerCase().includes(filters.location.toLowerCase()) ||
        p.title.toLowerCase().includes(filters.location.toLowerCase())
      : true;

    // make sure it fits enough guests
    const inGuests = p.guests >= (filters.guests || 1);

    // check if price is in range
    const inPrice = p.pricePerNight >= filters.price[0] && p.pricePerNight <= filters.price[1];

    // filter by property type (apartment, house, etc)
    const inType = filters.type ? p.type === filters.type : true;

    // check if it has all the amenities they want
    const inAmenities = (filters.amenities?.length)
      ? filters.amenities.every(a => (p.amenities || []).includes(a))
      : true;

    // minimum rating check
    const inRating = (p.rating || 0) >= (filters.rating || 0);

    // only show if ALL filters match
    return inLocation && inGuests && inPrice && inType && inAmenities && inRating;
  }), [listings, filters]);

  // sort the filtered listings
  const sorted = useMemo(() => {
    const arr = filtered.slice(); // make a copy so we don't mutate the original

    switch (filters.sort) {
      case 'price-asc':
        arr.sort((a, b) => a.pricePerNight - b.pricePerNight); // cheapest first
        break;
      case 'price-desc':
        arr.sort((a, b) => b.pricePerNight - a.pricePerNight); // most expensive first
        break;
      case 'rating-desc':
        arr.sort((a, b) => (b.rating || 0) - (a.rating || 0)); // highest rated first
        break;
      default:
        // recommended: sort by rating, then number of reviews
        arr.sort((a, b) => {
          const ratingDiff = (b.rating || 0) - (a.rating || 0);
          return ratingDiff !== 0 ? ratingDiff : (b.reviewCount || 0) - (a.reviewCount || 0);
        });
    }

    return arr;
  }, [filtered, filters.sort]);

  // show loading spinner while web3 initializes
  if (web3Loading || loadingListings) {
    return (
      <main>
        <div className="wrap" style={{textAlign:'center', padding:'4rem'}}>
          <ProgressSpinner />
          <p className="text-600 mt-3">Loading blockchain data...</p>
        </div>
      </main>
    );
  }

  // show error if something's wrong with web3
  if (web3Error) {
    return (
      <main>
        <div className="wrap" style={{padding:'2rem'}}>
          <Message severity="warn" text={web3Error} />
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* top bar */}
      <div className="surface-card">
        <div className="wrap">
          <div className="flex align-items-center justify-content-between py-3">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-home text-primary text-xl" />
              <h2 className="m-0">StayFinder</h2>
            </div>
            <div className="flex align-items-center gap-3">
              {!contracts.listings && <span className="text-600 text-sm">(using mock data)</span>}
              {account && <span className="text-600 text-sm">{account.substring(0,6)}...{account.substring(account.length-4)}</span>}
              <div className="text-600">{sorted.length} stay{sorted.length === 1 ? '' : 's'} found</div>
            </div>
          </div>
        </div>
      </div>

      {/* filters */}
      <Toolbar filters={filters} setFilters={setFilters} onReset={reset} />

      {/* listings grid */}
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
