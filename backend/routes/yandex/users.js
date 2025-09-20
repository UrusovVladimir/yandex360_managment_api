// routes/yandex/users.js
const express = require('express');
const router = express.Router();
const YandexController = require('../../controllers/yandexController');
const auth = require('../../middleware/auth');

// Создаем экземпляр контроллера
const yandexController = new YandexController();

router.use(auth);


router.post('/:orgId/users/:userId/2fa/enable', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.enableUser2FA(req, res)
);

router.post('/:orgId/users/:userId/2fa/disable', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.disableUser2FA(req, res)
);

router.get('/:orgId/users/:userId/2fa', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.getUser2FAStatus(req, res)
);

// В файле routes/yandex.js или аналогичном
// routes/yandex/users.js
router.delete('/:orgId/users/:userId',
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.deleteUser(req, res)
);

module.exports = router;