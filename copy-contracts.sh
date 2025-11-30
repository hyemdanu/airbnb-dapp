#!/bin/bash

# copies contract abis and addresses to frontend after truffle migrate

echo "copying contracts to frontend..."

if [ ! -d "build/contracts" ]; then
    echo "error: build/contracts not found. run truffle migrate first"
    exit 1
fi

mkdir -p frontend/src/contracts

node << 'EOF'
const fs = require('fs');
const path = require('path');

const buildDir = './build/contracts';
const outputDir = './frontend/src/contracts';

const listingsJson = JSON.parse(fs.readFileSync(path.join(buildDir, 'Listings.json'), 'utf8'));
const bookingJson = JSON.parse(fs.readFileSync(path.join(buildDir, 'BookingEscrow.json'), 'utf8'));
const reviewsJson = JSON.parse(fs.readFileSync(path.join(buildDir, 'Reviews.json'), 'utf8'));

const networkIds = Object.keys(listingsJson.networks);
if (networkIds.length === 0) {
    console.error('no network found. deploy contracts first');
    process.exit(1);
}

const networkId = networkIds[networkIds.length - 1];
console.log('network: ' + networkId);

const addresses = {
    listings: listingsJson.networks[networkId]?.address,
    booking: bookingJson.networks[networkId]?.address,
    reviews: reviewsJson.networks[networkId]?.address
};

if (!addresses.listings || !addresses.booking || !addresses.reviews) {
    console.error('contracts not deployed. run truffle migrate --reset');
    process.exit(1);
}

console.log('listings: ' + addresses.listings);
console.log('booking: ' + addresses.booking);
console.log('reviews: ' + addresses.reviews);

// write abis
fs.writeFileSync(
    path.join(outputDir, 'ListingsABI.json'),
    JSON.stringify(listingsJson.abi, null, 2)
);
fs.writeFileSync(
    path.join(outputDir, 'BookingEscrowABI.json'),
    JSON.stringify(bookingJson.abi, null, 2)
);
fs.writeFileSync(
    path.join(outputDir, 'ReviewsABI.json'),
    JSON.stringify(reviewsJson.abi, null, 2)
);

// write config
const configContent = `// auto generated - run copy-contracts.sh after truffle migrate

export const NETWORK_ID = '${networkId}';

export const CONTRACT_ADDRESSES = {
  listings: '${addresses.listings}',
  booking: '${addresses.booking}',
  reviews: '${addresses.reviews}'
};

export const GANACHE_ACCOUNTS = [
  {
    address: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
    privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
    name: 'Account 0 (You - Guest)',
    balance: 100
  },
  {
    address: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
    privateKey: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
    name: 'Account 1 (Host - Bob)',
    balance: 100
  },
  {
    address: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
    privateKey: '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c',
    name: 'Account 2 (Host - Charlie)',
    balance: 100
  },
  {
    address: '0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d',
    privateKey: '0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913',
    name: 'Account 3 (Admin)',
    balance: 100
  },
  {
    address: '0xd03ea8624C8C5987235048901fB614fDcA89b117',
    privateKey: '0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743',
    name: 'Account 4 (Extra)',
    balance: 100
  }
];

import ListingsABI from './ListingsABI.json';
import BookingEscrowABI from './BookingEscrowABI.json';
import ReviewsABI from './ReviewsABI.json';

export { ListingsABI, BookingEscrowABI, ReviewsABI };
`;

fs.writeFileSync(path.join(outputDir, 'config.js'), configContent);

console.log('done');
EOF
