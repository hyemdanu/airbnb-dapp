import { useState, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';

// Hook for Listings contract interactions
export const useListings = () => {
  const { contracts, account, fromWei, toWei } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all listings (by iterating through counter)
  const getAllListings = useCallback(async () => {
    if (!contracts.listings) return [];

    setLoading(true);
    try {
      const counter = await contracts.listings.methods.listingCounter().call();
      const listings = [];

      for (let i = 1; i <= counter; i++) {
        try {
          const listing = await contracts.listings.methods.getListing(i).call();
          listings.push({
            id: listing.id.toString(),
            host: listing.host,
            name: listing.name,
            location: listing.location,
            pricePerNight: fromWei(listing.pricePerNight),
            isActive: listing.isActive
          });
        } catch (err) {
          console.error(`Error fetching listing ${i}:`, err);
        }
      }

      setError(null);
      return listings;
    } catch (err) {
      console.error('Error getting listings:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contracts.listings, fromWei]);

  // Create a new listing
  const createListing = useCallback(async (name, location, pricePerNightETH) => {
    if (!contracts.listings || !account) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const priceInWei = toWei(pricePerNightETH);

      const tx = await contracts.listings.methods
        .createListing(name, location, priceInWei)
        .send({ from: account });

      setError(null);
      return tx;
    } catch (err) {
      console.error('Error creating listing:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.listings, account, toWei]);

  // Get user's listings
  const getMyListings = useCallback(async () => {
    if (!contracts.listings || !account) return [];

    setLoading(true);
    try {
      const listingIds = await contracts.listings.methods.getHostListings(account).call();
      const listings = [];

      for (const id of listingIds) {
        const listing = await contracts.listings.methods.getListing(id).call();
        listings.push({
          id: listing.id.toString(),
          host: listing.host,
          name: listing.name,
          location: listing.location,
          pricePerNight: fromWei(listing.pricePerNight),
          isActive: listing.isActive
        });
      }

      setError(null);
      return listings;
    } catch (err) {
      console.error('Error getting my listings:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contracts.listings, account, fromWei]);

  return {
    getAllListings,
    createListing,
    getMyListings,
    loading,
    error
  };
};

// Hook for Booking contract interactions
export const useBooking = () => {
  const { contracts, account, fromWei, toWei } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create a booking
  const createBooking = useCallback(async (listingId, checkInDate, checkOutDate, totalPriceETH) => {
    if (!contracts.booking || !account) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const valueInWei = toWei(totalPriceETH);

      const tx = await contracts.booking.methods
        .createBooking(listingId, checkInDate, checkOutDate)
        .send({ from: account, value: valueInWei });

      setError(null);
      return tx;
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.booking, account, toWei]);

  // Get user's bookings as guest
  const getMyBookings = useCallback(async () => {
    if (!contracts.booking || !account) return [];

    setLoading(true);
    try {
      const bookingIds = await contracts.booking.methods.getGuestBookings(account).call();
      const bookings = [];

      for (const id of bookingIds) {
        const booking = await contracts.booking.methods.getBooking(id).call();
        bookings.push({
          id: booking.id.toString(),
          listingId: booking.listingId.toString(),
          guest: booking.guest,
          host: booking.host,
          checkInDate: booking.checkInDate.toString(),
          checkOutDate: booking.checkOutDate.toString(),
          totalPrice: fromWei(booking.totalPrice),
          status: booking.status
        });
      }

      setError(null);
      return bookings;
    } catch (err) {
      console.error('Error getting my bookings:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contracts.booking, account, fromWei]);

  // Get bookings as host
  const getHostBookings = useCallback(async () => {
    if (!contracts.booking || !account) return [];

    setLoading(true);
    try {
      const bookingIds = await contracts.booking.methods.getHostBookings(account).call();
      const bookings = [];

      for (const id of bookingIds) {
        const booking = await contracts.booking.methods.getBooking(id).call();
        bookings.push({
          id: booking.id.toString(),
          listingId: booking.listingId.toString(),
          guest: booking.guest,
          host: booking.host,
          checkInDate: booking.checkInDate.toString(),
          checkOutDate: booking.checkOutDate.toString(),
          totalPrice: fromWei(booking.totalPrice),
          status: booking.status
        });
      }

      setError(null);
      return bookings;
    } catch (err) {
      console.error('Error getting host bookings:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contracts.booking, account, fromWei]);

  // Check in
  const checkIn = useCallback(async (bookingId) => {
    if (!contracts.booking || !account) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const tx = await contracts.booking.methods
        .checkIn(bookingId)
        .send({ from: account });

      setError(null);
      return tx;
    } catch (err) {
      console.error('Error checking in:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.booking, account]);

  // Check out
  const checkOut = useCallback(async (bookingId) => {
    if (!contracts.booking || !account) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const tx = await contracts.booking.methods
        .checkOut(bookingId)
        .send({ from: account });

      setError(null);
      return tx;
    } catch (err) {
      console.error('Error checking out:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.booking, account]);

  // Cancel booking
  const cancelBooking = useCallback(async (bookingId) => {
    if (!contracts.booking || !account) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const tx = await contracts.booking.methods
        .cancelBooking(bookingId)
        .send({ from: account });

      setError(null);
      return tx;
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.booking, account]);

  return {
    createBooking,
    getMyBookings,
    getHostBookings,
    checkIn,
    checkOut,
    cancelBooking,
    loading,
    error
  };
};

// Hook for Reviews contract interactions
export const useReviews = () => {
  const { contracts, account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create a review
  const createReview = useCallback(async (bookingId, rating, comment) => {
    if (!contracts.reviews || !account) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const tx = await contracts.reviews.methods
        .createReview(bookingId, rating, comment)
        .send({ from: account });

      setError(null);
      return tx;
    } catch (err) {
      console.error('Error creating review:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.reviews, account]);

  // Get reviews for a listing
  const getListingReviews = useCallback(async (listingId) => {
    if (!contracts.reviews) return [];

    setLoading(true);
    try {
      const reviewIds = await contracts.reviews.methods.getListingReviews(listingId).call();
      const reviews = [];

      for (const id of reviewIds) {
        const review = await contracts.reviews.methods.getReview(id).call();
        if (review.isActive) {
          reviews.push({
            id: review.id.toString(),
            listingId: review.listingId.toString(),
            reviewer: review.reviewer,
            rating: review.rating.toString(),
            comment: review.comment,
            createdAt: review.createdAt.toString(),
            isActive: review.isActive
          });
        }
      }

      setError(null);
      return reviews;
    } catch (err) {
      console.error('Error getting listing reviews:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contracts.reviews]);

  // Get average rating for a listing
  const getAverageRating = useCallback(async (listingId) => {
    if (!contracts.reviews) return 0;

    setLoading(true);
    try {
      const avgRating = await contracts.reviews.methods.getListingAverageRating(listingId).call();
      // Divide by 100 since contract returns rating * 100
      setError(null);
      return parseFloat(avgRating) / 100;
    } catch (err) {
      console.error('Error getting average rating:', err);
      setError(err.message);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [contracts.reviews]);

  // Get review count
  const getReviewCount = useCallback(async (listingId) => {
    if (!contracts.reviews) return 0;

    try {
      const count = await contracts.reviews.methods.getListingReviewCount(listingId).call();
      return parseInt(count);
    } catch (err) {
      console.error('Error getting review count:', err);
      return 0;
    }
  }, [contracts.reviews]);

  return {
    createReview,
    getListingReviews,
    getAverageRating,
    getReviewCount,
    loading,
    error
  };
};
