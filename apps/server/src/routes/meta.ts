import { Router, Request, Response, IRouter } from 'express';
import { BRAND_MODELS } from '../data/brandModels';

const router: IRouter = Router();

// GET /api/meta/brands — returns array of available brand names
router.get('/brands', (_req: Request, res: Response): void => {
  const brands = Object.keys(BRAND_MODELS).sort();
  res.status(200).json(brands);
});

// GET /api/meta/models?brand=BMW — returns models for a given brand
router.get('/models', (req: Request, res: Response): void => {
  const brand = req.query.brand as string | undefined;

  if (!brand) {
    res.status(400).json({ message: 'Query parameter "brand" is required' });
    return;
  }

  // Case-insensitive lookup match
  const matchedKey = Object.keys(BRAND_MODELS).find(
    (k) => k.toLowerCase() === brand.toLowerCase(),
  );

  if (!matchedKey) {
    res.status(200).json([]);
    return;
  }

  res.status(200).json(BRAND_MODELS[matchedKey]);
});

export default router;
