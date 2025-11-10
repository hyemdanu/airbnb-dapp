// This script tells Truffle how to deploy your contracts to the blockchain

const Listings = artifacts.require("Listings");

module.exports = function(deployer) {
  // Deploy the Listings contract
  deployer.deploy(Listings);
};
