// Filters toolbar built with PrimeReact components
import React from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Slider } from 'primereact/slider';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';

export function Toolbar({ filters, setFilters, onReset }) {
  // Select options for filters
  const typeOptions = ['Apartment','House','Cabin','Villa','Studio'].map(t => ({ label: t, value: t }));
  const amenityOptions = [
    { label: 'Wifi', value: 'wifi' },
    { label: 'Kitchen', value: 'kitchen' },
    { label: 'Parking', value: 'parking' },
    { label: 'A/C', value: 'ac' },
    { label: 'Pool', value: 'pool' },
    { label: 'Fireplace', value: 'fireplace' }
  ];
  const ratingOptions = [
    { label: 'Any', value: 0 },
    { label: '3+', value: 3 },
    { label: '4+', value: 4 },
    { label: '4.5+', value: 4.5 }
  ];
  const sortOptions = [
    { label: 'Recommended', value: 'recommended' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Rating', value: 'rating-desc' }
  ];

  return (
    // Sticky container keeps filters visible while scrolling
    <div className="surface-card sticky top-0 z-5">
      <div className="wrap">
        <div className="p-2"></div>
        <div className="grid align-items-end">
          <div className="col-12 md:col-3 md:align-self-start">
            <label className="block text-600 text-sm mb-1">Location</label>
            {/* Update location search string */}
            <InputText value={filters.location} onChange={(e)=>setFilters(f=>({...f, location: e.target.value}))} placeholder="City, region" className="w-full" />
          </div>
          <div className="col-6 md:col-2 md:align-self-start">
            <label className="block text-600 text-sm mb-1">Guests</label>
            {/* Numeric input with stepper buttons */}
            <InputNumber value={filters.guests} onValueChange={(e)=>setFilters(f=>({...f, guests: e.value||1}))} min={1} className="w-full" showButtons buttonLayout="horizontal" decrementButtonClassName="p-button-text" incrementButtonClassName="p-button-text" />
          </div>
          <div className="col-10 md:col-3 md:col-offset-2 md:align-self-start">
            <label className="block text-600 text-sm mb-1">Price Range</label>
            <div className="flex align-items-center gap-3">
              <span className="text-600">${filters.price[0]}</span>
              {/* Range slider controlling min/max nightly price */}
              <Slider value={filters.price} onChange={(e)=>setFilters(f=>({...f, price: e.value}))} range min={0} max={1000} className="flex-1" />
              <span className="text-600">${filters.price[1]}</span>
            </div>
          </div>
          <div className="col-6 md:col-2 md:align-self-start">
            <label className="block text-600 text-sm mb-1">Type</label>
            {/* Single select with clear option */}
            <Dropdown value={filters.type} onChange={(e)=>setFilters(f=>({...f, type: e.value}))} options={typeOptions} placeholder="Any" className="w-full" showClear />
          </div>
          <div className="col-12 md:col-4 md:align-self-start">
            <label className="block text-600 text-sm mb-1">Amenities</label>
            {/* Multi-select shows chosen items as chips */}
            <MultiSelect value={filters.amenities} onChange={(e)=>setFilters(f=>({...f, amenities: e.value}))} options={amenityOptions} placeholder="Select amenities" className="w-full" display="chip" />
          </div>
          <div className="col-6 md:col-2 md:align-self-start">
            <label className="block text-600 text-sm mb-1">Min Rating</label>
            <Dropdown value={filters.rating} onChange={(e)=>setFilters(f=>({...f, rating: e.value}))} options={ratingOptions} className="w-full" />
          </div>
          <div className="col-6 md:col-2 md:align-self-start">
            <label className="block text-600 text-sm mb-1">Sort</label>
            <Dropdown value={filters.sort} onChange={(e)=>setFilters(f=>({...f, sort: e.value}))} options={sortOptions} className="w-full" />
          </div>
          <div className="col-12 md:col-1 flex md:justify-content-end">
            {/* Clear and restore default filter values */}
            <Button label="Reset" outlined onClick={onReset} className="w-full md:w-auto" />
          </div>
        </div>
        <div className="p-1"></div>
      </div>
    </div>
  );
}
