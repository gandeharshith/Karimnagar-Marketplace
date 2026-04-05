// ─── Business Type ────────────────────────────────────────────────────────────
export interface Business {
  _id?: string;
  // Location hierarchy
  location: string;        // e.g. "Karimnagar"
  subLocation: string;     // e.g. "Mukarampura"
  category: string;        // e.g. "Restaurant & Food"
  subCategory: string;     // e.g. "Fast Food"
  // Core fields
  businessName: string;
  contactNumber: string;
  address: string;
  messageLink?: string;    // YouTube or Facebook link
  postersLink?: string;    // GIF or image URL
  // Arya Vysya community flag
  isAryaVysya?: boolean;
  // Images (base64 stored locally / in DB)
  images?: string[];
  // Meta
  createdAt?: string;
  updatedAt?: string;
  // Soft delete
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface AdminSession {
  isLoggedIn: boolean;
  username: string;
}

// ─── Location Data ────────────────────────────────────────────────────────────
export const LOCATIONS: Record<string, string[]> = {
  'Karimnagar': [
    'Mukarampura', 'Jyothinagar', 'Godavarikhani', 'Manakondur',
    'Huzurabad', 'Jammikunta', 'Choppadandi', 'Vemulawada',
    'Sircilla', 'Koratla', 'Metpally', 'Jagtial',
    'Dharmapuri', 'Peddapalli', 'Sultanabad', 'Ramagundam',
    'Manthani', 'Kataram', 'Gangadhara', 'Husnabad',
    'Shankarapatnam', 'Thimmapur', 'Yellareddypet', 'Kothapalli',
    'Other'
  ],
  'Hyderabad': [
    'Secunderabad', 'Begumpet', 'Ameerpet', 'Kukatpally',
    'Madhapur', 'Gachibowli', 'Banjara Hills', 'Jubilee Hills',
    'Himayatnagar', 'Nampally', 'Abids', 'Dilsukhnagar',
    'LB Nagar', 'Uppal', 'Nacharam', 'Malkajgiri',
    'Other'
  ],
  'Warangal': [
    'Hanamkonda', 'Kazipet', 'Warangal Urban', 'Warangal Rural',
    'Narsampet', 'Parkal', 'Mahabubabad', 'Jangaon',
    'Other'
  ],
  'Nizamabad': [
    'Nizamabad City', 'Armoor', 'Bodhan', 'Kamareddy',
    'Banswada', 'Yellareddy', 'Other'
  ],
  'Adilabad': [
    'Adilabad City', 'Mancherial', 'Nirmal', 'Bhainsa',
    'Utnoor', 'Asifabad', 'Other'
  ],
  'Other': ['Other'],
};

export const ALL_LOCATIONS = Object.keys(LOCATIONS);

// ─── Category Data ────────────────────────────────────────────────────────────
export const CATEGORIES: Record<string, string[]> = {
  'Restaurant & Food': [
    'Fast Food', 'Dine-in Restaurant', 'Tiffin Center', 'Bakery & Sweets',
    'Juice & Beverages', 'Catering Services', 'Cloud Kitchen', 'Dhaba',
    'Ice Cream Parlour', 'Biryani Center', 'Mess / Canteen', 'Other'
  ],
  'Hotel & Accommodation': [
    'Budget Hotel', 'Luxury Hotel', 'Guest House', 'Lodge',
    'Hostel', 'Resort', 'Service Apartment', 'Other'
  ],
  'Real Estate': [
    'Residential Plots', 'Commercial Plots', 'Apartments', 'Villas',
    'Rental Properties', 'Real Estate Agent', 'Construction', 'Other'
  ],
  'Retail Shop': [
    'General Store', 'Supermarket', 'Departmental Store', 'Wholesale',
    'Kirana Store', 'Stationery', 'Gift Shop', 'Other'
  ],
  'Healthcare & Medical': [
    'Hospital', 'Clinic', 'Pharmacy', 'Diagnostic Lab',
    'Dental Clinic', 'Eye Care', 'Physiotherapy', 'Ayurveda',
    'Homeopathy', 'Nursing Home', 'Other'
  ],
  'Education & Training': [
    'School', 'College', 'Coaching Center', 'Skill Training',
    'Computer Institute', 'Spoken English', 'Tuition Center', 'Other'
  ],
  'Beauty & Wellness': [
    'Beauty Parlour', 'Barber Shop', 'Spa & Massage', 'Salon',
    'Nail Art', 'Mehendi', 'Gym & Fitness', 'Yoga Center', 'Other'
  ],
  'Automobile': [
    'Car Showroom', 'Bike Showroom', 'Auto Repair', 'Car Wash',
    'Tyre Shop', 'Spare Parts', 'Driving School', 'Other'
  ],
  'Electronics & Technology': [
    'Mobile Shop', 'Computer Shop', 'Electronics Repair', 'CCTV & Security',
    'Home Appliances', 'IT Services', 'Software Company', 'Other'
  ],
  'Clothing & Fashion': [
    'Readymade Garments', 'Tailoring', 'Saree Shop', 'Kids Wear',
    'Men\'s Wear', 'Women\'s Wear', 'Footwear', 'Other'
  ],
  'Grocery & Supermarket': [
    'Grocery Store', 'Organic Store', 'Fruits & Vegetables', 'Dairy Products',
    'Meat & Fish', 'Dry Fruits', 'Other'
  ],
  'Bank & Finance': [
    'Bank', 'Cooperative Bank', 'Microfinance', 'Insurance',
    'Loan Services', 'Money Transfer', 'Chit Fund', 'Other'
  ],
  'Legal & Consulting': [
    'Advocate / Lawyer', 'CA / Accountant', 'Tax Consultant',
    'Business Consultant', 'Property Consultant', 'Other'
  ],
  'Construction & Hardware': [
    'Hardware Store', 'Building Materials', 'Plumbing', 'Electrical',
    'Painting', 'Interior Design', 'Tiles & Flooring', 'Other'
  ],
  'Agriculture & Farming': [
    'Seeds & Fertilizers', 'Farm Equipment', 'Pesticides',
    'Organic Farming', 'Dairy Farm', 'Poultry', 'Other'
  ],
  'Transport & Logistics': [
    'Auto Rickshaw', 'Taxi / Cab', 'Truck Transport', 'Courier Service',
    'Packers & Movers', 'Bus Service', 'Other'
  ],
  'Entertainment & Events': [
    'Event Management', 'Photography', 'Videography', 'DJ Services',
    'Tent & Decoration', 'Cinema Hall', 'Amusement Park', 'Other'
  ],
  'Jewellery & Accessories': [
    'Gold Jewellery', 'Silver Jewellery', 'Artificial Jewellery',
    'Watch Shop', 'Optical Shop', 'Other'
  ],
  'Furniture & Home Decor': [
    'Furniture Shop', 'Modular Kitchen', 'Home Decor', 'Curtains & Blinds',
    'Mattress & Bedding', 'Other'
  ],
  'Petrol & Gas Station': [
    'Petrol Bunk', 'LPG Distributor', 'CNG Station', 'Other'
  ],
  'Religious & Spiritual': [
    'Temple', 'Mosque', 'Church', 'Gurudwara',
    'Astrology', 'Pooja Items', 'Other'
  ],
  'Government & Public Services': [
    'Government Office', 'Post Office', 'Police Station',
    'Municipal Office', 'Other'
  ],
  'Other': ['Other'],
};

export const ALL_CATEGORIES = Object.keys(CATEGORIES);

// ─── Excel columns (no images) ────────────────────────────────────────────────
export const EXCEL_COLUMNS: (keyof Business)[] = [
  'location', 'subLocation', 'category', 'subCategory',
  'businessName', 'contactNumber', 'address',
  'messageLink', 'postersLink', 'createdAt',
];
