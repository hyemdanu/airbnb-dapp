// property card with booking button
import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Rating } from 'primereact/rating';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { BookingModal } from './BookingModal.jsx';

export function ListingCard({ p }) {
  const [showBooking, setShowBooking] = useState(false);

  return (
    <>
      <BookingModal
        visible={showBooking}
        onHide={() => setShowBooking(false)}
        listing={p}
      />
      <Card className="h-full" title={
        // card title: listing name + rating
        <div className="flex align-items-center justify-content-between">
          <span className="text-900 line-height-3" style={{maxWidth:'75%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.title}</span>
          <div className="flex align-items-center gap-2">
            <Rating value={p.rating} readOnly cancel={false} stars={5} />
            <span className="text-600">({p.reviewCount||0})</span>
          </div>
        </div>
      } header={
        // image with superhost badge and wishlist heart
        <div className="relative" style={{aspectRatio:'4/3', overflow:'hidden'}}>
          <img src={(p.images && p.images[0]) || 'https://placehold.co/800x600'} alt={`${p.title} photo`} style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
          {p.isSuperhost ? <Tag value="Superhost" severity="contrast" style={{position:'absolute', top:8, left:8}} /> : null}
          <Button icon="pi pi-heart" rounded text aria-label="Save" style={{position:'absolute', top:8, right:8}} />
        </div>
      }>
        {/* details and price */}
        <div className="text-600 mb-2">{p.location} • {p.type} • {p.beds} bd • {p.baths} ba • {p.guests} guests</div>
        <div className="flex align-items-center justify-content-between">
          <div className="text-900"><strong>{p.pricePerNight} ETH</strong> night</div>
          <Button
            label="Book"
            size="small"
            onClick={() => setShowBooking(true)}
          />
        </div>
      </Card>
    </>
  );
}
