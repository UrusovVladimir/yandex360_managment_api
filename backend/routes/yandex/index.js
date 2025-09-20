const express = require('express');
const router = express.Router();

// Импортируем все роуты
const securityRoutes = require('./security');
const directoryRoutes = require('./directory');
const userRoutes = require('./users');
const adminRoutes = require('./admin')

// Комбинируем роуты с префиксами
router.use('/security', securityRoutes);
router.use('/directory', directoryRoutes);
router.use('/directory', userRoutes);
router.use('/admin',adminRoutes)


module.exports = router;