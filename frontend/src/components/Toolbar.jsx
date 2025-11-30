import React from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

export function Toolbar({ filters, setFilters, onReset }) {
  const typeOptions = [
    { label: 'Any', value: null },
    { label: 'Apartment', value: 'Apartment' },
    { label: 'House', value: 'House' },
    { label: 'Cabin', value: 'Cabin' },
    { label: 'Villa', value: 'Villa' },
    { label: 'Studio', value: 'Studio' }
  ];

  return (
    <div className="surface-card p-3">
      <div className="wrap">
        <div className="grid align-items-end">
          <div className="col-12 md:col-3">
            <label className="block text-600 text-sm mb-1">Location</label>
            <InputText
              value={filters.location}
              onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
              placeholder="City or region"
              className="w-full"
            />
          </div>

          <div className="col-6 md:col-2">
            <label className="block text-600 text-sm mb-1">Type</label>
            <Dropdown
              value={filters.type}
              onChange={(e) => setFilters(f => ({ ...f, type: e.value }))}
              options={typeOptions}
              placeholder="Any"
              className="w-full"
            />
          </div>

          <div className="col-6 md:col-2">
            <label className="block text-600 text-sm mb-1">Beds</label>
            <InputNumber
              value={filters.beds}
              onValueChange={(e) => setFilters(f => ({ ...f, beds: e.value || 0 }))}
              min={0}
              max={10}
              className="w-full"
              placeholder="Any"
            />
          </div>

          <div className="col-6 md:col-2">
            <label className="block text-600 text-sm mb-1">Max Price (ETH)</label>
            <InputNumber
              value={filters.maxPrice}
              onValueChange={(e) => setFilters(f => ({ ...f, maxPrice: e.value || 100 }))}
              min={0}
              max={100}
              minFractionDigits={1}
              maxFractionDigits={2}
              className="w-full"
            />
          </div>

          <div className="col-6 md:col-1">
            <Button label="Reset" outlined onClick={onReset} className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
