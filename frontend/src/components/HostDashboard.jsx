import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Message } from 'primereact/message';
import { useListings, useBooking } from '../hooks/useContracts';
import { useWeb3 } from '../context/Web3Context';

export function HostDashboard({ visible, onHide }) {
  const { createListing, deleteListing, getAllListings, getMyListings, getAdmin, loading: listingsLoading } = useListings();
  const { getMyBookings, getHostBookings, loading: bookingLoading } = useBooking();
  const { account } = useWeb3();

  const [newListing, setNewListing] = useState({
    name: '',
    location: '',
    pricePerNight: 0.1,
    type: 'Apartment',
    beds: 1
  });

  const [allListings, setAllListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [incomingBookings, setIncomingBookings] = useState([]);
  const [adminAddress, setAdminAddress] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const typeOptions = [
    { label: 'Apartment', value: 'Apartment' },
    { label: 'House', value: 'House' },
    { label: 'Cabin', value: 'Cabin' },
    { label: 'Villa', value: 'Villa' },
    { label: 'Studio', value: 'Studio' }
  ];

  const isAdmin = account && adminAddress && account.toLowerCase() === adminAddress.toLowerCase();

  useEffect(() => {
    if (visible && account) {
      loadData();
    }
  }, [visible, account]);

  const loadData = async () => {
    try {
      const [all, mine, bookings, hostBookings, admin] = await Promise.all([
        getAllListings(),
        getMyListings(),
        getMyBookings(),
        getHostBookings(),
        getAdmin()
      ]);
      setAllListings(all);
      setMyListings(mine);
      setMyBookings(bookings);
      setIncomingBookings(hostBookings);
      setAdminAddress(admin);
    } catch (err) {
      console.log('Error loading data: ' + err.message);
    }
  };

  const handleCreateListing = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!newListing.name.trim()) {
        setError('Enter a listing name');
        return;
      }
      if (!newListing.location.trim()) {
        setError('Enter a location');
        return;
      }
      if (newListing.pricePerNight <= 0) {
        setError('Price must be greater than 0');
        return;
      }

      await createListing(
        newListing.name,
        newListing.location,
        newListing.type,
        newListing.beds,
        newListing.pricePerNight
      );

      setSuccess('Listing created');
      setNewListing({ name: '', location: '', pricePerNight: 0.1, type: 'Apartment', beds: 1 });

      setTimeout(() => {
        loadData();
        setSuccess(null);
      }, 1500);

    } catch (err) {
      console.log('Error creating listing: ' + err.message);
      setError(err.message || 'Failed to create listing');
    }
  };

  const handleDeleteListing = async (listingId) => {
    try {
      setError(null);
      await deleteListing(listingId);
      setSuccess('Listing deleted');
      setTimeout(() => {
        loadData();
        setSuccess(null);
      }, 1500);
    } catch (err) {
      console.log('Error deleting listing: ' + err.message);
      setError(err.message || 'Failed to delete listing');
    }
  };

  const canDelete = (listing) => {
    if (!account) return false;
    if (isAdmin) return true;
    return listing.host.toLowerCase() === account.toLowerCase();
  };

  const actionTemplate = (rowData) => {
    if (!canDelete(rowData)) return null;
    return (
      <Button
        label="Delete"
        size="small"
        severity="danger"
        onClick={() => handleDeleteListing(rowData.id)}
        disabled={listingsLoading}
      />
    );
  };

  const formatStatus = (status) => {
    const statusMap = { '0': 'Pending', '1': 'Checked In', '2': 'Completed', '3': 'Cancelled' };
    return statusMap[status] || status;
  };

  const formatDate = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Dashboard"
      style={{ width: '900px' }}
    >
      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      {isAdmin && (
        <div className="mb-3 p-2 surface-100 border-round">
          <strong>Admin Mode</strong> - You can delete any listing
        </div>
      )}

      <TabView>
        <TabPanel header="Create Listing">
          <div className="flex flex-column gap-3 p-3">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <InputText
                value={newListing.name}
                onChange={(e) => setNewListing({ ...newListing, name: e.target.value })}
                placeholder="Listing name"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Location</label>
              <InputText
                value={newListing.location}
                onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                placeholder="City, State"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Type</label>
              <Dropdown
                value={newListing.type}
                onChange={(e) => setNewListing({ ...newListing, type: e.value })}
                options={typeOptions}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Beds</label>
              <InputNumber
                value={newListing.beds}
                onValueChange={(e) => setNewListing({ ...newListing, beds: e.value })}
                min={1}
                max={20}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Price per Night (ETH)</label>
              <InputNumber
                value={newListing.pricePerNight}
                onValueChange={(e) => setNewListing({ ...newListing, pricePerNight: e.value })}
                minFractionDigits={2}
                maxFractionDigits={4}
                min={0.001}
                className="w-full"
              />
            </div>

            <Button
              label="Create Listing"
              onClick={handleCreateListing}
              loading={listingsLoading}
            />
          </div>
        </TabPanel>

        <TabPanel header="My Listings">
          <div className="p-3">
            {myListings.length === 0 ? (
              <div className="text-center p-4" style={{ color: '#666' }}>No listings yet</div>
            ) : (
              <DataTable value={myListings.filter(l => l.isActive)} size="small">
                <Column field="id" header="ID" />
                <Column field="name" header="Name" />
                <Column field="location" header="Location" />
                <Column field="propertyType" header="Type" />
                <Column field="beds" header="Beds" />
                <Column field="pricePerNight" header="Price" body={(row) => row.pricePerNight + ' ETH'} />
                <Column header="Actions" body={actionTemplate} />
              </DataTable>
            )}
          </div>
        </TabPanel>

        {isAdmin && (
          <TabPanel header="All Listings (Admin)">
            <div className="p-3">
              {allListings.length === 0 ? (
                <div className="text-center p-4" style={{ color: '#666' }}>No listings</div>
              ) : (
                <DataTable value={allListings} size="small">
                  <Column field="id" header="ID" />
                  <Column field="name" header="Name" />
                  <Column field="location" header="Location" />
                  <Column field="host" header="Host" body={(row) => row.host.substring(0, 10) + '...'} />
                  <Column field="pricePerNight" header="Price" body={(row) => row.pricePerNight + ' ETH'} />
                  <Column header="Actions" body={actionTemplate} />
                </DataTable>
              )}
            </div>
          </TabPanel>
        )}

        <TabPanel header="My Bookings">
          <div className="p-3">
            {myBookings.length === 0 ? (
              <div className="text-center p-4" style={{ color: '#666' }}>No bookings yet</div>
            ) : (
              <DataTable value={myBookings} size="small">
                <Column field="id" header="ID" />
                <Column field="listingId" header="Listing" />
                <Column field="checkInDate" header="Check-in" body={(row) => formatDate(row.checkInDate)} />
                <Column field="checkOutDate" header="Check-out" body={(row) => formatDate(row.checkOutDate)} />
                <Column field="totalPrice" header="Total" body={(row) => row.totalPrice + ' ETH'} />
                <Column field="status" header="Status" body={(row) => formatStatus(row.status)} />
              </DataTable>
            )}
          </div>
        </TabPanel>

        <TabPanel header="Incoming Bookings">
          <div className="p-3">
            {incomingBookings.length === 0 ? (
              <div className="text-center p-4" style={{ color: '#666' }}>No incoming bookings</div>
            ) : (
              <DataTable value={incomingBookings} size="small">
                <Column field="id" header="ID" />
                <Column field="listingId" header="Listing" />
                <Column field="guest" header="Guest" body={(row) => row.guest.substring(0, 10) + '...'} />
                <Column field="checkInDate" header="Check-in" body={(row) => formatDate(row.checkInDate)} />
                <Column field="checkOutDate" header="Check-out" body={(row) => formatDate(row.checkOutDate)} />
                <Column field="totalPrice" header="Total" body={(row) => row.totalPrice + ' ETH'} />
                <Column field="status" header="Status" body={(row) => formatStatus(row.status)} />
              </DataTable>
            )}
          </div>
        </TabPanel>
      </TabView>
    </Dialog>
  );
}
