import React, { useState, useEffect, useMemo } from 'react';
import { Toolbar } from './components/Toolbar.jsx';
import { ListingCard } from './components/ListingCard.jsx';
import { HostDashboard } from './components/HostDashboard.jsx';
import TransactionLogPanel from './components/TransactionLogPanel.jsx';
import { useWeb3 } from './context/Web3Context.jsx';
import { useListings } from './hooks/useContracts.js';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';

export default function App() {
  const { contracts, loading: web3Loading, error: web3Error, account, switchToAccount, getGanacheAccounts } = useWeb3();
  const { getAllListings } = useListings();

  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);

  const [filters, setFilters] = useState({
    location: '',
    type: null,
    beds: 0,
    maxPrice: 100
  });

  const reset = () => setFilters({
    location: '',
    type: null,
    beds: 0,
    maxPrice: 100
  });

  const loadListings = async () => {
    if (!contracts.listings) {
      setListings([]);
      return;
    }

    try {
      setLoadingListings(true);
      const fetchedListings = await getAllListings();
      setListings(fetchedListings);
      console.log('Loaded ' + fetchedListings.length + ' listings');
    } catch (err) {
      console.log('Error loading listings: ' + err.message);
      setListings([]);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [contracts.listings]);

  const filtered = useMemo(() => {
    return listings.filter((p) => {
      if (filters.location && !p.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
      if (filters.type && p.propertyType !== filters.type) {
        return false;
      }
      if (filters.beds > 0 && parseInt(p.beds) < filters.beds) {
        return false;
      }
      if (parseFloat(p.pricePerNight) > filters.maxPrice) {
        return false;
      }
      return true;
    });
  }, [listings, filters]);

  const accounts = getGanacheAccounts ? getGanacheAccounts() : [];
  const accountOptions = accounts.map((acc, i) => ({
    label: 'User ' + i + ' (' + (acc.balance?.toFixed(2) || '?') + ' ETH)',
    value: i
  }));
  const currentAccountIndex = accounts.findIndex(acc => acc.address === account);

  const handleAccountSwitch = async (e) => {
    try {
      await switchToAccount(e.value);
      window.location.reload();
    } catch (err) {
      console.log('Error switching account: ' + err.message);
    }
  };

  if (web3Loading || loadingListings) {
    return (
      <main>
        <div className="wrap" style={{ textAlign: 'center', padding: '4rem' }}>
          <ProgressSpinner />
          <p className="mt-3" style={{ color: '#666' }}>Loading...</p>
        </div>
      </main>
    );
  }

  if (web3Error) {
    return (
      <main>
        <div className="wrap" style={{ padding: '2rem' }}>
          <Message severity="warn" text={web3Error} />
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="surface-card p-3">
        <div className="wrap">
          <div className="flex align-items-center justify-content-between">
            <h2 className="m-0">StayChain</h2>
            <div className="flex align-items-center gap-2">
              {accounts.length > 0 && (
                <Dropdown
                  value={currentAccountIndex}
                  options={accountOptions}
                  onChange={handleAccountSwitch}
                  placeholder="Select Account"
                  style={{ minWidth: '180px' }}
                />
              )}
              <Button
                label="Dashboard"
                severity="secondary"
                size="small"
                onClick={() => setDashboardVisible(true)}
              />
            </div>
          </div>
        </div>
      </div>

      <Toolbar filters={filters} setFilters={setFilters} onReset={reset} />

      <div className="wrap" style={{ paddingRight: '350px' }}>
        <div className="p-2" style={{ color: '#333' }}>{filtered.length} listing(s) found</div>
        <div className="grid">
          {filtered.length === 0 && (
            <div className="col-12">
              <div className="p-4" style={{ color: '#666' }}>No listings found. Create one in Dashboard.</div>
            </div>
          )}
          {filtered.map((p) => (
            <div key={p.id} className="col-12 md:col-6 lg:col-4 p-2">
              <ListingCard listing={p} currentAccount={account} />
            </div>
          ))}
        </div>
      </div>

      <TransactionLogPanel />

      <HostDashboard
        visible={dashboardVisible}
        onHide={() => {
          setDashboardVisible(false);
          loadListings();
        }}
      />
    </main>
  );
}
