// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Listings.sol";

// handles all the booking and payment stuff
// basically when someone books, money goes here and waits until checkout
contract BookingEscrow {

    // need to talk to the Listings contract to check if places exist
    Listings public listingsContract;

    // platform takes 2.5% like airbnb does (250 = 2.5%, divide by 10000 to get percentage)
    uint256 public protocolFeePercent = 250;
    uint256 public constant FEE_DENOMINATOR = 10000;

    // admin who gets the platform fees
    address public admin;

    // keeps track of how much fees we've collected
    uint256 public protocolFeesCollected;

    // counter so each booking gets a unique ID
    uint256 public bookingCounter = 0;

    // booking can be: pending, checked in, done, cancelled, or disputed
    enum BookingStatus {
        Pending,
        CheckedIn,
        Completed,
        Cancelled,
        Disputed
    }

    // everything we need to know about a booking
    struct Booking {
        uint256 id;
        uint256 listingId;
        address guest;
        address host;
        uint256 checkInDate;
        uint256 checkOutDate;
        uint256 totalPrice;
        uint256 protocolFee;
        uint256 hostPayout;
        BookingStatus status;
        uint256 createdAt;
    }

    // storage stuff - basically like databases
    mapping(uint256 => Booking) public bookings;
    mapping(address => uint256[]) public guestBookings; // all bookings for a guest
    mapping(address => uint256[]) public hostBookings; // all bookings for a host
    mapping(uint256 => uint256[]) public listingBookings; // prevents double booking

    // events so the frontend knows what's happening
    event BookingCreated(
        uint256 indexed bookingId,
        uint256 indexed listingId,
        address indexed guest,
        address host,
        uint256 checkInDate,
        uint256 checkOutDate,
        uint256 totalPrice
    );

    event CheckedIn(uint256 indexed bookingId, uint256 timestamp);
    event CheckedOut(uint256 indexed bookingId, uint256 timestamp);
    event BookingCancelled(uint256 indexed bookingId, uint256 refundAmount);
    event PaymentReleased(uint256 indexed bookingId, address host, uint256 amount);
    event ProtocolFeeWithdrawn(address admin, uint256 amount);

    // modifiers = security checks that run before functions
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier onlyGuest(uint256 _bookingId) {
        require(bookings[_bookingId].guest == msg.sender, "Only the guest can do this");
        _;
    }

    modifier onlyHost(uint256 _bookingId) {
        require(bookings[_bookingId].host == msg.sender, "Only the host can do this");
        _;
    }

    modifier bookingExists(uint256 _bookingId) {
        require(_bookingId > 0 && _bookingId <= bookingCounter, "This booking doesn't exist");
        _;
    }

    // runs once when we deploy the contract
    constructor(address _listingsContractAddress) {
        listingsContract = Listings(_listingsContractAddress);
        admin = msg.sender;
    }

    // book a listing - guest pays and money sits here til checkout
    function createBooking(
        uint256 _listingId,
        uint256 _checkInDate,
        uint256 _checkOutDate
    ) public payable returns (uint256) {
        require(_checkInDate > block.timestamp, "Can't check in to the past, need a time machine for that");
        require(_checkOutDate > _checkInDate, "Check-out must be after check-in");

        // get the listing info
        (
            ,
            address host,
            ,
            ,
            uint256 pricePerNight,
            bool isActive
        ) = listingsContract.getListing(_listingId);

        require(isActive, "This listing is not active");
        require(host != msg.sender, "You can't book your own place, that's cheating");

        // calculate how many nights
        uint256 nights = (_checkOutDate - _checkInDate) / 1 days;
        require(nights > 0, "Need to book at least 1 night");

        // calculate total cost
        uint256 totalPrice = pricePerNight * nights;
        require(msg.value >= totalPrice, "You didn't send enough ETH");

        // take out platform fee, rest goes to host
        uint256 protocolFee = (totalPrice * protocolFeePercent) / FEE_DENOMINATOR;
        uint256 hostPayout = totalPrice - protocolFee;

        // make sure dates aren't taken
        require(
            !hasOverlappingBooking(_listingId, _checkInDate, _checkOutDate),
            "Sorry, someone already booked these dates"
        );

        // create the booking
        bookingCounter++;

        bookings[bookingCounter] = Booking({
            id: bookingCounter,
            listingId: _listingId,
            guest: msg.sender,
            host: host,
            checkInDate: _checkInDate,
            checkOutDate: _checkOutDate,
            totalPrice: totalPrice,
            protocolFee: protocolFee,
            hostPayout: hostPayout,
            status: BookingStatus.Pending,
            createdAt: block.timestamp
        });

        // track the booking
        guestBookings[msg.sender].push(bookingCounter);
        hostBookings[host].push(bookingCounter);
        listingBookings[_listingId].push(bookingCounter);

        // refund extra if they overpaid
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        // let frontend know
        emit BookingCreated(
            bookingCounter,
            _listingId,
            msg.sender,
            host,
            _checkInDate,
            _checkOutDate,
            totalPrice
        );

        return bookingCounter;
    }

    // guest checks in when they arrive
    function checkIn(uint256 _bookingId)
        public
        bookingExists(_bookingId)
        onlyGuest(_bookingId)
    {
        Booking storage booking = bookings[_bookingId];

        require(booking.status == BookingStatus.Pending, "Booking must be pending");
        require(block.timestamp >= booking.checkInDate, "Too early to check in");
        require(block.timestamp < booking.checkOutDate, "Check-in window has passed");

        booking.status = BookingStatus.CheckedIn;

        emit CheckedIn(_bookingId, block.timestamp);
    }

    // checkout - releases payment to host
    function checkOut(uint256 _bookingId)
        public
        bookingExists(_bookingId)
    {
        Booking storage booking = bookings[_bookingId];

        require(
            msg.sender == booking.guest || msg.sender == booking.host,
            "Only guest or host can trigger checkout"
        );
        require(
            booking.status == BookingStatus.CheckedIn || booking.status == BookingStatus.Pending,
            "Can't checkout - wrong status"
        );
        require(block.timestamp >= booking.checkOutDate, "Too early to checkout");

        booking.status = BookingStatus.Completed;

        // collect platform fee
        protocolFeesCollected += booking.protocolFee;

        // pay the host
        payable(booking.host).transfer(booking.hostPayout);

        emit CheckedOut(_bookingId, block.timestamp);
        emit PaymentReleased(_bookingId, booking.host, booking.hostPayout);
    }

    // cancel booking - full refund if 24h+ before checkin, 50% if within 24h
    function cancelBooking(uint256 _bookingId)
        public
        bookingExists(_bookingId)
        onlyGuest(_bookingId)
    {
        Booking storage booking = bookings[_bookingId];

        require(booking.status == BookingStatus.Pending, "Can only cancel pending bookings");
        require(block.timestamp < booking.checkInDate, "Too late to cancel, check-in date passed");

        booking.status = BookingStatus.Cancelled;

        // Figure out the refund based on when they're cancelling
        uint256 refundAmount;

        if (block.timestamp < booking.checkInDate - 1 days) {
            // Cancelled more than 24 hours before check-in: full refund
            refundAmount = booking.totalPrice;
        } else {
            // Cancelled within 24 hours: only get 50% back
            refundAmount = booking.totalPrice / 2;

            // Give the other 50% to host as compensation for last-minute cancellation
            uint256 hostCompensation = booking.totalPrice - refundAmount;
            payable(booking.host).transfer(hostCompensation);
        }

        // Send refund to guest
        payable(booking.guest).transfer(refundAmount);

        emit BookingCancelled(_bookingId, refundAmount);
    }

    /*
     * Check if a listing is already booked for specific dates
     * This prevents double-booking
     *
     * How it works:
     * - Look at all bookings for this listing
     * - Check if any active bookings (pending or checked-in) overlap with the requested dates
     * - Two date ranges overlap if: new_start < existing_end AND new_end > existing_start
    */
    function hasOverlappingBooking(
        uint256 _listingId,
        uint256 _checkInDate,
        uint256 _checkOutDate
    ) public view returns (bool) {
        uint256[] memory bookingIds = listingBookings[_listingId];

        for (uint256 i = 0; i < bookingIds.length; i++) {
            Booking memory booking = bookings[bookingIds[i]];

            // Only check bookings that are still active (ignore cancelled/completed)
            if (booking.status == BookingStatus.Pending ||
                booking.status == BookingStatus.CheckedIn) {

                // Check if dates overlap
                // Example: existing booking is Jan 10-15, new request is Jan 12-17
                // 12 < 15 AND 17 > 10 = true (overlap!)
                if (_checkInDate < booking.checkOutDate && _checkOutDate > booking.checkInDate) {
                    return true; // found an overlap
                }
            }
        }

        return false; // no overlaps found, dates are available
    }

    /*
     * Get all bookings for a specific guest
     * Returns an array of booking IDs
    */
    function getGuestBookings(address _guest) public view returns (uint256[] memory) {
        return guestBookings[_guest];
    }

    /*
     * Get all bookings for a specific host
     * Shows all reservations for all their properties
    */
    function getHostBookings(address _host) public view returns (uint256[] memory) {
        return hostBookings[_host];
    }

    /*
     * Get details about a specific booking
     * View function so it doesn't cost gas (just reading data)
    */
    function getBooking(uint256 _bookingId)
        public
        view
        bookingExists(_bookingId)
        returns (
            uint256 id,
            uint256 listingId,
            address guest,
            address host,
            uint256 checkInDate,
            uint256 checkOutDate,
            uint256 totalPrice,
            BookingStatus status
        )
    {
        Booking memory booking = bookings[_bookingId];
        return (
            booking.id,
            booking.listingId,
            booking.guest,
            booking.host,
            booking.checkInDate,
            booking.checkOutDate,
            booking.totalPrice,
            booking.status
        );
    }

    /*
     * Admin withdraws the accumulated protocol fees
     * This is how the platform makes money
     * Only admin can call this (security)
    */
    function withdrawProtocolFees() public onlyAdmin {
        require(protocolFeesCollected > 0, "No fees to withdraw");

        uint256 amount = protocolFeesCollected;
        protocolFeesCollected = 0; // reset to zero before transferring (prevents reentrancy)

        payable(admin).transfer(amount);

        emit ProtocolFeeWithdrawn(admin, amount);
    }

    /*
     * Admin can adjust the platform fee
     * Maximum 10% to prevent admin from setting crazy high fees
    */
    function setProtocolFee(uint256 _newFeePercent) public onlyAdmin {
        require(_newFeePercent <= 1000, "Fee can't be more than 10%");
        protocolFeePercent = _newFeePercent;
    }

    /*
     * Check how much ETH is held in this contract
     * Useful for debugging and transparency
    */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
