import React, { createContext, useState, useEffect, useContext } from 'react';
import Web3 from 'web3';
import { MockWeb3, mockEthereum, DEMO_ACCOUNTS } from '../utils/mockWeb3';

// we'll load contract ABIs dynamically instead of importing them
// this way it won't break if contracts aren't deployed yet

// Create the context
const Web3Context = createContext();

// Custom hook to use the Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Web3 Provider component
export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [contracts, setContracts] = useState({
    listings: null,
    booking: null,
    reviews: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Web3 - uses demo wallet by default (no MetaMask needed!)
  const initWeb3 = async () => {
    try {
      // FOR DEMO: we're using a fake wallet so you don't need MetaMask
      // if you want to use real MetaMask later, just uncomment the code below

      const useDemoWallet = true; // set to false to use real MetaMask

      if (useDemoWallet) {
        // using our mock Web3 provider - no MetaMask required!
        console.log('🎭 Running in DEMO MODE - no MetaMask needed');
        const web3Instance = new MockWeb3();
        setWeb3(web3Instance);

        // get the first demo account (Alice)
        const accounts = await mockEthereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        console.log('👤 Demo account:', DEMO_ACCOUNTS[0].name);

        // fake network ID (Ganache)
        setNetworkId('5777');

        // load contracts with mock provider
        await loadContracts(web3Instance, '5777');

        setError(null);
      } else {
        // REAL METAMASK CODE (commented out for demo)
        // Check if MetaMask is installed
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          // Request account access
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
          });
          setAccount(accounts[0]);

          // Get network ID
          const netId = await web3Instance.eth.net.getId();
          setNetworkId(netId.toString());

          // Load contracts
          await loadContracts(web3Instance, netId.toString());

          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0] || null);
          });

          // Listen for network changes
          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });

          setError(null);
        } else {
          setError('Please install MetaMask to use this DApp');
        }
      }
    } catch (err) {
      console.error('Error initializing Web3:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // load contracts - simplified for demo mode
  const loadContracts = async (web3Instance, networkId) => {
    try {
      // in demo mode, we don't need real ABIs - just create mock contract instances
      // the MockWeb3 class handles all the contract logic internally
      const listingsContract = new web3Instance.eth.Contract(
        [], // empty ABI is fine for mock
        '0x1234567890123456789012345678901234567890' // fake address
      );

      const bookingContract = new web3Instance.eth.Contract(
        [],
        '0x2234567890123456789012345678901234567890'
      );

      const reviewsContract = new web3Instance.eth.Contract(
        [],
        '0x3234567890123456789012345678901234567890'
      );

      setContracts({
        listings: listingsContract,
        booking: bookingContract,
        reviews: reviewsContract
      });

      console.log('✅ Contracts loaded (demo mode)');
    } catch (err) {
      console.error('Error loading contracts:', err);
      // don't throw - just log the error
    }
  };

  // Connect wallet manually (if user denied initially)
  const connectWallet = async () => {
    await initWeb3();
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
  };

  // Helper: Convert ETH to Wei
  const toWei = (eth) => {
    return web3 ? web3.utils.toWei(eth.toString(), 'ether') : '0';
  };

  // Helper: Convert Wei to ETH
  const fromWei = (wei) => {
    return web3 ? web3.utils.fromWei(wei.toString(), 'ether') : '0';
  };

  // Helper: Get formatted address (0x1234...5678)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Initialize on mount
  useEffect(() => {
    initWeb3();
  }, []);

  const value = {
    web3,
    account,
    networkId,
    contracts,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    toWei,
    fromWei,
    formatAddress
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
