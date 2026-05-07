const router = require('express').Router();
const {
  createReservation, getReservation, getContract, cancelReservation, listReservations,
  getSwiklyDepositUrl, confirmDepositAuthorization,
} = require('../controllers/reservationController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, createReservation);
router.get('/:id', authenticate, getReservation);
router.get('/:id/contract', authenticate, getContract);
router.get('/:id/deposit-url', authenticate, getSwiklyDepositUrl);
router.post('/:id/deposit-confirm', authenticate, confirmDepositAuthorization);
router.patch('/:id/cancel', authenticate, cancelReservation);
router.get('/', authenticate, requireAdmin, listReservations);

module.exports = router;
