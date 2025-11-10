// Test file for Listings contract
const Listings = artifacts.require("Listings");

contract("Listings", (accounts) => {
  let listingsInstance;

  // This runs before each test - deploys a fresh contract
  beforeEach(async () => {
    listingsInstance = await Listings.new();
  });

  // Test 1: Check if contract deploys correctly
  it("should deploy successfully", async () => {
    const address = await listingsInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, '');
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  // Test 2: Create a new listing
  it("should create a new listing", async () => {
    const result = await listingsInstance.createListing(
      "Cozy Beach House",
      "Miami",
      web3.utils.toWei("0.1", "ether"),
      { from: accounts[0] }
    );

    // Check the event was emitted
    assert.equal(result.logs.length, 1, "Should trigger one event");
    assert.equal(result.logs[0].event, "ListingCreated", "Should be ListingCreated event");

    // Check listing counter increased
    const counter = await listingsInstance.listingCounter();
    assert.equal(counter, 1, "Listing counter should be 1");
  });

  // Test 3: Get listing details
  it("should return correct listing details", async () => {
    await listingsInstance.createListing(
      "Cozy Beach House",
      "Miami",
      web3.utils.toWei("0.1", "ether"),
      { from: accounts[0] }
    );

    const listing = await listingsInstance.getListing(1);

    assert.equal(listing.id, 1, "ID should be 1");
    assert.equal(listing.host, accounts[0], "Host should be accounts[0]");
    assert.equal(listing.name, "Cozy Beach House", "Name should match");
    assert.equal(listing.location, "Miami", "Location should match");
    assert.equal(listing.pricePerNight, web3.utils.toWei("0.1", "ether"), "Price should match");
    assert.equal(listing.isActive, true, "Listing should be active");
  });

  // Test 4: Update a listing
  it("should allow host to update their listing", async () => {
    await listingsInstance.createListing(
      "Cozy Beach House",
      "Miami",
      web3.utils.toWei("0.1", "ether"),
      { from: accounts[0] }
    );

    await listingsInstance.updateListing(
      1,
      "Luxury Beach Villa",
      "Miami Beach",
      web3.utils.toWei("0.2", "ether"),
      { from: accounts[0] }
    );

    const listing = await listingsInstance.getListing(1);
    assert.equal(listing.name, "Luxury Beach Villa", "Name should be updated");
    assert.equal(listing.pricePerNight, web3.utils.toWei("0.2", "ether"), "Price should be updated");
  });

  // Test 5: Prevent non-host from updating listing
  it("should prevent non-host from updating listing", async () => {
    await listingsInstance.createListing(
      "Cozy Beach House",
      "Miami",
      web3.utils.toWei("0.1", "ether"),
      { from: accounts[0] }
    );

    try {
      await listingsInstance.updateListing(
        1,
        "Hacked Name",
        "Hacked Location",
        web3.utils.toWei("0.5", "ether"),
        { from: accounts[1] } // Different account trying to update
      );
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "You're not the host", "Error message should contain 'You're not the host'");
    }
  });

  // Test 6: Deactivate a listing
  it("should allow host to deactivate their listing", async () => {
    await listingsInstance.createListing(
      "Cozy Beach House",
      "Miami",
      web3.utils.toWei("0.1", "ether"),
      { from: accounts[0] }
    );

    await listingsInstance.deactivateListing(1, { from: accounts[0] });

    const listing = await listingsInstance.getListing(1);
    assert.equal(listing.isActive, false, "Listing should be inactive");
  });

  // Test 7: Get host listings
  it("should return all listings for a host", async () => {
    // Create 2 listings from same host
    await listingsInstance.createListing(
      "Beach House",
      "Miami",
      web3.utils.toWei("0.1", "ether"),
      { from: accounts[0] }
    );

    await listingsInstance.createListing(
      "Mountain Cabin",
      "Colorado",
      web3.utils.toWei("0.15", "ether"),
      { from: accounts[0] }
    );

    const hostListings = await listingsInstance.getHostListings(accounts[0]);
    assert.equal(hostListings.length, 2, "Host should have 2 listings");
  });

  // Test 8: Require valid input
  it("should reject listing with empty name", async () => {
    try {
      await listingsInstance.createListing(
        "",
        "Miami",
        web3.utils.toWei("0.1", "ether"),
        { from: accounts[0] }
      );
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "Listing needs a name", "Error should mention name requirement");
    }
  });
});
