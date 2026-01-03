const express = require('express');
const router = express.Router();
const { exportCSV, getExportSummary } = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/csv', protect, exportCSV);
router.get('/summary', protect, getExportSummary);

module.exports = router;

