const bcrypt = require('bcrypt');

async function testPassword() {
  const plainPassword = '6bAR!s@8';
  const storedHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  
  console.log('Пароль:', plainPassword);
  console.log('Хеш в базе:', storedHash);
  
  const isValid = await bcrypt.compare(plainPassword, storedHash);
  console.log('Пароль верный:', isValid);
  
  // Генерируем новый хеш для проверки
  const newHash = await bcrypt.hash(plainPassword, 10);
  console.log('Новый хеш:', newHash);
  
  const isValidNew = await bcrypt.compare(plainPassword, newHash);
  console.log('Новый хеш работает:', isValidNew);
}

testPassword();