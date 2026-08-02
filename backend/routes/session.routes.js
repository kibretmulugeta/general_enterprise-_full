const express = require('express');
const sessionController = require('../controllers/session.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', (req, res, next) => sessionController.getSessions(req, res, next));
router.delete('/:id', (req, res, next) => sessionController.revokeSession(req, res, next));
router.delete('/', (req, res, next) => sessionController.revokeAllSessions(req, res, next));

module.exports = router;
