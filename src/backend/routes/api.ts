import express from 'express';
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sales Routes
router.get('/sales', (req, res) => {
  // Logic to fetch sales (could be proxied to Firestore or custom logic)
  res.json({ message: 'Sales data' });
});

// Inventory Routes
router.get('/inventory', (req, res) => {
  res.json({ message: 'Inventory data' });
});

// Customer Routes
router.get('/customers', (req, res) => {
  res.json({ message: 'Customer data' });
});

export default router;
