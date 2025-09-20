// module.exports = (io) => {
//   io.on('connection', (socket) => {
//     console.log('User connected:', socket.id);

//     // Слушаем события от клиентов
//     socket.on('user_updated', (user) => {
//       io.emit('user_updated', user);
//     });

//     socket.on('user_created', (user) => {
//       io.emit('user_created', user);
//     });

//     socket.on('user_deleted', (userId) => {
//       io.emit('user_deleted', userId);
//     });

//     socket.on('disconnect', () => {
//       console.log('User disconnected:', socket.id);
//     });

//     socket.on('account_created', (account) => {
//       io.emit('account_created', account);
//     });

//     socket.on('account_updated', (account) => {
//       io.emit('account_updated', account);
//     });

//     socket.on('account_deleted', (accountId) => {
//       io.emit('account_deleted', accountId);
//     });
//   });
// };


const socketHandlers = require('./socketHandlers');

module.exports = (io) => {
  const { initializeSocketHandlers } = socketHandlers(io);
  initializeSocketHandlers();
};