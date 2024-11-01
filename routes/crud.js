const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const conn = require(('../connect'))
require('dotenv').config();

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) {
      return res.sendStatus(401);
    }
  
    jwt.verify(token, process.env.AUTH_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  }

  router.get('/protected', authenticateToken, (req, res) => {
    res.json(req.user);
  });

  router.post('/cadastro-bebidas', authenticateToken, async (req, res) => {
    const { user_id, nome, tipo, quantidade_caixas, unidades_por_caixa, valor_gasto_por_caixa, valor_venda_por_unidade } = req.body;
    const total_unidades = quantidade_caixas * unidades_por_caixa;
    const custo_por_unidade = valor_gasto_por_caixa / unidades_por_caixa;

    try{
      const nome_bebida = await conn`SELECT * FROM bebidas WHERE nome = ${nome}`;

      if (nome_bebida.length === 0){
        await conn`INSERT INTO bebidas (
          user_id, nome, tipo, custo_por_unidade, valor_venda_por_unidade, total_unidades
          ) VALUES (
          ${user_id}, ${nome}, ${tipo}, ${custo_por_unidade}, ${valor_venda_por_unidade}, ${total_unidades} )`;

        res.status(201).json({ message: 'Produto cadastrado com sucesso' });
      } else{
        res.status(201).json({ message: 'Bebida já esta cadastrada, altere dados do estoque ou cadastre outro nome de bebida.' });
      }
    }catch(error){
      console.error('Erro ao cadastrar bebida:', error);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    }
  })

  router.post('/estoque', authenticateToken, async (req,res) =>{
    const {user_id} = req.body;
    try{
      const response = await conn`SELECT * FROM bebidas WHERE user_id = ${user_id} ORDER BY nome ASC`;
      res.json(response);
    }catch(error){
      console.error('Erro ao pesquisar bebidas:', error);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    }
  })

  router.post('/estoque-id', authenticateToken, async(req, res) => {
    const { id } = req.body;
    try{
      const response = await conn`SELECT * FROM bebidas WHERE id = ${id}`;
      res.json(response);
    }catch(error){
      console.error('Erro ao pesquisar bebida:', error);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    }
  })

  router.post('/alterar-estoque',authenticateToken, async(req,res) => {
    const { id, quantidade_caixas, unidades_por_caixa, valor_gasto_por_caixa, valor_venda_por_unidade } =req.body;
    const total_unidades = quantidade_caixas * unidades_por_caixa;
    const custo_por_unidade = valor_gasto_por_caixa / unidades_por_caixa;
    try {
      await conn`UPDATE bebidas
                  SET custo_por_unidade = ${custo_por_unidade},
                  total_unidades = total_unidades + ${total_unidades},
                  valor_venda_por_unidade = ${valor_venda_por_unidade}
                  WHERE id = ${id}`;
      res.status(200).json({ message: 'Estoque atualizado com sucesso' });
    }catch(error){
      console.error('Erro ao alterar dados do estoque:', error);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    }
  })

  router.post('/excluir-bebida', authenticateToken, async(req,res) => {
    const { id } =req.body;
    try{
      await conn`DELETE FROM bebidas WHERE id = ${id}`;
      res.status(200).json({ message: 'Produto excluído com sucesso' });
    }catch(error){
      console.error('Erro ao alterar dados do estoque:', error);
      res.status(500).json({ error: 'Erro ao processar a solicitação' });
    }
  })

  module.exports = router;
