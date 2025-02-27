const bcrypt = require('bcryptjs');

const password = 'Duju1593!';
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log(hash); // Copia este valor
});