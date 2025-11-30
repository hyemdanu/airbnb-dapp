import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import Web3 from 'web3';
import {
  getGanacheAccounts,
  getCurrentAccount,
  switchAccount as switchDemoAccount,
  checkGanacheConnection,
  createContract,
  setTransactionLogger
} from '../utils/demoWallet';
import { useTransactionLog } from './TransactionLogContext';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

const GANACHE_URL = 'http://127.0.0.1:8545';

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [blockNumber, setBlockNumber] = useState(null);
  const [contracts, setContracts] = useState({
    listings: null,
    booking: null,
    reviews: null
  });
  const [contractAddresses, setContractAddresses] = useState({
    listings: null,
    booking: null,
    reviews: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ganacheConnected, setGanacheConnected] = useState(false);

  const transactionLog = useTransactionLog();

  useEffect(() => {
    if (transactionLog) {
      setTransactionLogger((txInfo) => {
        transactionLog.logTransaction(txInfo);
      });
    }
  }, [transactionLog]);

  const initWeb3 = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Initializing Web3...');

      const connectionStatus = await checkGanacheConnection();

      if (!connectionStatus.connected) {
        throw new Error('Cannot connect to Ganache. Run: ganache --deterministic --port 8545');
      }

      setGanacheConnected(true);
      setNetworkId(connectionStatus.networkId.toString());
      setBlockNumber(connectionStatus.blockNumber);

      const web3Instance = new Web3(GANACHE_URL);
      setWeb3(web3Instance);

      const currentAcc = getCurrentAccount();
      if (currentAcc) {
        setAccount(currentAcc.address);
        setAccountInfo(currentAcc);
      }

      await loadContracts(web3Instance);

      console.log('Web3 initialized');

    } catch (err) {
      console.log('Error initializing Web3: ' + err.message);
      setError(err.message);
      setGanacheConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async (web3Instance) => {
    try {
      let config;
      try {
        config = await import('../contracts/config.js');
      } catch (importErr) {
        console.log('Contract config not found. Run: truffle migrate --reset && ./copy-contracts.sh');
        setError('Contracts not deployed. Run: truffle migrate --reset && ./copy-contracts.sh');
        return;
      }

      const { CONTRACT_ADDRESSES, ListingsABI, BookingEscrowABI, ReviewsABI } = config;

      if (!CONTRACT_ADDRESSES.listings || !CONTRACT_ADDRESSES.booking || !CONTRACT_ADDRESSES.reviews) {
        console.log('Contract addresses not found in config');
        setError('Contracts not deployed. Run: truffle migrate --reset && ./copy-contracts.sh');
        return;
      }

      console.log('Contract addresses:');
      console.log('  Listings: ' + CONTRACT_ADDRESSES.listings);
      console.log('  Booking: ' + CONTRACT_ADDRESSES.booking);
      console.log('  Reviews: ' + CONTRACT_ADDRESSES.reviews);

      setContractAddresses(CONTRACT_ADDRESSES);

      const listingsContract = createContract(web3Instance, ListingsABI, CONTRACT_ADDRESSES.listings);
      const bookingContract = createContract(web3Instance, BookingEscrowABI, CONTRACT_ADDRESSES.booking);
      const reviewsContract = createContract(web3Instance, ReviewsABI, CONTRACT_ADDRESSES.reviews);

      setContracts({
        listings: listingsContract,
        booking: bookingContract,
        reviews: reviewsContract
      });

      console.log('Contracts loaded');

      try {
        const listingCount = await listingsContract.methods.listingCounter().call();
        console.log('Listings on chain: ' + listingCount);
      } catch (err) {
        console.log('Could not read from Listings contract');
      }

    } catch (err) {
      console.log('Error loading contracts: ' + err.message);
      setError('Failed to load contracts: ' + err.message);
    }
  };

  const switchToAccount = useCallback(async (index) => {
    const newAccount = switchDemoAccount(index);
    if (newAccount && web3) {
      setAccount(newAccount.address);
      const balance = await web3.eth.getBalance(newAccount.address);
      const balanceEth = web3.utils.fromWei(balance, 'ether');
      setAccountInfo({ ...newAccount, balance: parseFloat(balanceEth) });
      return newAccount;
    }
    return null;
  }, [web3]);

  const refreshBalance = useCallback(async () => {
    if (web3 && account) {
      const balance = await web3.eth.getBalance(account);
      const balanceEth = web3.utils.fromWei(balance, 'ether');
      setAccountInfo(prev => ({ ...prev, balance: parseFloat(balanceEth) }));
    }
  }, [web3, account]);

  const toWei = useCallback((eth) => {
    return web3 ? web3.utils.toWei(eth.toString(), 'ether') : '0';
  }, [web3]);

  const fromWei = useCallback((wei) => {
    return web3 ? web3.utils.fromWei(wei.toString(), 'ether') : '0';
  }, [web3]);

  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  }, []);

  useEffect(() => {
    initWeb3();
  }, []);

  const value = {
    web3,
    account,
    accountInfo,
    networkId,
    blockNumber,
    contracts,
    contractAddresses,
    loading,
    error,
    ganacheConnected,
    switchToAccount,
    refreshBalance,
    toWei,
    fromWei,
    formatAddress,
    getGanacheAccounts,
    reconnect: initWeb3
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
