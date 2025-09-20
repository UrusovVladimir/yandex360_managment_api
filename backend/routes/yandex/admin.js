// routes/yandex/admin.js
const express = require('express');
const router = express.Router();
const YandexController = require('../../controllers/yandexController');
const auth = require('../../middleware/auth');

const yandexController = new YandexController();

router.use(auth);

// ==================== ДОМЕННЫЕ ПОЛИТИКИ ====================
router.get('/:orgId/mail/routing/policies', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.getDomainPolicies(req, res)
);

router.put('/:orgId/mail/routing/policies', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.updateDomainPolicies(req, res)
);

// Специализированные endpoints для доменных списков
router.get('/:orgId/mail/routing/policies/whitelist', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.getWhitelistDomains(req, res)
);

router.get('/:orgId/mail/routing/policies/blacklist', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.getBlacklistDomains(req, res)
);

// ==================== ПРОВЕРКА API ====================
router.get('/:orgId/check-mail-api', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.checkMailRoutingApi(req, res)
);

router.get('/:orgId/mail/routing/debug', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.debugMailRouting(req, res)
);
module.exports = router;