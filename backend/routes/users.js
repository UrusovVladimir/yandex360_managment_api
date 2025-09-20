// // routes/users.js
// const express = require('express');
// const router = express.Router();
// const db = require('../config/database');
// const auth = require('../middleware/auth');
// const bcrypt = require('bcrypt');

// // GET /api/users - Получить всех локальных пользователей
// router.get('/', auth, async (req, res) => {
//   try {
//     const result = await db.query(
//       'SELECT id, username, email, created_at, role, is_admin FROM users ORDER BY created_at DESC'
//     );
    
//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // GET /api/users/:id - Получить пользователя по ID
// router.get('/:id', auth, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const result = await db.query(
//       'SELECT id, username, email, created_at, role, is_admin FROM users WHERE id = $1',
//       [id]
//     );
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('Error fetching user:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // POST /api/users - Создать пользователя
// router.post('/', auth, async (req, res) => {
//   try {
//     const { username, email, password, role = 'user' } = req.body;
    
//     // Проверка существующего пользователя
//     const existingUser = await db.query(
//       'SELECT id FROM users WHERE username = $1 OR email = $2',
//       [username, email]
//     );
    
//     if (existingUser.rows.length > 0) {
//       return res.status(400).json({ error: 'User already exists' });
//     }
    
//     // Хеширование пароля
//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);
    
//     // Устанавливаем is_admin на основе роли
//     const is_admin = role === 'admin';
    
//     const result = await db.query(
//       'INSERT INTO users (username, email, password, role, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, created_at, role, is_admin',
//       [username, email, hashedPassword, role, is_admin]
//     );
    
//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error('Error creating user:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });
// // PUT /api/users/:id - Обновить пользователя
// router.put('/:id', auth, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { username, email, password, role } = req.body;
    
//     // Устанавливаем is_admin на основе роли
//     const is_admin = role === 'admin';
    
//     let queryText;
//     let queryParams;
    
//     if (password) {
//       // Если передан пароль - хешируем его
//       const saltRounds = 10;
//       const hashedPassword = await bcrypt.hash(password, saltRounds);
      
//       queryText = 'UPDATE users SET username = $1, email = $2, password = $3, role = $4, is_admin = $5 WHERE id = $6 RETURNING id, username, email, created_at, role, is_admin';
//       queryParams = [username, email, hashedPassword, role, is_admin, id];
//     } else {
//       queryText = 'UPDATE users SET username = $1, email = $2, role = $3, is_admin = $4 WHERE id = $5 RETURNING id, username, email, created_at, role, is_admin';
//       queryParams = [username, email, role, is_admin, id];
//     }
    
//     const result = await db.query(queryText, queryParams);
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('Error updating user:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // DELETE /api/users/:id - Удалить пользователя
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // Проверяем, пытается ли пользователь удалить самого себя
//     if (parseInt(id) === req.user.id) {
//       return res.status(400).json({ error: 'Нельзя удалить свою собственную учетную запись' });
//     }
    
//     // Проверяем, является ли удаляемый пользователь администратором
//     const userToDelete = await db.query(
//       'SELECT is_admin FROM users WHERE id = $1',
//       [id]
//     );
    
//     if (userToDelete.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     // Не позволяем удалять администраторов (опционально)
//     if (userToDelete.rows[0].is_admin) {
//       return res.status(400).json({ error: 'Нельзя удалить учетную запись администратора' });
//     }
    
//     const result = await db.query(
//       'DELETE FROM users WHERE id = $1 RETURNING id',
//       [id]
//     );
    
//     res.json({ message: 'User deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting user:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// module.exports = router;

// routes/users.js
// routes/users.js
// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Импортируем socket handlers
let socketHandlers;
try {
  socketHandlers = require('../sockets/socketHandlers');
} catch (error) {
  console.warn('Socket handlers not available');
}

// GET /api/users - Получить всех локальных пользователей
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, created_at, role, is_admin FROM users ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id - Получить пользователя по ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id, username, email, created_at, role, is_admin FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users - Создать пользователя
router.post('/', auth, async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    
    // Проверка существующего пользователя
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Хеширование пароля
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const is_admin = role === 'admin';
    
    const result = await db.query(
      'INSERT INTO users (username, email, password, role, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, created_at, role, is_admin',
      [username, email, hashedPassword, role, is_admin]
    );
    
    const newUser = result.rows[0];
    
    // Отправляем socket событие если handlers доступны
    if (socketHandlers) {
      const io = req.app.get('io');
      if (io) {
        socketHandlers(io).handleUserCreated(newUser);
      }
    }
    
    res.status(201).json(newUser);
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id - Обновить пользователя
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;
    
    const is_admin = role === 'admin';
    
    let queryText;
    let queryParams;
    
    if (password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      queryText = 'UPDATE users SET username = $1, email = $2, password = $3, role = $4, is_admin = $5 WHERE id = $6 RETURNING id, username, email, created_at, role, is_admin';
      queryParams = [username, email, hashedPassword, role, is_admin, id];
    } else {
      queryText = 'UPDATE users SET username = $1, email = $2, role = $3, is_admin = $4 WHERE id = $5 RETURNING id, username, email, created_at, role, is_admin';
      queryParams = [username, email, role, is_admin, id];
    }
    
    const result = await db.query(queryText, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = result.rows[0];
    
    // Отправляем socket событие
    if (socketHandlers) {
      const io = req.app.get('io');
      if (io) {
        socketHandlers(io).handleUserUpdated(updatedUser);
      }
    }
    
    res.json(updatedUser);
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id - Удалить пользователя
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Нельзя удалить свою собственную учетную запись' });
    }
    
    const userToDelete = await db.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [id]
    );
    
    if (userToDelete.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (userToDelete.rows[0].is_admin) {
      return res.status(400).json({ error: 'Нельзя удалить учетную запись администратора' });
    }
    
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    
    // Отправляем socket событие
    if (socketHandlers) {
      const io = req.app.get('io');
      if (io) {
        socketHandlers(io).handleUserDeleted(id);
      }
    }
    
    res.json({ message: 'User deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;