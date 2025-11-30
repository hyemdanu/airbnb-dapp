// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// handles property listings for the dapp
contract Listings {

    // counter for unique listing IDs
    uint256 public listingCounter = 0;

    // admin can delete any listing
    address public admin;

    // listing structure
    struct Listing {
        uint256 id;
        address host;
        string name;
        string location;
        string propertyType;
        uint256 beds;
        uint256 pricePerNight;
        bool isActive;
    }

    // store listings by ID
    mapping(uint256 => Listing) public listings;

    // track which listings each host owns
    mapping(address => uint256[]) public hostListings;

    // events for frontend
    event ListingCreated(uint256 indexed listingId, address indexed host, string name, uint256 pricePerNight);
    event ListingUpdated(uint256 indexed listingId, string name, uint256 pricePerNight);
    event ListingDeleted(uint256 indexed listingId, address deletedBy);

    // only the host can do this
    modifier onlyHost(uint256 _listingId) {
        require(listings[_listingId].host == msg.sender, "Not the host");
        _;
    }

    // host or admin can do this
    modifier onlyHostOrAdmin(uint256 _listingId) {
        require(listings[_listingId].host == msg.sender || msg.sender == admin, "Not authorized");
        _;
    }

    // only admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    // make sure listing exists
    modifier listingExists(uint256 _listingId) {
        require(_listingId > 0 && _listingId <= listingCounter, "Listing does not exist");
        _;
    }

    // deployer becomes admin
    constructor() {
        admin = msg.sender;
    }

    // create a new listing
    function createListing(
        string memory _name,
        string memory _location,
        string memory _propertyType,
        uint256 _beds,
        uint256 _pricePerNight
    ) public returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_location).length > 0, "Location required");
        require(_pricePerNight > 0, "Price must be > 0");

        listingCounter++;

        listings[listingCounter] = Listing({
            id: listingCounter,
            host: msg.sender,
            name: _name,
            location: _location,
            propertyType: _propertyType,
            beds: _beds,
            pricePerNight: _pricePerNight,
            isActive: true
        });

        hostListings[msg.sender].push(listingCounter);

        emit ListingCreated(listingCounter, msg.sender, _name, _pricePerNight);

        return listingCounter;
    }

    // update listing info
    function updateListing(
        uint256 _listingId,
        string memory _name,
        string memory _location,
        string memory _propertyType,
        uint256 _beds,
        uint256 _pricePerNight
    ) public listingExists(_listingId) onlyHost(_listingId) {
        require(listings[_listingId].isActive, "Listing not active");
        require(bytes(_name).length > 0, "Name required");
        require(_pricePerNight > 0, "Price must be > 0");

        Listing storage listing = listings[_listingId];
        listing.name = _name;
        listing.location = _location;
        listing.propertyType = _propertyType;
        listing.beds = _beds;
        listing.pricePerNight = _pricePerNight;

        emit ListingUpdated(_listingId, _name, _pricePerNight);
    }

    // delete listing (soft delete) - host or admin can do this
    function deleteListing(uint256 _listingId)
        public
        listingExists(_listingId)
        onlyHostOrAdmin(_listingId)
    {
        require(listings[_listingId].isActive, "Already deleted");

        listings[_listingId].isActive = false;

        emit ListingDeleted(_listingId, msg.sender);
    }

    // get listing details
    function getListing(uint256 _listingId)
        public
        view
        listingExists(_listingId)
        returns (
            uint256 id,
            address host,
            string memory name,
            string memory location,
            string memory propertyType,
            uint256 beds,
            uint256 pricePerNight,
            bool isActive
        )
    {
        Listing memory listing = listings[_listingId];
        return (
            listing.id,
            listing.host,
            listing.name,
            listing.location,
            listing.propertyType,
            listing.beds,
            listing.pricePerNight,
            listing.isActive
        );
    }

    // get all listings for a host
    function getHostListings(address _host) public view returns (uint256[] memory) {
        return hostListings[_host];
    }

    // check if listing is active
    function isListingActive(uint256 _listingId) public view returns (bool) {
        return listings[_listingId].isActive;
    }

    // get admin address
    function getAdmin() public view returns (address) {
        return admin;
    }
}
