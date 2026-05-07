const router = require('express').Router();
const { register, login, verifyEmail, verifyPhone, resendOtp, getMe, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);

router.post('/verify-email',    authenticate, verifyEmail);
router.post('/verify-phone',    authenticate, verifyPhone);
router.post('/resend-otp',      authenticate, resendOtp);
router.put('/change-password',  authenticate, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

module.exports = router;
