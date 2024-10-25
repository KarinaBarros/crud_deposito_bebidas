const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const app = express();
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const conn = require(('../connect'))

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // limite de 10 requisições
  message: 'Limite de requisições excedido, por favor, tente novamente mais tarde.'
})

app.use((err, req, res, next) => {
  if (err instanceof rateLimit.RateLimitError) {
    res.status(429).send('Limite de requisições excedido, por favor, tente novamente mais tarde, se esqueceu sua senha altere a senha ou faça um novo cadastro.');
  } else {
    next(err);
  }
})

function removeRateLimit(req, res, next) {
  // Removendo o limite de taxa para a rota /trocar-senha
  limiter.resetKey(req.ip);
  next();
}

// Configuração do serviço de e-mail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Rota para cadastrar um novo usuário
router.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    const existingUsers = await conn`SELECT * FROM users WHERE email = ${email}`;

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Este email já está em uso' });
    }

    const tokenData = { nome, email, senha };
    const token = jwt.sign(tokenData, process.env.EMAIL_CONFIRMATION_TOKEN_SECRET, { expiresIn: '10m' });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Confirme seu registro',
      text: `Por favor, clique no link a seguir para confirmar seu registro: ${process.env.FRONT_LOCATION}/confirm/${token}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Por favor, verifique seu e-mail para confirmar o registro' });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
});

// Rota para confirmar o registro
router.post('/confirm',  async (req, res) => {
  const { token } = req.body; 

  if (!token) {
    return res.status(400).json({ error: 'Token de confirmação ausente' });
  }

  try {
    const decoded = jwt.verify(token, process.env.EMAIL_CONFIRMATION_TOKEN_SECRET);
    const { nome, senha, email } = decoded; 
    
    const hashedPassword = await bcrypt.hash(senha, 10);
  
    await conn`INSERT INTO users (nome, email, senha) VALUES (${nome}, ${email}, ${hashedPassword})`;
    
    
    removeRateLimit(req, res, () => {});
    res.status(201).json({ message: 'Registro confirmado com sucesso' });
  } catch (error) {
    console.error('Erro ao confirmar registro:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
});




// Rota para autenticar o usuário
router.post('/login',limiter, async (req, res) => {
    const { email, senha } = req.body;

    try {   
        const user = await conn`SELECT * FROM users WHERE email = ${email}`;

        if (!user) {
            console.log('Usuário não encontrado');
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const passwordMatch = await bcrypt.compare(senha, user[0].senha);

        if (!passwordMatch) {
            console.log('Credenciais inválidas');
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign({ userId: user[0].id }, process.env.AUTH_TOKEN_SECRET, { expiresIn: '1d' });
        removeRateLimit(req, res, () => {});
        res.json({ 
          token: token,
          nome: user[0].nome
        });
    } catch (error) {
        console.error('Erro ao autenticar usuário:', error);
        res.status(500).json({ error: 'Erro ao processar a solicitação' });
    }

    
});

// Rota para solicitar troca de senha 
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {    
    const user = await conn`SELECT * FROM users WHERE email = ${email}`;

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const tokenData = { userId: user[0].id };
    const token = jwt.sign(tokenData, process.env.EMAIL_CONFIRMATION_TOKEN_SECRET, { expiresIn: '10m' });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Troca de senha',
      text: `Clique no link a seguir para redefinir sua senha: ${process.env.FRONT_LOCATION}/reset-password/${token}`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Um e-mail foi enviado com instruções para redefinir sua senha' });
  } catch (error) {
    console.error('Erro ao solicitar troca de senha:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
});

// Rota para confirmar troca de senha
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token de redefinição de senha ou nova senha ausente' });
  }

  try {
    const decoded = jwt.verify(token, process.env.EMAIL_CONFIRMATION_TOKEN_SECRET);
    const { userId } = decoded;
  
    const hashedPassword = await bcrypt.hash(newPassword, 10);
      
    await conn`UPDATE users SET senha = ${hashedPassword} WHERE id = ${userId}`;
    removeRateLimit(req, res, () => {});
    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
  
});


module.exports = router;