const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Получить все аккаунты
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM accounts ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать аккаунт
router.post('/', auth, async (req, res) => {
  try {
    const { organization_name, organization_id, token } = req.body;

    const result = await db.query(
      'INSERT INTO accounts (organization_name, organization_id, token) VALUES ($1, $2, $3) RETURNING *',
      [organization_name, organization_id, token]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить аккаунт
router.put('/:id', auth, async (req, res) => {
  try {
    const { organization_name, organization_id, token } = req.body;

    const result = await db.query(
      'UPDATE accounts SET organization_name = $1, organization_id = $2, token = $3 WHERE id = $4 RETURNING *',
      [organization_name, organization_id, token, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Аккаунт не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить аккаунт
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM accounts WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Аккаунт не найден' });
    }

    res.json({ message: 'Аккаунт удален успешно' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;