const router = require('express').Router();
const {
  getStats, listUsers, getUserDetails, updateUserStatus, deleteUser, promoteUser, manualVerifyUser,
  listPendingDocuments, getDocumentVerification, updateDocumentStatus, reprocessDocument,
  listReservations, updateReservationStatus, resetDatabase,
} = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

router.get('/stats', getStats);

router.get('/users', listUsers);
router.get('/users/:id', getUserDetails);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/verify', manualVerifyUser);
router.patch('/users/:id/role', promoteUser);
router.delete('/users/:id', deleteUser);

router.get('/documents/pending',             listPendingDocuments);
router.get('/documents/:id/verification',   getDocumentVerification);
router.patch('/documents/:id/status',        updateDocumentStatus);
router.post('/documents/:id/reprocess',      reprocessDocument);

router.get('/reservations', listReservations);
router.patch('/reservations/:id/status', updateReservationStatus);

router.post('/dev/reset-db', resetDatabase);

module.exports = router;
