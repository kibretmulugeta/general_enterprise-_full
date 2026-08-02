const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const profileController = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth.middleware');
const { updateProfileValidation, changePasswordValidation } = require('../validators/auth.validator');

const router = express.Router();

// Setup Multer Storage for Avatars
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif|webp/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed.'));
  }
});

router.use(protect);

router.put('/', updateProfileValidation, (req, res, next) => profileController.updateProfile(req, res, next));
router.post('/avatar', upload.single('avatar'), (req, res, next) => profileController.uploadAvatar(req, res, next));
router.post('/change-password', changePasswordValidation, (req, res, next) => profileController.changePassword(req, res, next));

// 2FA Management
router.get('/mfa/setup', (req, res, next) => profileController.setup2FA(req, res, next));
router.post('/mfa/enable', (req, res, next) => profileController.enable2FA(req, res, next));
router.post('/mfa/disable', (req, res, next) => profileController.disable2FA(req, res, next));

// Connected Accounts
router.get('/connected-accounts', (req, res, next) => profileController.getConnectedAccounts(req, res, next));

module.exports = router;
