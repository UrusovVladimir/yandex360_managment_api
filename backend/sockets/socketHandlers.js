// server/socketHandlers.js
const db = require('../config/database');

module.exports = (io) => {
  
  // Обработчик создания пользователя
  const handleUserCreated = (user) => {
    console.log('📨 User created event:', user);
    io.emit('user_created', user);
  };

  // Обработчик обновления пользователя
  const handleUserUpdated = (user) => {
    console.log('📨 User updated event:', user);
    io.emit('user_updated', user);
  };

  // Обработчик удаления пользователя
  const handleUserDeleted = (userId) => {
    console.log('📨 User deleted event:', userId);
    io.emit('user_deleted', userId);
  };

  // Обработчик создания аккаунта
  const handleAccountCreated = (account) => {
    console.log('📨 Account created event:', account);
    io.emit('account_created', account);
  };

  // Обработчик обновления аккаунта
  const handleAccountUpdated = (account) => {
    console.log('📨 Account updated event:', account);
    io.emit('account_updated', account);
  };

  // Обработчик удаления аккаунта
  const handleAccountDeleted = (accountId) => {
    console.log('📨 Account deleted event:', accountId);
    io.emit('account_deleted', accountId);
  };

  // Обработчик системных событий
  const handleSystemEvent = (data) => {
    console.log('📨 System event:', data);
    io.emit('system_event', data);
  };

  // Функция для отправки уведомлений
  const sendNotification = (userId, message) => {
    io.to(`user_${userId}`).emit('notification', {
      message,
      timestamp: new Date().toISOString()
    });
  };

  // Основная функция инициализации обработчиков
  const initializeSocketHandlers = () => {
    io.on('connection', (socket) => {
      console.log('✅ User connected:', socket.id);

      // Присоединяем пользователя к его комнате
      socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`👥 User ${userId} joined their room`);
      });

      // Обработчики пользователей
      socket.on('user_created', handleUserCreated);
      socket.on('user_updated', handleUserUpdated);
      socket.on('user_deleted', handleUserDeleted);

      // Обработчики аккаунтов
      socket.on('account_created', handleAccountCreated);
      socket.on('account_updated', handleAccountUpdated);
      socket.on('account_deleted', handleAccountDeleted);

      // Системные события
      socket.on('system_event', handleSystemEvent);

      // Обработка отключения
      socket.on('disconnect', (reason) => {
        console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
      });

      // Обработка ошибок
      socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });
    });

    console.log('✅ Socket handlers initialized');
  };

  return {
    initializeSocketHandlers,
    handleUserCreated,
    handleUserUpdated,
    handleUserDeleted,
    handleAccountCreated,
    handleAccountUpdated,
    handleAccountDeleted,
    handleSystemEvent,
    sendNotification
  };
};