import { io } from 'socket.io-client'
import { useUsersStore } from './stores/users'
import { useAccountsStore } from './stores/accounts'

// Универсальный способ - используем текущий origin для WebSocket
const getWebSocketUrl = () => {
  // Если задана переменная окружения - используем её
  if (import.meta.env.VITE_WEBSOCKET_URL) {
    return import.meta.env.VITE_WEBSOCKET_URL
  }
  
  // Иначе определяем автоматически на основе текущего URL
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.hostname
  const port = import.meta.env.DEV ? ':5050' : ''
  
  return `${protocol}//${host}${port}`
}

const socketUrl = getWebSocketUrl()

export const socket = io(socketUrl, {
  autoConnect: false,
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  // Secure определяется автоматически
  secure: socketUrl.startsWith('wss://'),
  // В development отключаем проверку сертификатов
  rejectUnauthorized: import.meta.env.DEV ? false : true
})

// Debug информация
console.log('Socket connection configured:', {
  url: socketUrl,
  secure: socketUrl.startsWith('wss://'),
  environment: import.meta.env.MODE,
  devMode: import.meta.env.DEV,
  prodMode: import.meta.env.PROD
})

// Socket event listeners
socket.on('user_updated', (user) => {
  console.log('User updated via socket:', user)
  const usersStore = useUsersStore()
  usersStore.updateUser(user)
})

socket.on('user_created', (user) => {
  console.log('New user created via socket:', user)
  const usersStore = useUsersStore()
  usersStore.addUser(user)
})

socket.on('user_deleted', (userId) => {
  console.log('User deleted via socket:', userId)
  const usersStore = useUsersStore()
  usersStore.removeUser(userId)
})

socket.on('account_created', (account) => {
  console.log('New account created via socket:', account)
  const accountsStore = useAccountsStore()
  accountsStore.addAccount(account)
})

socket.on('account_deleted', (accountId) => {
  console.log('Account deleted via socket:', accountId)
  const accountsStore = useAccountsStore()
  accountsStore.removeAccount(accountId)
})

socket.on('new_client', (client) => {
  console.log('New client via socket:', client)
})

socket.on('connect', () => {
  console.log('Connected to server via socket')
})

socket.on('disconnect', () => {
  console.log('Disconnected from server')
})

// Composition API функция для использования сокета
export const useSocket = () => {
  const connect = () => {
    if (!socket.connected) {
      socket.connect()
    }
  }

  const disconnect = () => {
    if (socket.connected) {
      socket.disconnect()
    }
  }

  return {
    socket,
    connect,
    disconnect,
    connected: socket.connected
  }
}