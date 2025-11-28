import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { useListings, useBooking } from '../hooks/useContracts';
import { useWeb3 } from '../context/Web3Context';

/*
 * HostDashboard - full control panel for property hosts
 * Lets hosts create listings and manage bookings
*/
export function HostDashboard({ visible, onHide }) {
  const { createListing, getMyListings, loading: listingsLoading } = useListings();
  const { getHostBookings, checkOut, loading: bookingLoading } = useBooking();
  const { account, fromWei } = useWeb3();

  // State for creating a new listing
  const [newListing, setNewListing] = useState({
    name: '',
    location: '',
    pricePerNight: 0.1
  });

  // State for existing listings and bookings
  const [myListings, setMyListings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);

  // UI state
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load host's listings and bookings when dashboard opens
  useEffect(() => {
    if (visible && account) {
      loadDashboardData();
    }
  }, [visible, account]);

  // Fetch all host data
  const loadDashboardData = async () => {
    try {
      const [listings, bookings] = await Promise.all([
        getMyListings(),
        getHostBookings()
      ]);

      setMyListings(listings);
      setMyBookings(bookings);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  // Handle creating a new listing
  const handleCreateListing = async () => {
    try {
      setError(null);
      setSuccess(null);

      // Validation
      if (!newListing.name || newListing.name.trim() === '') {
        setError('Please enter a listing name');
        return;
      }

      if (!newListing.location || newListing.location.trim() === '') {
        setError('Please enter a location');
        return;
      }

      if (newListing.pricePerNight <= 0) {
        setError('Price must be greater than 0');
        return;
      }

      // Create the listing on blockchain
      await createListing(
        newListing.name,
        newListing.location,
        newListing.pricePerNight
      );

      setSuccess('Listing created successfully! 🎉');

      // Reset form
      setNewListing({
        name: '',
        location: '',
        pricePerNight: 0.1
      });

      // Reload listings
      setTimeout(() => {
        loadDashboardData();
        setSuccess(null);
      }, 2000);

    } catch (err) {
      console.error('Error creating listing:', err);
      setError(err.message || 'Failed to create listing');
    }
  };

  // Handle checking out a guest (releases payment)
  const handleCheckOut = async (bookingId) => {
    try {
      setError(null);
      await checkOut(bookingId);
      setSuccess('Guest checked out successfully! Payment released.');

      // Reload bookings
      setTimeout(() => {
        loadDashboardData();
        setSuccess(null);
      }, 2000);

    } catch (err) {
      console.error('Error checking out:', err);
      setError(err.message || 'Failed to check out guest');
    }
  };

  // Format booking status as colored tag
  const statusBodyTemplate = (rowData) => {
    const statusMap = {
      0: { label: 'Pending', severity: 'warning' },
      1: { label: 'Checked In', severity: 'info' },
      2: { label: 'Completed', severity: 'success' },
      3: { label: 'Cancelled', severity: 'danger' }
    };

    const status = statusMap[rowData.status] || { label: 'Unknown', severity: 'secondary' };

    return <Tag value={status.label} severity={status.severity} />;
  };

  // Format dates from timestamp
  const dateBodyTemplate = (rowData, field) => {
    const timestamp = field === 'checkIn' ? rowData.checkInDate : rowData.checkOutDate;
    const date = new Date(parseInt(timestamp) * 1000); // Convert Unix timestamp to Date
    return date.toLocaleDateString();
  };

  // Action buttons for bookings
  const actionBodyTemplate = (rowData) => {
    const canCheckOut = rowData.status === '0' || rowData.status === '1'; // Pending or CheckedIn
    const isPastCheckout = Date.now() / 1000 >= parseInt(rowData.checkOutDate);

    return (
      <Button
        label="Check Out"
        icon="pi pi-sign-out"
        size="small"
        onClick={() => handleCheckOut(rowData.id)}
        disabled={!canCheckOut || !isPastCheckout}
        tooltip={!isPastCheckout ? 'Checkout date not reached yet' : ''}
      />
    );
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Host Dashboard"
      style={{ width: '90vw', maxWidth: '1200px' }}
      maximizable
      dismissableMask
    >
      {/* Success/Error messages */}
      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      <TabView>
        {/* Tab 1: Create New Listing */}
        <TabPanel header="Create Listing" leftIcon="pi pi-plus-circle mr-2">
          <div className="flex flex-column gap-4 p-3">
            <div>
              <label className="block text-600 text-sm mb-2">Listing Name *</label>
              <InputText
                value={newListing.name}
                onChange={(e) => setNewListing({ ...newListing, name: e.target.value })}
                placeholder="e.g., Cozy Beach House"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-600 text-sm mb-2">Location *</label>
              <InputText
                value={newListing.location}
                onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                placeholder="e.g., Miami Beach, FL"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-600 text-sm mb-2">Price per Night (ETH) *</label>
              <InputNumber
                value={newListing.pricePerNight}
                onValueChange={(e) => setNewListing({ ...newListing, pricePerNight: e.value })}
                minFractionDigits={2}
                maxFractionDigits={4}
                min={0.001}
                step={0.01}
                className="w-full"
                placeholder="0.1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                label="Create Listing"
                icon="pi pi-check"
                onClick={handleCreateListing}
                loading={listingsLoading}
              />
              <Button
                label="Clear"
                icon="pi pi-times"
                severity="secondary"
                onClick={() => setNewListing({ name: '', location: '', pricePerNight: 0.1 })}
              />
            </div>

            <div className="text-xs text-500">
              <i className="pi pi-info-circle mr-1" />
              You'll need to confirm the transaction in MetaMask
            </div>
          </div>
        </TabPanel>

        {/* Tab 2: My Listings */}
        <TabPanel header="My Listings" leftIcon="pi pi-home mr-2">
          <div className="p-3">
            {myListings.length === 0 ? (
              <div className="text-center p-5 text-600">
                <i className="pi pi-inbox text-4xl mb-3" />
                <p>You haven't created any listings yet.</p>
              </div>
            ) : (
              <DataTable value={myListings} paginator rows={5} responsiveLayout="scroll">
                <Column field="id" header="ID" style={{ width: '80px' }} />
                <Column field="name" header="Name" />
                <Column field="location" header="Location" />
                <Column
                  field="pricePerNight"
                  header="Price/Night"
                  body={(rowData) => `${rowData.pricePerNight} ETH`}
                />
                <Column
                  field="isActive"
                  header="Status"
                  body={(rowData) => (
                    <Tag
                      value={rowData.isActive ? 'Active' : 'Inactive'}
                      severity={rowData.isActive ? 'success' : 'danger'}
                    />
                  )}
                />
              </DataTable>
            )}
          </div>
        </TabPanel>

        {/* Tab 3: Bookings */}
        <TabPanel header="Bookings" leftIcon="pi pi-calendar mr-2">
          <div className="p-3">
            {myBookings.length === 0 ? (
              <div className="text-center p-5 text-600">
                <i className="pi pi-calendar-times text-4xl mb-3" />
                <p>No bookings yet.</p>
              </div>
            ) : (
              <DataTable value={myBookings} paginator rows={5} responsiveLayout="scroll">
                <Column field="id" header="Booking ID" style={{ width: '100px' }} />
                <Column field="listingId" header="Listing ID" style={{ width: '100px' }} />
                <Column
                  field="guest"
                  header="Guest"
                  body={(rowData) => `${rowData.guest.substring(0, 10)}...`}
                />
                <Column
                  field="checkInDate"
                  header="Check-in"
                  body={(rowData) => dateBodyTemplate(rowData, 'checkIn')}
                />
                <Column
                  field="checkOutDate"
                  header="Check-out"
                  body={(rowData) => dateBodyTemplate(rowData, 'checkOut')}
                />
                <Column
                  field="totalPrice"
                  header="Total"
                  body={(rowData) => `${rowData.totalPrice} ETH`}
                />
                <Column field="status" header="Status" body={statusBodyTemplate} />
                <Column header="Actions" body={actionBodyTemplate} />
              </DataTable>
            )}
          </div>
        </TabPanel>
      </TabView>
    </Dialog>
  );
}
