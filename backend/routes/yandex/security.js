// routes/yandex/security.js
const express = require('express');
const router = express.Router();
const YandexController = require('../../controllers/yandexController');
const auth = require('../../middleware/auth');

const yandexController = new YandexController();

router.use(auth);

// ==================== 2FA НАСТРОЙКИ ====================
// Добавьте этот маршрут
router.get('/:orgId/2fa', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.get2FAStatus(req, res)
);

// PUT маршрут (должен быть!)
router.put('/:orgId/2fa', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.update2FAStatus(req, res) // ← этот метод должен существовать
);

// ==================== ОБЩИЕ НАСТРОЙКИ БЕЗОПАСНОСТИ ====================
router.get('/:orgId/settings', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.getSecuritySettings(req, res)
);

router.put('/:orgId/settings', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.updateSecuritySettings(req, res)
);
router.post('/:orgId/bulk-check/2fa', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next), 
  (req, res) => yandexController.bulkCheck2FA(req, res)
);
module.exports = router;