import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useBooking } from '../hooks/useContracts';

export function BookingModal({ visible, onHide, listing }) {
  const { createBooking, loading } = useBooking();

  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (checkInDate && checkOutDate && listing) {
      if (checkOutDate > checkInDate) {
        const diffTime = checkOutDate - checkInDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setNights(diffDays);
        setTotalPrice(diffDays * parseFloat(listing.pricePerNight));
      } else {
        setNights(0);
        setTotalPrice(0);
      }
    }
  }, [checkInDate, checkOutDate, listing]);

  const handleBook = async () => {
    try {
      setError(null);
      setSuccess(false);

      if (!checkInDate || !checkOutDate) {
        setError('Select check-in and check-out dates');
        return;
      }

      if (checkOutDate <= checkInDate) {
        setError('Check-out must be after check-in');
        return;
      }

      const checkInTimestamp = Math.floor(checkInDate.getTime() / 1000);
      const checkOutTimestamp = Math.floor(checkOutDate.getTime() / 1000);

      await createBooking(
        listing.id,
        checkInTimestamp,
        checkOutTimestamp,
        totalPrice.toString()
      );

      setSuccess(true);
      setTimeout(() => {
        onHide();
        resetForm();
      }, 2000);

    } catch (err) {
      console.log('Booking error: ' + err.message);
      setError(err.message || 'Failed to create booking');
    }
  };

  const resetForm = () => {
    setCheckInDate(null);
    setCheckOutDate(null);
    setNights(0);
    setTotalPrice(0);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  if (!listing) return null;

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={'Book: ' + (listing.title || listing.name)}
      style={{ width: '400px' }}
    >
      <div className="flex flex-column gap-3">
        <div className="surface-100 p-3 border-round">
          <div>Location: {listing.location}</div>
          <div>Price: {listing.pricePerNight} ETH / night</div>
        </div>

        <div>
          <label className="block text-sm mb-1">Check-in</label>
          <Calendar
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.value)}
            minDate={new Date()}
            showIcon
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Check-out</label>
          <Calendar
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.value)}
            minDate={checkInDate || new Date()}
            showIcon
            className="w-full"
            disabled={!checkInDate}
          />
        </div>

        {nights > 0 && (
          <div className="surface-100 p-3 border-round">
            <div>{nights} night(s) x {listing.pricePerNight} ETH</div>
            <div className="mt-2"><strong>Total: {totalPrice.toFixed(4)} ETH</strong></div>
          </div>
        )}

        {error && <Message severity="error" text={error} />}
        {success && <Message severity="success" text="Booking successful" />}

        <div className="flex gap-2 justify-content-end">
          <Button label="Cancel" severity="secondary" onClick={handleClose} disabled={loading} />
          <Button
            label={loading ? 'Processing...' : 'Confirm Booking'}
            onClick={handleBook}
            disabled={!checkInDate || !checkOutDate || nights < 1 || loading || success}
          />
        </div>
      </div>
    </Dialog>
  );
}
