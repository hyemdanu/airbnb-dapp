import { useState, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';

export const useListings = () => {
  const { contracts, account, fromWei, toWei } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAllListings = useCallback(async () => {
    if (!contracts.listings) return [];

    setLoading(true);
    try {
      const counter = await contracts.listings.methods.listingCounter().call();
      const listings = [];

      for (let i = 1; i <= counter; i++) {
        try {
          const listing = await contracts.listings.methods.getListing(i).call();
          if (listing.isActive) {
            listings.push({
              id: listing.id.toString(),
              host: listing.host,
              name: listing.name,
              location: listing.location,
              propertyType: listing.propertyType,
              beds: listing.beds.toString(),
              pricePerNight: fromWei(listing.pricePerNight),
              isActive: listing.isActive
            });
          }
        } catch (err) {
          console.log('Error fetching listing ' + i);
        }
      }

      setError(null);
      return listings;
    } catch (err) {
      console.log('Error getting listings: ' + err.message);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contracts.listings, fromWei]);

  const createListing = useCallback(async (name, location, propertyType, beds, pricePerNightETH) => {
    if (!contracts.listings || !account) {
      throw new Error('Not connected');
    }

    setLoading(true);
    try {
      const priceInWei = toWei(pricePerNightETH);

      const tx = await contracts.listings.methods
        .createListing(name, location, propertyType, beds, priceInWei)
        .send({ from: account });

      setError(null);
      return tx;
    } catch (err) {
      console.log('Error creating listing: ' + err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.listings, account, toWei]);

  const deleteListing = useCallback(async (listingId) => {
    if (!contracts.listings || !account) {
      throw new Error('Not connected');
    }

    setLoading(true);
    try {
      const tx = await contracts.listings.methods
        .deleteListing(listingId)
        .send({ from: account });

      setError(null);
      return tx;
    } catch (err) {
      console.log('Error deleting listing: ' + err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.listings, account]);

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
          propertyType: listing.propertyType,
          beds: listing.beds.toString(),
          pricePerNight: fromWei(listing.pricePerNight),
          isActive: listing.isActive
        });
      }

      setError(null);
      return listings;
    } catch (err) {
      console.log('Error getting my listings: ' + err.message);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contracts.listings, account, fromWei]);

  const getAdmin = useCallback(async () => {
    if (!contracts.listings) return null;
    try {
      return await contracts.listings.methods.getAdmin().call();
    } catch (err) {
      return null;
    }
  }, [contracts.listings]);

  return {
    getAllListings,
    createListing,
    deleteListing,
    getMyListings,
    getAdmin,
    loading,
    error
  };
};

export const useBooking = () => {
  const { contracts, account, fromWei, toWei } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createBooking = useCallback(async (listingId, checkInDate, checkOutDate, totalPriceETH) => {
    if (!contracts.booking || !account) {
      throw new Error('Not connected');
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
      console.log('Error creating booking: ' + err.message);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.booking, account, toWei]);

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
          status: booking.status.toString()
        });
      }

      setError(null);
      return bookings;
    } catch (err) {
      console.log('Error getting bookings: ' + err.message);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contracts.booking, account, fromWei]);

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
          status: booking.status.toString()
        });
      }

      setError(null);
      return bookings;
    } catch (err) {
      console.log('Error getting host bookings: ' + err.message);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contracts.booking, account, fromWei]);

  const checkIn = useCallback(async (bookingId) => {
    if (!contracts.booking || !account) throw new Error('Not connected');

    setLoading(true);
    try {
      const tx = await contracts.booking.methods.checkIn(bookingId).send({ from: account });
      setError(null);
      return tx;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.booking, account]);

  const checkOut = useCallback(async (bookingId) => {
    if (!contracts.booking || !account) throw new Error('Not connected');

    setLoading(true);
    try {
      const tx = await contracts.booking.methods.checkOut(bookingId).send({ from: account });
      setError(null);
      return tx;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.booking, account]);

  const cancelBooking = useCallback(async (bookingId) => {
    if (!contracts.booking || !account) throw new Error('Not connected');

    setLoading(true);
    try {
      const tx = await contracts.booking.methods.cancelBooking(bookingId).send({ from: account });
      setError(null);
      return tx;
    } catch (err) {
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

export const useReviews = () => {
  const { contracts, account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createReview = useCallback(async (bookingId, rating, comment) => {
    if (!contracts.reviews || !account) throw new Error('Not connected');

    setLoading(true);
    try {
      const tx = await contracts.reviews.methods
        .createReview(bookingId, rating, comment)
        .send({ from: account });
      setError(null);
      return tx;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contracts.reviews, account]);

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
            createdAt: review.createdAt.toString()
          });
        }
      }

      setError(null);
      return reviews;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contracts.reviews]);

  return {
    createReview,
    getListingReviews,
    loading,
    error
  };
};
