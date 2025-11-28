import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useBooking } from '../hooks/useContracts';
import { useWeb3 } from '../context/Web3Context';

// booking popup - pick dates, see price, and book the place
export function BookingModal({ visible, onHide, listing }) {
  const { createBooking, loading } = useBooking();
  const { account } = useWeb3();

  // when are you staying?
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);

  // pricing stuff
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [protocolFee, setProtocolFee] = useState(0);

  // status
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState(null);

  // recalc price when dates change
  useEffect(() => {
    if (checkInDate && checkOutDate && listing) {
      // checkout gotta be after checkin
      if (checkOutDate > checkInDate) {
        // how many nights?
        const diffTime = checkOutDate - checkInDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setNights(diffDays);

        // what's it gonna cost?
        const total = diffDays * parseFloat(listing.pricePerNight);
        setTotalPrice(total);

        // platform takes 2.5%
        const fee = total * 0.025;
        setProtocolFee(fee);
      } else {
        setNights(0);
        setTotalPrice(0);
        setProtocolFee(0);
      }
    }
  }, [checkInDate, checkOutDate, listing]);

  // book it!
  const handleBook = async () => {
    try {
      setError(null);
      setSuccess(false);

      // make sure dates are good
      if (!checkInDate || !checkOutDate) {
        setError('Pick your dates first');
        return;
      }

      if (checkOutDate <= checkInDate) {
        setError('Check-out needs to be after check-in');
        return;
      }

      if (nights < 1) {
        setError('Need at least 1 night');
        return;
      }

      // convert to unix timestamps for the contract
      const checkInTimestamp = Math.floor(checkInDate.getTime() / 1000);
      const checkOutTimestamp = Math.floor(checkOutDate.getTime() / 1000);

      // send it to the blockchain
      const tx = await createBooking(
        listing.id,
        checkInTimestamp,
        checkOutTimestamp,
        totalPrice.toString()
      );

      // nice! it worked
      setSuccess(true);
      setTxHash(tx.transactionHash);

      // close after 3 sec
      setTimeout(() => {
        onHide();
        resetForm();
      }, 3000);

    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to create booking');
    }
  };

  // clear everything out
  const resetForm = () => {
    setCheckInDate(null);
    setCheckOutDate(null);
    setNights(0);
    setTotalPrice(0);
    setProtocolFee(0);
    setError(null);
    setSuccess(false);
    setTxHash(null);
  };

  // x button clicked
  const handleClose = () => {
    resetForm();
    onHide();
  };

  if (!listing) return null;

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={`Book ${listing.title || listing.name}`}
      style={{ width: '500px' }}
      dismissableMask
    >
      <div className="flex flex-column gap-4">
        {/* listing details */}
        <div className="surface-100 p-3 border-round">
          <div className="flex justify-content-between mb-2">
            <span className="text-600">Location:</span>
            <span className="font-semibold">{listing.location}</span>
          </div>
          <div className="flex justify-content-between mb-2">
            <span className="text-600">Price per night:</span>
            <span className="font-semibold">{listing.pricePerNight} ETH</span>
          </div>
          <div className="flex justify-content-between">
            <span className="text-600">Host:</span>
            <span className="font-semibold text-xs">{(listing.owner || listing.host || '').substring(0, 10)}...</span>
          </div>
        </div>

        {/* Date pickers */}
        <div>
          <label className="block text-600 text-sm mb-2">Check-in Date</label>
          <Calendar
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.value)}
            minDate={new Date()} // Can't book in the past
            showIcon
            dateFormat="mm/dd/yy"
            className="w-full"
            placeholder="Select check-in date"
          />
        </div>

        <div>
          <label className="block text-600 text-sm mb-2">Check-out Date</label>
          <Calendar
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.value)}
            minDate={checkInDate || new Date()} // Must be after check-in
            showIcon
            dateFormat="mm/dd/yy"
            className="w-full"
            placeholder="Select check-out date"
            disabled={!checkInDate}
          />
        </div>

        {/* Price breakdown - only show if dates are selected */}
        {nights > 0 && (
          <div className="surface-100 p-3 border-round">
            <div className="flex justify-content-between mb-2">
              <span className="text-600">
                {listing.pricePerNight} ETH × {nights} night{nights > 1 ? 's' : ''}
              </span>
              <span className="font-semibold">{totalPrice.toFixed(4)} ETH</span>
            </div>
            <div className="flex justify-content-between mb-2">
              <span className="text-600">Platform fee (2.5%)</span>
              <span className="font-semibold">{protocolFee.toFixed(4)} ETH</span>
            </div>
            <div className="border-top-1 border-300 pt-2 mt-2">
              <div className="flex justify-content-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary text-lg">{totalPrice.toFixed(4)} ETH</span>
              </div>
              <div className="text-xs text-500 mt-1">
                (You pay the full amount, host receives {(totalPrice - protocolFee).toFixed(4)} ETH)
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <Message severity="error" text={error} className="w-full" />
        )}

        {/* Success message */}
        {success && (
          <Message
            severity="success"
            text={
              <div>
                <div>Booking successful! 🎉</div>
                {txHash && (
                  <div className="text-xs mt-1">TX: {txHash.substring(0, 20)}...</div>
                )}
              </div>
            }
            className="w-full"
          />
        )}

        {/* Action buttons */}
        <div className="flex gap-2 justify-content-end">
          <Button
            label="Cancel"
            severity="secondary"
            onClick={handleClose}
            disabled={loading}
          />
          <Button
            label={loading ? 'Processing...' : 'Confirm Booking'}
            icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
            onClick={handleBook}
            disabled={!checkInDate || !checkOutDate || nights < 1 || loading || success}
          />
        </div>

        {/* Info note */}
        {!success && (
          <div className="text-xs text-500 text-center mt-2">
            <i className="pi pi-info-circle mr-1" />
            You'll need to confirm this transaction in MetaMask
          </div>
        )}
      </div>
    </Dialog>
  );
}
