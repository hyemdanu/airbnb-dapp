/*
 * Mock Web3 Provider - for demo/testing without needing MetaMask
 *
 * This simulates a blockchain in memory so you can demo the DApp
 * without having to install MetaMask or connect to a real network.
 * Perfect for class presentations and quick testing!
 */

// some demo wallet addresses to play with
// in real life these would be actual MetaMask accounts
export const DEMO_ACCOUNTS = [
  { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', name: 'Alice (You)', balance: 10 },
  { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEc', name: 'Bob (Host)', balance: 5 },
  { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEd', name: 'Charlie (Host)', balance: 8 },
];

// our fake blockchain - just stored in memory
// in real life this would be on Ganache or a real blockchain
let blockchain = {
  listings: {},
  listingCounter: 0,
  bookings: {},
  bookingCounter: 0,
  reviews: {},
  reviewCounter: 0,
  currentAccount: DEMO_ACCOUNTS[0].address, // start as Alice
};

// add some sample listings so the app isn't empty when you load it
function addSampleData() {
  blockchain.listingCounter = 3;

  // Bob's downtown loft
  blockchain.listings[1] = {
    id: 1,
    host: DEMO_ACCOUNTS[1].address,
    name: 'Downtown Loft',
    location: 'San Francisco, CA',
    pricePerNight: '150000000000000000', // 0.15 ETH in wei (smallest unit)
    isActive: true,
  };

  // Charlie's beach house
  blockchain.listings[2] = {
    id: 2,
    host: DEMO_ACCOUNTS[2].address,
    name: 'Beach House',
    location: 'Malibu, CA',
    pricePerNight: '250000000000000000', // 0.25 ETH
    isActive: true,
  };

  // Bob's mountain cabin
  blockchain.listings[3] = {
    id: 3,
    host: DEMO_ACCOUNTS[1].address,
    name: 'Mountain Cabin',
    location: 'Aspen, CO',
    pricePerNight: '200000000000000000', // 0.20 ETH
    isActive: true,
  };
}

// run it once to set up the demo data
addSampleData();

/*
 * Fake Web3 instance - mimics the real Web3 library
 * but doesn't actually talk to a blockchain
 */
export class MockWeb3 {
  constructor() {
    this.eth = new MockEth();
    this.utils = {
      // convert ETH to Wei (1 ETH = 10^18 Wei)
      toWei: (value, unit) => {
        if (unit === 'ether') {
          return (parseFloat(value) * 1e18).toString();
        }
        return value;
      },
      // convert Wei back to ETH
      fromWei: (value, unit) => {
        if (unit === 'ether') {
          return (parseFloat(value) / 1e18).toString();
        }
        return value;
      },
    };
  }
}

// fake Ethereum object (mimics web3.eth)
class MockEth {
  constructor() {
    this.Contract = MockContract;
  }

  // get current account
  async getAccounts() {
    return [blockchain.currentAccount];
  }

  // fake network ID (Ganache uses 5777)
  net = {
    getId: async () => '5777',
  };
}

/*
 * Mock Contract - simulates smart contract calls
 * This is where all the blockchain logic actually happens
 */
class MockContract {
  constructor(abi, address) {
    this.abi = abi;
    this.address = address;
    this.methods = this.createMethods();
  }

  createMethods() {
    // return an object with all the contract methods
    // each method returns an object with call() or send() functions
    return {
      // ===== LISTINGS CONTRACT METHODS =====

      // get total number of listings
      listingCount: () => ({
        call: async () => blockchain.listingCounter,
      }),

      listingCounter: () => ({
        call: async () => blockchain.listingCounter,
      }),

      // get a specific listing by ID
      listings: (id) => ({
        call: async () => {
          const listing = blockchain.listings[id];
          if (!listing) throw new Error('Listing not found');
          return listing;
        },
      }),

      getListing: (id) => ({
        call: async () => {
          const listing = blockchain.listings[id];
          if (!listing) throw new Error('Listing not found');
          return listing;
        },
      }),

      // create a new listing (changes blockchain state)
      createListing: (name, location, pricePerNight) => ({
        send: async ({ from }) => {
          blockchain.listingCounter++;
          const newId = blockchain.listingCounter;
          blockchain.listings[newId] = {
            id: newId,
            host: from,
            name,
            location,
            pricePerNight,
            isActive: true,
          };
          console.log('✅ Listing created:', blockchain.listings[newId]);
          // fake transaction hash (looks like a real one)
          return { transactionHash: '0x' + Math.random().toString(16).substring(2) };
        },
      }),

      // get all listings for a specific host
      getHostListings: (host) => ({
        call: async () => {
          const listings = [];
          for (let id in blockchain.listings) {
            if (blockchain.listings[id].host === host) {
              listings.push(parseInt(id));
            }
          }
          return listings;
        },
      }),

      // ===== BOOKING CONTRACT METHODS =====

      bookingCounter: () => ({
        call: async () => blockchain.bookingCounter,
      }),

      getBooking: (id) => ({
        call: async () => {
          const booking = blockchain.bookings[id];
          if (!booking) throw new Error('Booking not found');
          return booking;
        },
      }),

      // book a listing (guest pays ETH)
      createBooking: (listingId, checkInDate, checkOutDate) => ({
        send: async ({ from, value }) => {
          const listing = blockchain.listings[listingId];
          if (!listing) throw new Error('Listing not found');

          blockchain.bookingCounter++;
          const newId = blockchain.bookingCounter;

          // calculate platform fee (2.5% like Airbnb)
          const totalPrice = BigInt(value);
          const protocolFee = totalPrice * BigInt(250) / BigInt(10000);
          const hostPayout = totalPrice - protocolFee;

          blockchain.bookings[newId] = {
            id: newId,
            listingId,
            guest: from,
            host: listing.host,
            checkInDate,
            checkOutDate,
            totalPrice: value,
            protocolFee: protocolFee.toString(),
            hostPayout: hostPayout.toString(),
            status: 0, // 0 = Pending
            createdAt: Math.floor(Date.now() / 1000),
          };

          console.log('✅ Booking created:', blockchain.bookings[newId]);
          return { transactionHash: '0x' + Math.random().toString(16).substring(2) };
        },
      }),

      // get all bookings for a guest
      getGuestBookings: (guest) => ({
        call: async () => {
          const bookings = [];
          for (let id in blockchain.bookings) {
            if (blockchain.bookings[id].guest === guest) {
              bookings.push(parseInt(id));
            }
          }
          return bookings;
        },
      }),

      // get all bookings for a host
      getHostBookings: (host) => ({
        call: async () => {
          const bookings = [];
          for (let id in blockchain.bookings) {
            if (blockchain.bookings[id].host === host) {
              bookings.push(parseInt(id));
            }
          }
          return bookings;
        },
      }),

      // guest checks in
      checkIn: (bookingId) => ({
        send: async ({ from }) => {
          const booking = blockchain.bookings[bookingId];
          if (!booking) throw new Error('Booking not found');
          if (booking.guest !== from) throw new Error('Only guest can check in');
          booking.status = 1; // 1 = CheckedIn
          console.log('✅ Checked in:', bookingId);
          return { transactionHash: '0x' + Math.random().toString(16).substring(2) };
        },
      }),

      // checkout (releases payment to host)
      checkOut: (bookingId) => ({
        send: async ({ from }) => {
          const booking = blockchain.bookings[bookingId];
          if (!booking) throw new Error('Booking not found');
          booking.status = 2; // 2 = Completed
          console.log('✅ Checked out, host got paid:', bookingId);
          return { transactionHash: '0x' + Math.random().toString(16).substring(2) };
        },
      }),

      // cancel booking
      cancelBooking: (bookingId) => ({
        send: async ({ from }) => {
          const booking = blockchain.bookings[bookingId];
          if (!booking) throw new Error('Booking not found');
          if (booking.guest !== from) throw new Error('Only guest can cancel');
          booking.status = 3; // 3 = Cancelled
          console.log('✅ Booking cancelled:', bookingId);
          return { transactionHash: '0x' + Math.random().toString(16).substring(2) };
        },
      }),

      // ===== REVIEWS CONTRACT METHODS =====

      reviewCounter: () => ({
        call: async () => blockchain.reviewCounter,
      }),

      // create a review (only after completing a booking)
      createReview: (bookingId, rating, comment) => ({
        send: async ({ from }) => {
          const booking = blockchain.bookings[bookingId];
          if (!booking) throw new Error('Booking not found');

          blockchain.reviewCounter++;
          const newId = blockchain.reviewCounter;
          blockchain.reviews[newId] = {
            id: newId,
            listingId: booking.listingId,
            reviewer: from,
            rating,
            comment,
            createdAt: Math.floor(Date.now() / 1000),
            isActive: true,
          };

          console.log('✅ Review created:', blockchain.reviews[newId]);
          return { transactionHash: '0x' + Math.random().toString(16).substring(2) };
        },
      }),

      // get all reviews for a listing
      getListingReviews: (listingId) => ({
        call: async () => {
          const reviews = [];
          for (let id in blockchain.reviews) {
            if (blockchain.reviews[id].listingId === listingId && blockchain.reviews[id].isActive) {
              reviews.push(parseInt(id));
            }
          }
          return reviews;
        },
      }),

      getReview: (id) => ({
        call: async () => {
          const review = blockchain.reviews[id];
          if (!review) throw new Error('Review not found');
          return review;
        },
      }),

      // calculate average rating for a listing
      getListingAverageRating: (listingId) => ({
        call: async () => {
          const reviewIds = [];
          for (let id in blockchain.reviews) {
            if (blockchain.reviews[id].listingId === listingId && blockchain.reviews[id].isActive) {
              reviewIds.push(id);
            }
          }

          if (reviewIds.length === 0) return 0;

          const sum = reviewIds.reduce((acc, id) => acc + parseInt(blockchain.reviews[id].rating), 0);
          return Math.floor((sum / reviewIds.length) * 100); // multiply by 100 cuz contract does this
        },
      }),

      // count reviews for a listing
      getListingReviewCount: (listingId) => ({
        call: async () => {
          let count = 0;
          for (let id in blockchain.reviews) {
            if (blockchain.reviews[id].listingId === listingId && blockchain.reviews[id].isActive) {
              count++;
            }
          }
          return count;
        },
      }),
    };
  }
}

/*
 * Fake window.ethereum object (normally provided by MetaMask)
 * This lets our app think MetaMask is installed
 */
export const mockEthereum = {
  isMetaMask: false,
  isDemoWallet: true, // custom flag so we know it's fake

  request: async ({ method }) => {
    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return [blockchain.currentAccount];
      case 'eth_chainId':
        return '0x1691'; // 5777 in hex (Ganache's default network ID)
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  },

  // listen for events (account/network changes)
  on: (event, handler) => {
    console.log(`📡 Listening for: ${event}`);
  },

  removeListener: (event, handler) => {
    console.log(`🔇 Stopped listening for: ${event}`);
  },
};

// helper function to switch between demo accounts
// useful for testing as different users (guest vs host)
export const switchDemoAccount = (accountIndex) => {
  if (accountIndex >= 0 && accountIndex < DEMO_ACCOUNTS.length) {
    blockchain.currentAccount = DEMO_ACCOUNTS[accountIndex].address;
    console.log(`🔄 Switched to: ${DEMO_ACCOUNTS[accountIndex].name}`);
    return true;
  }
  return false;
};

// get info about current account
export const getCurrentAccountInfo = () => {
  return DEMO_ACCOUNTS.find(acc => acc.address === blockchain.currentAccount);
};

// reset everything (useful for testing)
export const resetBlockchain = () => {
  blockchain = {
    listings: {},
    listingCounter: 0,
    bookings: {},
    bookingCounter: 0,
    reviews: {},
    reviewCounter: 0,
    currentAccount: DEMO_ACCOUNTS[0].address,
  };
  addSampleData();
  console.log('🔄 Blockchain reset to initial state');
};

// peek at the blockchain state (for debugging)
export const getBlockchainState = () => blockchain;
