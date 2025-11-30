// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BookingEscrow.sol";

// handles reviews after completed stays
contract Reviews {

    // need this to verify bookings
    BookingEscrow public bookingContract;

    uint256 public reviewCounter = 0;

    // review info
    struct Review {
        uint256 id;
        uint256 bookingId;
        uint256 listingId;
        address reviewer;
        address host;
        uint256 rating;
        string comment;
        uint256 createdAt;
        bool isActive;
    }

    // storage
    mapping(uint256 => Review) public reviews;
    mapping(uint256 => uint256[]) public listingReviews;
    mapping(address => uint256[]) public reviewerReviews;
    mapping(uint256 => bool) public bookingHasReview;

    // events for frontend
    event ReviewCreated(
        uint256 indexed reviewId,
        uint256 indexed listingId,
        uint256 indexed bookingId,
        address reviewer,
        uint256 rating
    );
    event ReviewUpdated(uint256 indexed reviewId, uint256 newRating, string newComment);
    event ReviewDeactivated(uint256 indexed reviewId);

    // make sure review exists
    modifier reviewExists(uint256 _reviewId) {
        require(_reviewId > 0 && _reviewId <= reviewCounter, "Review doesn't exist");
        _;
    }

    // only the person who wrote it
    modifier onlyReviewer(uint256 _reviewId) {
        require(reviews[_reviewId].reviewer == msg.sender, "Not your review");
        _;
    }

    constructor(address _bookingContractAddress) {
        bookingContract = BookingEscrow(_bookingContractAddress);
    }

    // leave a review after staying
    function createReview(
        uint256 _bookingId,
        uint256 _rating,
        string memory _comment
    ) public returns (uint256) {
        // get booking info to verify
        (
            ,
            uint256 listingId,
            address guest,
            address host,
            ,
            ,
            ,
            BookingEscrow.BookingStatus status
        ) = bookingContract.getBooking(_bookingId);

        require(status == BookingEscrow.BookingStatus.Completed, "Booking must be completed");
        require(guest == msg.sender, "You weren't the guest");
        require(!bookingHasReview[_bookingId], "Already reviewed");
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        require(bytes(_comment).length > 0, "Need a comment");

        reviewCounter++;

        reviews[reviewCounter] = Review({
            id: reviewCounter,
            bookingId: _bookingId,
            listingId: listingId,
            reviewer: msg.sender,
            host: host,
            rating: _rating,
            comment: _comment,
            createdAt: block.timestamp,
            isActive: true
        });

        listingReviews[listingId].push(reviewCounter);
        reviewerReviews[msg.sender].push(reviewCounter);
        bookingHasReview[_bookingId] = true;

        emit ReviewCreated(reviewCounter, listingId, _bookingId, msg.sender, _rating);

        return reviewCounter;
    }

    // edit your review
    function updateReview(
        uint256 _reviewId,
        uint256 _newRating,
        string memory _newComment
    ) public reviewExists(_reviewId) onlyReviewer(_reviewId) {
        Review storage review = reviews[_reviewId];

        require(review.isActive, "Review is deactivated");
        require(_newRating >= 1 && _newRating <= 5, "Rating must be 1-5");
        require(bytes(_newComment).length > 0, "Need a comment");

        review.rating = _newRating;
        review.comment = _newComment;

        emit ReviewUpdated(_reviewId, _newRating, _newComment);
    }

    // hide a review (reviewer or host can do this)
    function deactivateReview(uint256 _reviewId)
        public
        reviewExists(_reviewId)
    {
        Review storage review = reviews[_reviewId];

        require(
            msg.sender == review.reviewer || msg.sender == review.host,
            "Only reviewer or host can deactivate"
        );
        require(review.isActive, "Already deactivated");

        review.isActive = false;

        emit ReviewDeactivated(_reviewId);
    }

    // get reviews for a listing
    function getListingReviews(uint256 _listingId) public view returns (uint256[] memory) {
        return listingReviews[_listingId];
    }

    // get reviews by a person
    function getReviewerReviews(address _reviewer) public view returns (uint256[] memory) {
        return reviewerReviews[_reviewer];
    }

    // get review details
    function getReview(uint256 _reviewId)
        public
        view
        reviewExists(_reviewId)
        returns (
            uint256 id,
            uint256 listingId,
            address reviewer,
            uint256 rating,
            string memory comment,
            uint256 createdAt,
            bool isActive
        )
    {
        Review memory review = reviews[_reviewId];
        return (
            review.id,
            review.listingId,
            review.reviewer,
            review.rating,
            review.comment,
            review.createdAt,
            review.isActive
        );
    }

    // get average rating for a listing (returns rating * 100 for precision)
    function getListingAverageRating(uint256 _listingId) public view returns (uint256) {
        uint256[] memory reviewIds = listingReviews[_listingId];

        if (reviewIds.length == 0) {
            return 0;
        }

        uint256 totalRating = 0;
        uint256 activeCount = 0;

        for (uint256 i = 0; i < reviewIds.length; i++) {
            Review memory review = reviews[reviewIds[i]];
            if (review.isActive) {
                totalRating += review.rating;
                activeCount++;
            }
        }

        if (activeCount == 0) {
            return 0;
        }

        return (totalRating * 100) / activeCount;
    }

    // count active reviews for a listing
    function getListingReviewCount(uint256 _listingId) public view returns (uint256) {
        uint256[] memory reviewIds = listingReviews[_listingId];
        uint256 activeCount = 0;

        for (uint256 i = 0; i < reviewIds.length; i++) {
            if (reviews[reviewIds[i]].isActive) {
                activeCount++;
            }
        }

        return activeCount;
    }

    // check if booking has been reviewed
    function hasBeenReviewed(uint256 _bookingId) public view returns (bool) {
        return bookingHasReview[_bookingId];
    }
}
