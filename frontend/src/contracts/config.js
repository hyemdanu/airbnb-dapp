// auto generated - run copy-contracts.sh after truffle migrate

export const NETWORK_ID = '1764461726557';

export const CONTRACT_ADDRESSES = {
  listings: '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
  booking: '0xe982E462b094850F12AF94d21D470e21bE9D0E9C',
  reviews: '0x59d3631c86BbE35EF041872d502F218A39FBa150'
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
