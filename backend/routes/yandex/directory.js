const express = require('express');
const router = express.Router();
const YandexController = require('../../controllers/yandexController');
const auth = require('../../middleware/auth');

// Создаем экземпляр контроллера
const yandexController = new YandexController();

router.use(auth);

// Правильно привязываем методы к контексту
router.get('/:orgId/users', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.getAllUsers(req, res)
);

router.get('/:orgId/users/:userId', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.getUser(req, res)
);

router.post('/:orgId/users', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.createUser(req, res)
);

router.get('/:orgId/check-token', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.checkToken(req, res) // Исправлено!
);

// Добавляем endpoint для проверки прав
router.get('/:orgId/check-scopes', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.checkTokenScopes(req, res)
);

router.get('/:orgId/departments', 
  (req, res, next) => yandexController.getAccountByOrgId(req, res, next),
  (req, res) => yandexController.getDepartments(req, res)
);


module.exports = router;