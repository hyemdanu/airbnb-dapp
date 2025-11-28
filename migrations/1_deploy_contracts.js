// This script tells Truffle how to deploy your contracts to the blockchain
// The order matters cus BookingEscrow needs Listings address, and Reviews needs BookingEscrow address

const Listings = artifacts.require("Listings");
const BookingEscrow = artifacts.require("BookingEscrow");
const Reviews = artifacts.require("Reviews");

module.exports = async function(deployer) {
  // Step 1: Deploy the Listings contract first
  await deployer.deploy(Listings);
  const listingsInstance = await Listings.deployed();

  // Step 2: Deploy BookingEscrow (needs Listings address to talk to it)
  await deployer.deploy(BookingEscrow, listingsInstance.address);
  const bookingInstance = await BookingEscrow.deployed();

  // Step 3: Deploy Reviews (needs BookingEscrow address to verify bookings)
  await deployer.deploy(Reviews, bookingInstance.address);

  console.log("All contracts deployed!");
  console.log("Listings:", listingsInstance.address);
  console.log("BookingEscrow:", bookingInstance.address);
  console.log("Reviews:", (await Reviews.deployed()).address);
};
