// Mock data used by the dashboard. Replace with on-chain/API data later.
// Field guide:
// - id: unique string identifier
// - title/location/type: display info and filters
// - pricePerNight: numeric price used for range slider and sorting
// - rating/reviewCount: quality signals for sorting and card UI
// - images: array of image URLs (first is used as thumbnail)
// - beds/baths/guests: capacity meta
// - amenities: lowercased tags used by the multi-select filter
// - isSuperhost: shows the badge on the card
export const LISTINGS = [
  { id: 'p1', title: 'Sunny Loft Near Downtown', location: 'Austin, TX', type: 'Apartment', pricePerNight: 165, rating: 4.83, reviewCount: 128, images: ['https://placehold.co/800x600?text=Loft'], beds: 2, baths: 1, guests: 4, isSuperhost: true, amenities: ['wifi','kitchen','parking'] },
  { id: 'p2', title: 'Cozy Cabin by the Lake', location: 'Tahoe, CA', type: 'Cabin', pricePerNight: 220, rating: 4.9, reviewCount: 92, images: ['https://placehold.co/800x600?text=Cabin'], beds: 3, baths: 2, guests: 6, isSuperhost: false, amenities: ['wifi','fireplace','parking'] },
  { id: 'p3', title: 'Modern Apartment With City Views', location: 'Seattle, WA', type: 'Apartment', pricePerNight: 140, rating: 4.7, reviewCount: 75, images: ['https://placehold.co/800x600?text=Apartment'], beds: 1, baths: 1, guests: 2, isSuperhost: false, amenities: ['wifi','kitchen','ac'] },
  { id: 'p4', title: 'Beachfront Villa With Pool', location: 'Miami, FL', type: 'Villa', pricePerNight: 520, rating: 4.95, reviewCount: 204, images: ['https://placehold.co/800x600?text=Villa'], beds: 4, baths: 3, guests: 8, isSuperhost: true, amenities: ['wifi','kitchen','pool','ac','parking'] },
  { id: 'p5', title: 'Quiet Suburban House', location: 'Raleigh, NC', type: 'House', pricePerNight: 110, rating: 4.5, reviewCount: 41, images: ['https://placehold.co/800x600?text=House'], beds: 3, baths: 2, guests: 5, isSuperhost: false, amenities: ['wifi','parking'] },
  { id: 'p6', title: 'Ski-In/Out Mountain Cabin', location: 'Park City, UT', type: 'Cabin', pricePerNight: 300, rating: 4.85, reviewCount: 116, images: ['https://placehold.co/800x600?text=Mountain+Cabin'], beds: 3, baths: 2, guests: 6, isSuperhost: true, amenities: ['wifi','fireplace','parking'] },
  { id: 'p7', title: 'Studio In Arts District', location: 'Los Angeles, CA', type: 'Studio', pricePerNight: 120, rating: 4.3, reviewCount: 58, images: ['https://placehold.co/800x600?text=Studio'], beds: 1, baths: 1, guests: 2, isSuperhost: false, amenities: ['wifi','ac'] },
  { id: 'p8', title: 'Historic House Near Riverwalk', location: 'San Antonio, TX', type: 'House', pricePerNight: 180, rating: 4.6, reviewCount: 77, images: ['https://placehold.co/800x600?text=Historic+House'], beds: 2, baths: 1, guests: 4, isSuperhost: false, amenities: ['wifi','kitchen'] },
  { id: 'p9', title: 'Waterfront Apartment', location: 'Chicago, IL', type: 'Apartment', pricePerNight: 200, rating: 4.75, reviewCount: 189, images: ['https://placehold.co/800x600?text=Waterfront'], beds: 2, baths: 2, guests: 4, isSuperhost: true, amenities: ['wifi','kitchen','parking','ac'] },
  { id: 'p10', title: 'Desert Retreat', location: 'Phoenix, AZ', type: 'House', pricePerNight: 150, rating: 4.4, reviewCount: 54, images: ['https://placehold.co/800x600?text=Desert+Retreat'], beds: 2, baths: 2, guests: 4, isSuperhost: false, amenities: ['wifi','ac','parking'] },
  { id: 'p11', title: 'Countryside Villa With Garden', location: 'Napa, CA', type: 'Villa', pricePerNight: 420, rating: 4.88, reviewCount: 132, images: ['https://placehold.co/800x600?text=Countryside+Villa'], beds: 4, baths: 3, guests: 7, isSuperhost: true, amenities: ['wifi','kitchen','parking','pool'] },
  { id: 'p12', title: 'Compact Downtown Studio', location: 'New York, NY', type: 'Studio', pricePerNight: 210, rating: 4.2, reviewCount: 201, images: ['https://placehold.co/800x600?text=Downtown+Studio'], beds: 1, baths: 1, guests: 2, isSuperhost: false, amenities: ['wifi','ac'] },
];
