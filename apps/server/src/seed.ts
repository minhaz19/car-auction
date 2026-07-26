import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from './models/User';
import { Car } from './models/Car';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-auction';

const CAR_IMAGES = [
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1541348263662-e068662d82af?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80',
];

const SAMPLE_CARS_DATA = [
  { make: 'BMW', model: 'M4 Competition', year: 2023, condition: 'Certified Pre-Owned', bodyType: 'Coupe', mileage: 8500, transmission: 'Automatic', fuelType: 'Petrol', color: 'Isle of Man Green', startingBid: 68000, currentBid: 74500, bidCount: 12, status: 'live', hoursLeft: 4 },
  { make: 'BMW', model: 'X5 M50i', year: 2022, condition: 'Used', bodyType: 'SUV', mileage: 24000, transmission: 'Automatic', fuelType: 'Petrol', color: 'Carbon Black', startingBid: 52000, currentBid: 59000, bidCount: 8, status: 'live', hoursLeft: 14 },
  { make: 'BMW', model: '3 Series 330i', year: 2021, condition: 'Used', bodyType: 'Sedan', mileage: 31000, transmission: 'Automatic', fuelType: 'Petrol', color: 'Alpine White', startingBid: 28000, currentBid: 32500, bidCount: 5, status: 'live', hoursLeft: 48 },
  { make: 'Porsche', model: '911 Carrera S', year: 2022, condition: 'Used', bodyType: 'Coupe', mileage: 6200, transmission: 'Automatic', fuelType: 'Petrol', color: 'Guards Red', startingBid: 115000, currentBid: 128000, bidCount: 19, status: 'live', hoursLeft: 2 },
  { make: 'Porsche', model: 'Taycan Turbo S', year: 2023, condition: 'New', bodyType: 'Sedan', mileage: 120, transmission: 'Automatic', fuelType: 'Electric', color: 'Frozen Blue', startingBid: 140000, currentBid: 155000, bidCount: 14, status: 'live', hoursLeft: 8 },
  { make: 'Porsche', model: '718 Cayman GT4', year: 2021, condition: 'Certified Pre-Owned', bodyType: 'Coupe', mileage: 9400, transmission: 'Manual', fuelType: 'Petrol', color: 'Python Green', startingBid: 98000, currentBid: 104000, bidCount: 9, status: 'live', hoursLeft: 36 },
  { make: 'Tesla', model: 'Model S Plaid', year: 2023, condition: 'New', bodyType: 'Sedan', mileage: 50, transmission: 'Automatic', fuelType: 'Electric', color: 'Pearl White', startingBid: 85000, currentBid: 92000, bidCount: 11, status: 'live', hoursLeft: 6 },
  { make: 'Tesla', model: 'Cybertruck Cyberbeast', year: 2024, condition: 'New', bodyType: 'Truck', mileage: 15, transmission: 'Automatic', fuelType: 'Electric', color: 'Stainless Steel', startingBid: 99000, currentBid: 112000, bidCount: 24, status: 'live', hoursLeft: 1 },
  { make: 'Tesla', model: 'Model Y Long Range', year: 2022, condition: 'Used', bodyType: 'SUV', mileage: 18500, transmission: 'Automatic', fuelType: 'Electric', color: 'Midnight Silver', startingBid: 34000, currentBid: 38500, bidCount: 7, status: 'live', hoursLeft: 72 },
  { make: 'Mercedes-Benz', model: 'G-Class (G-Wagon)', year: 2023, condition: 'New', bodyType: 'SUV', mileage: 450, transmission: 'Automatic', fuelType: 'Petrol', color: 'Obsidian Black', startingBid: 160000, currentBid: 178000, bidCount: 18, status: 'live', hoursLeft: 3 },
  { make: 'Mercedes-Benz', model: 'AMG GT R', year: 2020, condition: 'Used', bodyType: 'Coupe', mileage: 14200, transmission: 'Automatic', fuelType: 'Petrol', color: 'Green Hell Magno', startingBid: 130000, currentBid: 142000, bidCount: 15, status: 'live', hoursLeft: 18 },
  { make: 'Mercedes-Benz', model: 'S-Class S580', year: 2022, condition: 'Certified Pre-Owned', bodyType: 'Sedan', mileage: 16000, transmission: 'Automatic', fuelType: 'Hybrid', color: 'Nautical Blue', startingBid: 88000, currentBid: 96000, bidCount: 10, status: 'live', hoursLeft: 30 },
  { make: 'Audi', model: 'R8 V10 Performance', year: 2022, condition: 'Certified Pre-Owned', bodyType: 'Coupe', mileage: 4800, transmission: 'Automatic', fuelType: 'Petrol', color: 'Daytona Gray', startingBid: 150000, currentBid: 165000, bidCount: 21, status: 'live', hoursLeft: 5 },
  { make: 'Audi', model: 'RS6 Avant', year: 2023, condition: 'New', bodyType: 'Wagon', mileage: 800, transmission: 'Automatic', fuelType: 'Petrol', color: 'Nardo Gray', startingBid: 110000, currentBid: 124000, bidCount: 16, status: 'live', hoursLeft: 12 },
  { make: 'Ford', model: 'Mustang Shelby GT500', year: 2022, condition: 'Certified Pre-Owned', bodyType: 'Coupe', mileage: 5200, transmission: 'Automatic', fuelType: 'Petrol', color: 'Grabber Blue', startingBid: 72000, currentBid: 81000, bidCount: 13, status: 'live', hoursLeft: 9 },
  { make: 'Ford', model: 'F-150 Raptor R', year: 2023, condition: 'New', bodyType: 'Truck', mileage: 300, transmission: 'Automatic', fuelType: 'Petrol', color: 'Code Orange', startingBid: 95000, currentBid: 108000, bidCount: 22, status: 'live', hoursLeft: 22 },
  { make: 'Ford', model: 'Bronco Wildtrak', year: 2023, condition: 'Used', bodyType: 'SUV', mileage: 11200, transmission: 'Automatic', fuelType: 'Petrol', color: 'Eruption Green', startingBid: 48000, currentBid: 53500, bidCount: 8, status: 'live', hoursLeft: 40 },
  { make: 'Toyota', model: 'GR Supra 3.0', year: 2023, condition: 'Certified Pre-Owned', bodyType: 'Coupe', mileage: 7100, transmission: 'Manual', fuelType: 'Petrol', color: 'Stratosphere Blue', startingBid: 46000, currentBid: 51000, bidCount: 11, status: 'live', hoursLeft: 15 },
  { make: 'Toyota', model: 'Land Cruiser', year: 2024, condition: 'New', bodyType: 'SUV', mileage: 45, transmission: 'Automatic', fuelType: 'Hybrid', color: 'Heritage Blue', startingBid: 62000, currentBid: 69500, bidCount: 17, status: 'live', hoursLeft: 7 },
  { make: 'Toyota', model: 'Tacoma TRD Pro', year: 2023, condition: 'Used', bodyType: 'Truck', mileage: 14000, transmission: 'Automatic', fuelType: 'Petrol', color: 'Solar Octane', startingBid: 42000, currentBid: 46800, bidCount: 9, status: 'live', hoursLeft: 55 },
  { make: 'Chevrolet', model: 'Corvette Z06', year: 2023, condition: 'New', bodyType: 'Coupe', mileage: 150, transmission: 'Automatic', fuelType: 'Petrol', color: 'Torch Red', startingBid: 125000, currentBid: 141000, bidCount: 28, status: 'live', hoursLeft: 1 },
  { make: 'Chevrolet', model: 'Camaro ZL1', year: 2022, condition: 'Used', bodyType: 'Coupe', mileage: 12800, transmission: 'Manual', fuelType: 'Petrol', color: 'Vivid Orange', startingBid: 58000, currentBid: 63500, bidCount: 7, status: 'live', hoursLeft: 60 },
  { make: 'Nissan', model: 'GT-R Nismo', year: 2021, condition: 'Used', bodyType: 'Coupe', mileage: 8900, transmission: 'Automatic', fuelType: 'Petrol', color: 'Pearl White', startingBid: 175000, currentBid: 192000, bidCount: 25, status: 'live', hoursLeft: 10 },
  { make: 'Nissan', model: 'Z Performance', year: 2023, condition: 'New', bodyType: 'Coupe', mileage: 220, transmission: 'Manual', fuelType: 'Petrol', color: 'Ikazuchi Yellow', startingBid: 45000, currentBid: 49000, bidCount: 6, status: 'live', hoursLeft: 33 },
  { make: 'Lexus', model: 'LC 500 Convertible', year: 2022, condition: 'Certified Pre-Owned', bodyType: 'Convertible', mileage: 9800, transmission: 'Automatic', fuelType: 'Petrol', color: 'Structural Blue', startingBid: 82000, currentBid: 89000, bidCount: 12, status: 'live', hoursLeft: 27 },
  { make: 'Lexus', model: 'GX 550 Overtrail', year: 2024, condition: 'New', bodyType: 'SUV', mileage: 85, transmission: 'Automatic', fuelType: 'Petrol', color: 'Earth Tan', startingBid: 69000, currentBid: 77000, bidCount: 19, status: 'live', hoursLeft: 11 },
  { make: 'Subaru', model: 'WRX STI', year: 2021, condition: 'Used', bodyType: 'Sedan', mileage: 22000, transmission: 'Manual', fuelType: 'Petrol', color: 'World Rally Blue', startingBid: 32000, currentBid: 36500, bidCount: 14, status: 'live', hoursLeft: 44 },
  { make: 'Subaru', model: 'BRZ Limited', year: 2023, condition: 'Used', bodyType: 'Coupe', mileage: 11500, transmission: 'Manual', fuelType: 'Petrol', color: 'Crystal Black', startingBid: 24000, currentBid: 27200, bidCount: 6, status: 'live', hoursLeft: 64 },
  { make: 'Dodge', model: 'Challenger SRT Hellcat', year: 2023, condition: 'New', bodyType: 'Coupe', mileage: 90, transmission: 'Manual', fuelType: 'Petrol', color: 'Plum Crazy', startingBid: 78000, currentBid: 86500, bidCount: 20, status: 'live', hoursLeft: 5 },
  { make: 'Volkswagen', model: 'Golf R', year: 2023, condition: 'Certified Pre-Owned', bodyType: 'Hatchback', mileage: 10400, transmission: 'Manual', fuelType: 'Petrol', color: 'Lapiz Blue', startingBid: 39000, currentBid: 43200, bidCount: 9, status: 'live', hoursLeft: 19 },
  { make: 'Hyundai', model: 'IONIQ 5 N', year: 2024, condition: 'New', bodyType: 'SUV', mileage: 40, transmission: 'Automatic', fuelType: 'Electric', color: 'Performance Blue', startingBid: 60000, currentBid: 65800, bidCount: 15, status: 'live', hoursLeft: 16 },
  { make: 'Kia', model: 'EV6 GT', year: 2023, condition: 'Used', bodyType: 'SUV', mileage: 14800, transmission: 'Automatic', fuelType: 'Electric', color: 'Runway Red', startingBid: 41000, currentBid: 45000, bidCount: 7, status: 'live', hoursLeft: 50 },
  // Upcoming / Ended listings for filter testing
  { make: 'BMW', model: 'M5 CS', year: 2022, condition: 'Certified Pre-Owned', bodyType: 'Sedan', mileage: 5100, transmission: 'Automatic', fuelType: 'Petrol', color: 'Frozen Deep Green', startingBid: 135000, currentBid: 135000, bidCount: 0, status: 'upcoming', hoursLeft: 120 },
  { make: 'Porsche', model: '911 GT3 RS', year: 2023, condition: 'New', bodyType: 'Coupe', mileage: 300, transmission: 'Automatic', fuelType: 'Petrol', color: 'Lizard Green', startingBid: 290000, currentBid: 335000, bidCount: 31, status: 'ended', hoursLeft: -24 },
  { make: 'Ford', model: 'GT', year: 2020, condition: 'Used', bodyType: 'Coupe', mileage: 1800, transmission: 'Automatic', fuelType: 'Petrol', color: 'Liquid Blue', startingBid: 850000, currentBid: 980000, bidCount: 42, status: 'ended', hoursLeft: -72 },
];

