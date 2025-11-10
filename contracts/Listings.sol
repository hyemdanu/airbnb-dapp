// declaring version of solidity
pragma solidity ^0.8.19;

// listing function for the dapp
contract Listings {

    // coutner to ID each listing
    uint256 public listingCounter = 0;

    // listing structure 
    struct Listing {
        uint256 id;              // unique ID for this listing
        address host;            // owner/host of the property
        string name;             // name of the listing
        string location;         // location
        uint256 pricePerNight;   // price per wei
        bool isActive;           // check availability 
    }

    /* 
     * store listings
     * Example: Listings[1] will give info such as id, host, name, etc. of that listing
    */
    mapping(uint256 => Listing) public listings;

    /*
     * so there are listings and the host of the listings. It will keep track of what listings the hosts has
     * Example: If you own listings 1, 3, 5, this stores [1, 3, 5]
    */
    mapping(address => uint256[]) public hostListings;

    /* 
     * These are events which are like notifications. The blockchain will broadcast when something important happens
     * Like when a listing is created, updated, or deactivated. 
     * Good for frontend (web3.js/react) to listen to these events 
    */
    event ListingCreated(uint256 indexed listingId, address indexed host, string name, uint256 pricePerNight);
    event ListingUpdated(uint256 indexed listingId, string name, uint256 pricePerNight);
    event ListingDeactivated(uint256 indexed listingId);

    /* 
     * Modifier to make sure only the host can mess with their own listing
     * Security stuff
     * msg.sender - for whoever calls the function (from their wallet address)
     * checks if the person calling the function is the host
    */
    modifier onlyHost(uint256 _listingId) {
        require(listings[_listingId].host == msg.sender, "You are not host of the listing");
        _;
    }

    /*
     * Modifier to check if a listing actually exists
     * checking if the listing is valid, so a listing ID can't be less than 0 (it starts at 1)
     * can't access listing that doesn't exist, so can't use listing[100] if their is only 10
    */
    modifier listingExists(uint256 _listingId) {
        require(_listingId > 0 && _listingId <= listingCounter, "This listing doesn't exist");
        _;
    }

    /* 
     * the main funciton to create a listing 
    */
    function createListing(
        string memory _name,
        string memory _location,
        uint256 _pricePerNight
    ) public returns (uint256) {
        // Make sure the listing is filled with the mandatory stuff
        require(bytes(_name).length > 0, "Listing needs a name");
        require(bytes(_location).length > 0, "Listing needs a location");
        require(_pricePerNight > 0, "Price must be greater than 0");

        // increment counter for new ID for listing
        listingCounter++;

        // creates the listing with the information
        listings[listingCounter] = Listing({
            id: listingCounter,
            host: msg.sender,
            name: _name,
            location: _location,
            pricePerNight: _pricePerNight,
            isActive: true
        });

        // this will add the listing to host's list of listings (so a host can have more than one listing)
        hostListings[msg.sender].push(listingCounter);

        // notify/broadcast that a listing has been created (for frontend)
        emit ListingCreated(listingCounter, msg.sender, _name, _pricePerNight);

        return listingCounter;
    }

    // update a listing (where only the host that created it can edit)
    function updateListing(
        uint256 _listingId,
        string memory _name,
        string memory _location,
        uint256 _pricePerNight
    ) public listingExists(_listingId) onlyHost(_listingId) {
        require(listings[_listingId].isActive, "Can't update a deactivated listing");
        require(bytes(_name).length > 0, "Name can't be empty");
        require(_pricePerNight > 0, "Price must be greater than 0");

        // update the information that the host adjusted
        // storage means getting a reference to the actual listing stored on the blockchain
        Listing storage listing = listings[_listingId];
        listing.name = _name;
        listing.location = _location;
        listing.pricePerNight = _pricePerNight;

        emit ListingUpdated(_listingId, _name, _pricePerNight);
    }

    /*
     * deactivate the listing (a soft delete) so it doesn't fully erase the data from the blockchian, only deactivate
     * soft delete cus blockchain data is permanent, so it can't be truly deleted
     * keeps history just in case
     * can be reactivated if needed
    */
    function deactivateListing(uint256 _listingId)
        public
        listingExists(_listingId)
        onlyHost(_listingId)
    {
        require(listings[_listingId].isActive, "Listing is already deactivated");

        listings[_listingId].isActive = false;

        emit ListingDeactivated(_listingId);
    }

    /*
     * get the information/details about a listing
     * doesn't change information (only reading) so it doesn't cost gas
    */
    function getListing(uint256 _listingId)
        public
        view
        listingExists(_listingId)
        returns (
            uint256 id,
            address host,
            string memory name,
            string memory location,
            uint256 pricePerNight,
            bool isActive
        )
    {
        // "memory" so temporary copy, just reading not changing
        Listing memory listing = listings[_listingId];
        return (
            listing.id,
            listing.host,
            listing.name,
            listing.location,
            listing.pricePerNight,
            listing.isActive
        );
    }

    // get all listings from a host
    function getHostListings(address _host) public view returns (uint256[] memory) {
        return hostListings[_host];
    }

    // check if a listing is available
    function isListingActive(uint256 _listingId) public view returns (bool) {
        return listings[_listingId].isActive;
    }
}
