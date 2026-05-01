const router = require('express').Router();
const {
  createReservation, getReservation, getContract, cancelReservation, listReservations,
} = require('../controllers/reservationController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, createReservation);
router.get('/:id', authenticate, getReservation);
router.get('/:id/contract', authenticate, getContract);
router.patch('/:id/cancel', authenticate, cancelReservation);
router.get('/', authenticate, requireAdmin, listReservations);

module.exports = router;
