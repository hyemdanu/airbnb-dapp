// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BookingEscrow.sol";

/*
 * Reviews and Ratings Contract
 * Guests can leave reviews after completing a stay
 * This helps build trust and lets future guests know what to expect
 * Only verified guests (who actually stayed) can leave reviews - prevents fake reviews
*/
contract Reviews {

    // Reference to BookingEscrow so we can verify someone actually stayed there
    BookingEscrow public bookingContract;

    // Counter for review IDs
    uint256 public reviewCounter = 0;

    // Review structure - all the info about one review
    struct Review {
        uint256 id;              // unique review ID
        uint256 bookingId;       // which booking this review is for
        uint256 listingId;       // which property was reviewed
        address reviewer;        // who wrote the review (the guest)
        address host;            // who owns the property
        uint256 rating;          // 1-5 stars
        string comment;          // written review text
        uint256 createdAt;       // when the review was posted
        bool isActive;           // can be deactivated if inappropriate
    }

    /*
     * Storage mappings to organize reviews
    */
    mapping(uint256 => Review) public reviews; // reviewId -> Review

    // All reviews for a specific listing
    // Example: if you're looking at a property, show all its reviews
    mapping(uint256 => uint256[]) public listingReviews;

    // All reviews written by a specific user
    // Example: your review history
    mapping(address => uint256[]) public reviewerReviews;

    // Track if a booking already has a review (one review per booking)
    // Prevents someone from leaving multiple reviews for the same stay
    mapping(uint256 => bool) public bookingHasReview;

    /*
     * Events for the frontend to listen to
    */
    event ReviewCreated(
        uint256 indexed reviewId,
        uint256 indexed listingId,
        uint256 indexed bookingId,
        address reviewer,
        uint256 rating
    );

    event ReviewUpdated(uint256 indexed reviewId, uint256 newRating, string newComment);
    event ReviewDeactivated(uint256 indexed reviewId);

    /*
     * Modifiers for security checks
    */
    modifier reviewExists(uint256 _reviewId) {
        require(_reviewId > 0 && _reviewId <= reviewCounter, "Review doesn't exist");
        _;
    }

    modifier onlyReviewer(uint256 _reviewId) {
        require(reviews[_reviewId].reviewer == msg.sender, "You didn't write this review");
        _;
    }

    /*
     * Constructor - need to know where the BookingEscrow contract is
     * so we can verify bookings are real
    */
    constructor(address _bookingContractAddress) {
        bookingContract = BookingEscrow(_bookingContractAddress);
    }

    /*
     * Create a new review
     * Only guests who completed a stay can leave a review
     *
     * Process:
     * 1. Verify the booking exists and is completed
     * 2. Make sure the person leaving review is the guest from that booking
     * 3. Check they haven't already reviewed this booking
     * 4. Validate rating (must be 1-5 stars)
     * 5. Create and store the review
    */
    function createReview(
        uint256 _bookingId,
        uint256 _rating,
        string memory _comment
    ) public returns (uint256) {
        // Get booking details from the BookingEscrow contract
        (
            ,                    // id
            uint256 listingId,
            address guest,
            address host,
            ,                    // checkInDate
            ,                    // checkOutDate
            ,                    // totalPrice
            BookingEscrow.BookingStatus status
        ) = bookingContract.getBooking(_bookingId);

        // Make sure booking is completed (can't review if you haven't stayed yet)
        require(status == BookingEscrow.BookingStatus.Completed, "Can only review completed bookings");

        // Make sure the person leaving review is actually the guest who stayed there
        require(guest == msg.sender, "You weren't the guest for this booking");

        // Prevent duplicate reviews (one review per booking)
        require(!bookingHasReview[_bookingId], "You already reviewed this booking");

        // Rating must be 1-5 stars (standard rating system)
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5 stars");

        // Comment should have some content (optional but encouraged)
        require(bytes(_comment).length > 0, "Please write a comment");

        // Create the review
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

        // Add to tracking lists
        listingReviews[listingId].push(reviewCounter);
        reviewerReviews[msg.sender].push(reviewCounter);

        // Mark this booking as reviewed
        bookingHasReview[_bookingId] = true;

        // Notify frontend
        emit ReviewCreated(reviewCounter, listingId, _bookingId, msg.sender, _rating);

        return reviewCounter;
    }

    /*
     * Update an existing review
     * Only the person who wrote it can edit it
     * Can't edit if review has been deactivated
    */
    function updateReview(
        uint256 _reviewId,
        uint256 _newRating,
        string memory _newComment
    ) public reviewExists(_reviewId) onlyReviewer(_reviewId) {
        Review storage review = reviews[_reviewId];

        require(review.isActive, "Can't update a deactivated review");
        require(_newRating >= 1 && _newRating <= 5, "Rating must be 1-5 stars");
        require(bytes(_newComment).length > 0, "Comment can't be empty");

        // Update the review
        review.rating = _newRating;
        review.comment = _newComment;

        emit ReviewUpdated(_reviewId, _newRating, _newComment);
    }

    /*
     * Deactivate a review (soft delete)
     * Either the reviewer or host can request this
     * Useful for removing inappropriate content
     * Doesn't delete from blockchain (blockchain data is permanent) but marks as inactive
    */
    function deactivateReview(uint256 _reviewId)
        public
        reviewExists(_reviewId)
    {
        Review storage review = reviews[_reviewId];

        // Only the reviewer or the host can deactivate
        require(
            msg.sender == review.reviewer || msg.sender == review.host,
            "Only reviewer or host can deactivate"
        );

        require(review.isActive, "Review is already deactivated");

        review.isActive = false;

        emit ReviewDeactivated(_reviewId);
    }

    /*
     * Get all reviews for a specific listing
     * Used to show reviews on a property page
    */
    function getListingReviews(uint256 _listingId) public view returns (uint256[] memory) {
        return listingReviews[_listingId];
    }

    /*
     * Get all reviews written by a specific user
     * Shows your review history
    */
    function getReviewerReviews(address _reviewer) public view returns (uint256[] memory) {
        return reviewerReviews[_reviewer];
    }

    /*
     * Get details of a specific review
     * View function - doesn't cost gas
    */
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

    /*
     * Calculate average rating for a listing
     * Goes through all active reviews and calculates the mean
     * Returns rating * 100 (so 4.75 stars = 475) to avoid decimals in Solidity
    */
    function getListingAverageRating(uint256 _listingId) public view returns (uint256) {
        uint256[] memory reviewIds = listingReviews[_listingId];

        if (reviewIds.length == 0) {
            return 0; // no reviews yet
        }

        uint256 totalRating = 0;
        uint256 activeCount = 0;

        // Sum up all active reviews
        for (uint256 i = 0; i < reviewIds.length; i++) {
            Review memory review = reviews[reviewIds[i]];
            if (review.isActive) {
                totalRating += review.rating;
                activeCount++;
            }
        }

        if (activeCount == 0) {
            return 0; // no active reviews
        }

        // Calculate average and multiply by 100 to handle decimals
        // Example: total = 19, count = 4, avg = 4.75
        // We return 475 (which frontend can display as 4.75)
        return (totalRating * 100) / activeCount;
    }

    /*
     * Get total number of active reviews for a listing
     * Useful for showing "Based on 42 reviews"
    */
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

    /*
     * Check if a booking has already been reviewed
     * Prevents duplicate reviews
    */
    function hasBeenReviewed(uint256 _bookingId) public view returns (bool) {
        return bookingHasReview[_bookingId];
    }
}
