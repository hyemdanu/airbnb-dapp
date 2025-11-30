# StayChain - Airbnb DApp

decentralized airbnb clone using solidity smart contracts

team: Sean Bombay, Edison Ho, Minh Nguyen

## requirements

- node.js
- npm
- ganache cli

## setup

install dependencies:
```bash
npm install
cd frontend && npm install
```

## running the app

1. start ganache (in a separate terminal):
```bash
ganache --deterministic --port 8545
```

2. deploy contracts:
```bash
truffle migrate --reset
./copy-contracts.sh
```

3. start frontend:
```bash
cd frontend
npm run dev
```

4. open http://localhost:5173

## how it works

- browse listings
- book stays with eth
- payment held in escrow until checkout
- leave reviews after staying
- switch between accounts using dropdown (user 0 is admin)

## contracts

- Listings.sol - create/delete property listings
- BookingEscrow.sol - handles bookings and payments
- Reviews.sol - reviews after completed stays

## accounts

uses ganache deterministic accounts. user 0 (first account) is the admin and can delete any listing. other users can only delete their own listings.

you cant book your own listing.

---
csc196d fall 2025
