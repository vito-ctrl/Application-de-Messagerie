require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur lancé sur http://192.168.1.5:${PORT}`);
});
  })
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err.message);
  });
