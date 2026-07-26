import { Router, Request, Response, IRouter } from 'express';
import { Car } from '../models/Car';
import { requireAuth, requireRole } from '../middleware/auth';
import type { CarCondition, BodyType, Transmission, FuelType, AuctionStatus } from '@car-auction/shared';

const router: IRouter = Router();

// ─── GET /api/cars/featured ──────────────────────────────────────────────────
// Returns top 6 live auctions ending soonest for the homepage carousel/grid
router.get('/featured', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cars = await Car.find({ status: 'live' })
      .sort({ auctionEnd: 1 })
      .limit(6)
      .populate('sellerId', 'name email');

    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch featured cars', error });
  }
});

// ─── GET /api/cars ───────────────────────────────────────────────────────────
// Filtered, paginated, and sorted car listings search
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      condition,
      make,
      model,
      yearMin,
      yearMax,
      priceMin,
      priceMax,
      bodyType,
      mileageMax,
      transmission,
      fuelType,
      status,
      sort,
      page = '1',
      limit = '9',
    } = req.query;

    const filter: Record<string, unknown> = {};

    if (condition) filter.condition = condition as CarCondition;
    if (make) filter.make = new RegExp(`^${make}$`, 'i');
    if (model) filter.model = new RegExp(`^${model}$`, 'i');
    if (bodyType) filter.bodyType = bodyType as BodyType;
    if (transmission) filter.transmission = transmission as Transmission;
    if (fuelType) filter.fuelType = fuelType as FuelType;
    if (status) filter.status = status as AuctionStatus;

    if (yearMin || yearMax) {
      filter.year = {};
      if (yearMin) (filter.year as Record<string, number>).$gte = Number(yearMin);
      if (yearMax) (filter.year as Record<string, number>).$lte = Number(yearMax);
    }

    if (priceMin || priceMax) {
      filter.currentBid = {};
      if (priceMin) (filter.currentBid as Record<string, number>).$gte = Number(priceMin);
      if (priceMax) (filter.currentBid as Record<string, number>).$lte = Number(priceMax);
    }

    if (mileageMax) {
      filter.mileage = { $lte: Number(mileageMax) };
    }

    // Sort order map
    let sortOptions: Record<string, 1 | -1> = { auctionEnd: 1 };
    if (sort === 'priceAsc') sortOptions = { currentBid: 1 };
    else if (sort === 'priceDesc') sortOptions = { currentBid: -1 };
    else if (sort === 'mostBids') sortOptions = { bidCount: -1 };
    else if (sort === 'newest') sortOptions = { createdAt: -1 };
    else if (sort === 'endingSoonest') sortOptions = { auctionEnd: 1 };

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit as string, 10) || 9));
    const skip = (pageNum - 1) * limitNum;

    const [cars, total] = await Promise.all([
      Car.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('sellerId', 'name email'),
      Car.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      cars,
      total,
      page: pageNum,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch car listings', error });
  }
});

// ─── GET /api/cars/:id ───────────────────────────────────────────────────────
// Get single car listing details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const car = await Car.findById(req.params.id).populate('sellerId', 'name email role');
    if (!car) {
      res.status(404).json({ message: 'Car listing not found' });
      return;
    }
    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving car details', error });
  }
});

// ─── POST /api/cars ──────────────────────────────────────────────────────────
// Create listing (seller/admin only)
router.post(
  '/',
  requireAuth,
  requireRole('seller', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        make,
        model,
        year,
        condition,
        bodyType,
        mileage,
        transmission,
        fuelType,
        color,
        images,
        description,
        startingBid,
        reservePrice,
        auctionDurationDays = 7,
      } = req.body;

      if (!make || !model || !year || !startingBid || !images || images.length === 0) {
        res.status(400).json({ message: 'Required car details or images are missing' });
        return;
      }

      const auctionStart = new Date();
      const auctionEnd = new Date(auctionStart.getTime() + Number(auctionDurationDays) * 24 * 60 * 60 * 1000);

      const newCar = await Car.create({
        sellerId: req.user!.sub,
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        condition,
        bodyType,
        mileage: Number(mileage),
        transmission,
        fuelType,
        color: color?.trim() || 'Unspecified',
        images,
        description: description?.trim() || '',
        startingBid: Number(startingBid),
        currentBid: Number(startingBid),
        reservePrice: reservePrice ? Number(reservePrice) : undefined,
        auctionStart,
        auctionEnd,
        status: 'live',
        bidCount: 0,
      });

      res.status(201).json(newCar);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create car listing', error });
    }
  },
);

// ─── PATCH /api/cars/:id ──────────────────────────────────────────────────────
// Edit listing (only if no bids placed yet and user is owner/admin)
router.patch(
  '/:id',
  requireAuth,
  requireRole('seller', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const car = await Car.findById(req.params.id);
      if (!car) {
        res.status(404).json({ message: 'Car listing not found' });
        return;
      }

      // Check ownership or admin
      if (String(car.sellerId) !== req.user!.sub && req.user!.role !== 'admin') {
        res.status(403).json({ message: 'Not authorized to edit this listing' });
        return;
      }

      // Standard auction rule: cannot edit if bids have been placed
      if (car.bidCount > 0) {
        res.status(400).json({
          message: 'Cannot edit a listing after bids have been placed on it',
        });
        return;
      }

      const allowedFields = [
        'make',
        'model',
        'year',
        'condition',
        'bodyType',
        'mileage',
        'transmission',
        'fuelType',
        'color',
        'images',
        'description',
        'startingBid',
        'reservePrice',
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (car as any)[field] = req.body[field];
        }
      });

      if (req.body.startingBid) {
        car.currentBid = Number(req.body.startingBid);
      }

      await car.save();
      res.status(200).json(car);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update car listing', error });
    }
  },
);

// ─── DELETE /api/cars/:id ─────────────────────────────────────────────────────
// Delete/cancel listing (only if no bids placed yet and user is owner/admin)
router.delete(
  '/:id',
  requireAuth,
  requireRole('seller', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const car = await Car.findById(req.params.id);
      if (!car) {
        res.status(404).json({ message: 'Car listing not found' });
        return;
      }

      if (String(car.sellerId) !== req.user!.sub && req.user!.role !== 'admin') {
        res.status(403).json({ message: 'Not authorized to delete this listing' });
        return;
      }

      if (car.bidCount > 0) {
        res.status(400).json({
          message: 'Cannot cancel a listing after bids have been placed on it',
        });
        return;
      }

      await Car.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Listing cancelled successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete listing', error });
    }
  },
);

export default router;
