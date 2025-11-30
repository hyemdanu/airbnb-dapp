// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Listings.sol";

// handles bookings and payments
// money sits here until checkout then goes to host
contract BookingEscrow {

    // need this to check listing info
    Listings public listingsContract;

    // platform takes 2.5% (250/10000)
    uint256 public protocolFeePercent = 250;
    uint256 public constant FEE_DENOMINATOR = 10000;

    // admin gets platform fees
    address public admin;
    uint256 public protocolFeesCollected;
    uint256 public bookingCounter = 0;

    // booking status options
    enum BookingStatus {
        Pending,
        CheckedIn,
        Completed,
        Cancelled,
        Disputed
    }

    // booking info
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

    // storage
    mapping(uint256 => Booking) public bookings;
    mapping(address => uint256[]) public guestBookings;
    mapping(address => uint256[]) public hostBookings;
    mapping(uint256 => uint256[]) public listingBookings;

    // events for frontend
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

    // security checks
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
        require(_bookingId > 0 && _bookingId <= bookingCounter, "Booking doesn't exist");
        _;
    }

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
        require(_checkInDate > block.timestamp, "Can't book in the past");
        require(_checkOutDate > _checkInDate, "Check-out must be after check-in");

        // get listing info (8 values now with propertyType and beds)
        (
            ,
            address host,
            ,
            ,
            ,
            ,
            uint256 pricePerNight,
            bool isActive
        ) = listingsContract.getListing(_listingId);

        require(isActive, "Listing not active");
        require(host != msg.sender, "Can't book your own listing");

        // calculate nights and cost
        uint256 nights = (_checkOutDate - _checkInDate) / 1 days;
        require(nights > 0, "Need at least 1 night");

        uint256 totalPrice = pricePerNight * nights;
        require(msg.value >= totalPrice, "Not enough ETH");

        // platform fee goes to us, rest to host
        uint256 protocolFee = (totalPrice * protocolFeePercent) / FEE_DENOMINATOR;
        uint256 hostPayout = totalPrice - protocolFee;

        // check for double booking
        require(
            !hasOverlappingBooking(_listingId, _checkInDate, _checkOutDate),
            "Dates already booked"
        );

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

        guestBookings[msg.sender].push(bookingCounter);
        hostBookings[host].push(bookingCounter);
        listingBookings[_listingId].push(bookingCounter);

        // refund if overpaid
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

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

    // guest checks in
    function checkIn(uint256 _bookingId)
        public
        bookingExists(_bookingId)
        onlyGuest(_bookingId)
    {
        Booking storage booking = bookings[_bookingId];

        require(booking.status == BookingStatus.Pending, "Booking must be pending");
        require(block.timestamp >= booking.checkInDate, "Too early to check in");
        require(block.timestamp < booking.checkOutDate, "Check-in window passed");

        booking.status = BookingStatus.CheckedIn;

        emit CheckedIn(_bookingId, block.timestamp);
    }

    // checkout releases payment to host
    function checkOut(uint256 _bookingId)
        public
        bookingExists(_bookingId)
    {
        Booking storage booking = bookings[_bookingId];

        require(
            msg.sender == booking.guest || msg.sender == booking.host,
            "Only guest or host can checkout"
        );
        require(
            booking.status == BookingStatus.CheckedIn || booking.status == BookingStatus.Pending,
            "Wrong booking status"
        );
        require(block.timestamp >= booking.checkOutDate, "Too early to checkout");

        booking.status = BookingStatus.Completed;

        protocolFeesCollected += booking.protocolFee;
        payable(booking.host).transfer(booking.hostPayout);

        emit CheckedOut(_bookingId, block.timestamp);
        emit PaymentReleased(_bookingId, booking.host, booking.hostPayout);
    }

    // cancel - full refund if 24h+ before, 50% if within 24h
    function cancelBooking(uint256 _bookingId)
        public
        bookingExists(_bookingId)
        onlyGuest(_bookingId)
    {
        Booking storage booking = bookings[_bookingId];

        require(booking.status == BookingStatus.Pending, "Can only cancel pending bookings");
        require(block.timestamp < booking.checkInDate, "Too late to cancel");

        booking.status = BookingStatus.Cancelled;

        uint256 refundAmount;

        if (block.timestamp < booking.checkInDate - 1 days) {
            // more than 24h before - full refund
            refundAmount = booking.totalPrice;
        } else {
            // within 24h - 50% refund, host gets other 50%
            refundAmount = booking.totalPrice / 2;
            uint256 hostCompensation = booking.totalPrice - refundAmount;
            payable(booking.host).transfer(hostCompensation);
        }

        payable(booking.guest).transfer(refundAmount);

        emit BookingCancelled(_bookingId, refundAmount);
    }

    // check if dates overlap with existing bookings
    function hasOverlappingBooking(
        uint256 _listingId,
        uint256 _checkInDate,
        uint256 _checkOutDate
    ) public view returns (bool) {
        uint256[] memory bookingIds = listingBookings[_listingId];

        for (uint256 i = 0; i < bookingIds.length; i++) {
            Booking memory booking = bookings[bookingIds[i]];

            if (booking.status == BookingStatus.Pending ||
                booking.status == BookingStatus.CheckedIn) {

                if (_checkInDate < booking.checkOutDate && _checkOutDate > booking.checkInDate) {
                    return true;
                }
            }
        }

        return false;
    }

    // get bookings for a guest
    function getGuestBookings(address _guest) public view returns (uint256[] memory) {
        return guestBookings[_guest];
    }

    // get bookings for a host
    function getHostBookings(address _host) public view returns (uint256[] memory) {
        return hostBookings[_host];
    }

    // get booking details
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

    // admin withdraws platform fees
    function withdrawProtocolFees() public onlyAdmin {
        require(protocolFeesCollected > 0, "No fees to withdraw");

        uint256 amount = protocolFeesCollected;
        protocolFeesCollected = 0;

        payable(admin).transfer(amount);

        emit ProtocolFeeWithdrawn(admin, amount);
    }

    // admin can change fee (max 10%)
    function setProtocolFee(uint256 _newFeePercent) public onlyAdmin {
        require(_newFeePercent <= 1000, "Fee can't exceed 10%");
        protocolFeePercent = _newFeePercent;
    }

    // check contract balance
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
