const router = require('express').Router();
const { updateProfile, uploadDocument, getDocuments, getUserReservations } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { upload, handleUploadError, verifyFileIntegrity } = require('../middleware/upload');

router.put('/profile', authenticate, updateProfile);
router.post('/documents', authenticate, upload.single('file'), handleUploadError, verifyFileIntegrity, uploadDocument);
router.get('/documents', authenticate, getDocuments);
router.get('/reservations', authenticate, getUserReservations);

module.exports = router;
