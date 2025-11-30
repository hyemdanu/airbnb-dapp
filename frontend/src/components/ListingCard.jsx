import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { BookingModal } from './BookingModal.jsx';

export function ListingCard({ listing, currentAccount }) {
  const [showBooking, setShowBooking] = useState(false);

  const isOwnListing = currentAccount && listing.host &&
    currentAccount.toLowerCase() === listing.host.toLowerCase();

  const formatAddress = (addr) => {
    if (!addr) return '';
    return addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
  };

  return (
    <>
      <BookingModal
        visible={showBooking}
        onHide={() => setShowBooking(false)}
        listing={listing}
      />
      <Card className="h-full">
        <div className="mb-2">
          <strong>{listing.name}</strong>
        </div>
        <div className="text-sm mb-1" style={{ color: '#666' }}>{listing.location}</div>
        {listing.propertyType && <div className="text-sm mb-1" style={{ color: '#666' }}>{listing.propertyType}</div>}
        {listing.beds && listing.beds !== '0' && <div className="text-sm mb-1" style={{ color: '#666' }}>{listing.beds} bed(s)</div>}
        <div className="text-sm mb-2" style={{ color: '#666' }}>Host: {formatAddress(listing.host)}</div>

        <div className="flex align-items-center justify-content-between mt-3">
          <div><strong>{listing.pricePerNight} ETH</strong> / night</div>
          {isOwnListing ? (
            <span className="text-sm" style={{ color: '#888' }}>Your listing</span>
          ) : (
            <Button
              label="Book"
              size="small"
              onClick={() => setShowBooking(true)}
            />
          )}
        </div>
      </Card>
    </>
  );
}
