const express = require('express');
const auditController = require('../controllers/audit.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', (req, res, next) => auditController.getAuditLogs(req, res, next));

module.exports = router;
