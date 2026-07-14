const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadReport, getReports, deleteReport } = require('../controllers/medicalReportController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', protect, upload.single('file'), uploadReport);
router.get('/', protect, getReports);
router.delete('/:id', protect, deleteReport);

module.exports = router;