async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create or find default seller user
    let seller = await User.findOne({ email: 'seller@revbid.dev' });
    if (!seller) {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      seller = await User.create({
        name: 'RevBid Official Seller',
        email: 'seller@revbid.dev',
        passwordHash,
        role: 'seller',
      });
      console.log('👤 Created default seller user: seller@revbid.dev');
    }

    // Clear existing cars
    await Car.deleteMany({});
    console.log('🧹 Cleared existing car listings');

    const now = new Date();

    const carDocuments = SAMPLE_CARS_DATA.map((c, index) => {
      const auctionStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // started yesterday
      const auctionEnd = new Date(now.getTime() + c.hoursLeft * 60 * 60 * 1000);
      const imageIndex = index % CAR_IMAGES.length;

      return {
        sellerId: seller._id,
        make: c.make,
        model: c.model,
        year: c.year,
        condition: c.condition,
        bodyType: c.bodyType,
        mileage: c.mileage,
        transmission: c.transmission,
        fuelType: c.fuelType,
        color: c.color,
        images: [CAR_IMAGES[imageIndex], CAR_IMAGES[(imageIndex + 1) % CAR_IMAGES.length]],
        description: `Stunning ${c.year} ${c.make} ${c.model} in ${c.color}. Meticulously maintained, garage kept, full service records available. Excellent condition throughout.`,
        startingBid: c.startingBid,
        currentBid: c.currentBid,
        reservePrice: Math.round(c.startingBid * 1.1),
        auctionStart,
        auctionEnd,
        status: c.status,
        bidCount: c.bidCount,
      };
    });

    const insertedCars = await Car.insertMany(carDocuments);
    console.log(`🚀 Successfully seeded ${insertedCars.length} car listings!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
