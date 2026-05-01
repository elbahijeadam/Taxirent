const router = require('express').Router();
const { listCars, getCar, getCarAvailability, createCar, updateCar } = require('../controllers/carController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', listCars);
router.get('/:id', getCar);
router.get('/:id/availability', getCarAvailability);
router.post('/', authenticate, requireAdmin, createCar);
router.put('/:id', authenticate, requireAdmin, updateCar);

module.exports = router;
