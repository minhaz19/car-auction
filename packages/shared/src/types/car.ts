export type CarCondition = 'New' | 'Used' | 'Certified Pre-Owned';
export type BodyType =
  | 'Sedan'
  | 'SUV'
  | 'Truck'
  | 'Coupe'
  | 'Hatchback'
  | 'Convertible'
  | 'Wagon'
  | 'Van';
export type Transmission = 'Automatic' | 'Manual';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
export type AuctionStatus = 'upcoming' | 'live' | 'ended';

export interface ICar {
  _id: string;
  sellerId: string;
  make: string;
  model: string;
  year: number;
  condition: CarCondition;
  bodyType: BodyType;
  mileage: number;
  transmission: Transmission;
  fuelType: FuelType;
  color: string;
  images: string[];
  description: string;
  startingBid: number;
  currentBid: number;
  reservePrice?: number;
  auctionStart: string;
  auctionEnd: string;
  status: AuctionStatus;
  bidCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CarFilterParams {
  condition?: CarCondition;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  bodyType?: BodyType;
  mileageMax?: number;
  transmission?: Transmission;
  fuelType?: FuelType;
  status?: AuctionStatus;
  sort?: 'endingSoonest' | 'priceAsc' | 'priceDesc' | 'mostBids' | 'newest';
  page?: number;
  limit?: number;
}

export interface PaginatedCarsResponse {
  cars: ICar[];
  total: number;
  page: number;
  totalPages: number;
}
