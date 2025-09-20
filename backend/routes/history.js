const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const auth = require('../middleware/auth');

router.use(auth);

// Сначала специфичные роуты, потом общие
router.post('/save', historyController.saveRequest);    // → /api/history/save
router.get('/:account_id/stats', historyController.getStats);
router.get('/:account_id', historyController.getHistory);        
router.delete('/clear/:account_id', historyController.clearHistory);

module.exports = router;