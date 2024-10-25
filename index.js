const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());

const userAuth = require('./routes/userAuth');
const crud = require('./routes/crud');

app.use('/api', userAuth);
app.use('/api', crud);

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/confirm/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirm.html'));
});

app.get('/reset-password/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});


const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});