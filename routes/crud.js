const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const conn = require(('../connect'))
require('dotenv').config();
const bcrypt = require('bcrypt');

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

  try {
    const nome_bebida = await conn`SELECT * FROM bebidas WHERE nome = ${nome}`;

    if (nome_bebida.length === 0) {
      await conn`INSERT INTO bebidas (
          user_id, nome, tipo, custo_por_unidade, valor_venda_por_unidade, total_unidades
          ) VALUES (
          ${user_id}, ${nome}, ${tipo}, ${custo_por_unidade}, ${valor_venda_por_unidade}, ${total_unidades} )`;

      res.status(201).json({ message: 'Produto cadastrado com sucesso' });
    } else {
      res.status(201).json({ message: 'Bebida já esta cadastrada, altere dados do estoque ou cadastre outro nome de bebida.' });
    }
  } catch (error) {
    console.error('Erro ao cadastrar bebida:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/estoque', authenticateToken, async (req, res) => {
  const { user_id } = req.body;
  try {
    const response = await conn`SELECT * FROM bebidas WHERE user_id = ${user_id} ORDER BY nome ASC`;
    res.json(response);
  } catch (error) {
    console.error('Erro ao pesquisar bebidas:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/estoque-id', authenticateToken, async (req, res) => {
  const { id } = req.body;
  try {
    const response = await conn`SELECT * FROM bebidas WHERE id = ${id}`;
    res.json(response);
  } catch (error) {
    console.error('Erro ao pesquisar bebida:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/alterar-estoque', authenticateToken, async (req, res) => {
  const { id, quantidade_caixas, unidades_por_caixa, valor_gasto_por_caixa, valor_venda_por_unidade } = req.body;
  const total_unidades = quantidade_caixas * unidades_por_caixa;
  const custo_por_unidade = valor_gasto_por_caixa / unidades_por_caixa;
  try {
    await conn`UPDATE bebidas
                  SET custo_por_unidade = ${custo_por_unidade},
                  total_unidades = total_unidades + ${total_unidades},
                  valor_venda_por_unidade = ${valor_venda_por_unidade}
                  WHERE id = ${id}`;
    res.status(200).json({ message: 'Estoque atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar dados do estoque:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/excluir-bebida', authenticateToken, async (req, res) => {
  const { id } = req.body;
  try {
    await conn`DELETE FROM bebidas WHERE id = ${id}`;
    res.status(200).json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar dados do estoque:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/clientes-pendente', authenticateToken, async (req, res) => {
  const { user_id } = req.body;

  try {
    const response = await conn`SELECT * FROM vendas WHERE user_id = ${user_id} AND status = 'pendente'`;
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/vendas', authenticateToken, async (req, res) => {
  const { user_id, nome_cliente, lista } = req.body;
  console.log(lista);
  try {
    const nomeExistente = await conn`SELECT * FROM vendas WHERE nome_cliente = ${nome_cliente} AND status = 'pendente' AND user_id = ${user_id}`;
    for (let item of lista) {
      const bebida_id = item.bebida_id;
      const quantidade = item.quantidade;
      if (nomeExistente.length > 0) {
        const venda_id = nomeExistente[0].id;
        await conn.begin(async (transaction) => {
          await transaction`INSERT INTO vendas_bebidas (venda_id, bebida_id, quantidade) VALUES (${venda_id}, ${bebida_id}, ${quantidade})`;
          await transaction`UPDATE bebidas SET total_unidades = total_unidades - ${quantidade} WHERE id = ${bebida_id}`;
        })
      } else {
        await conn.begin(async (transaction) => {
          const response = await transaction`INSERT INTO vendas (user_id, nome_cliente) VALUES (${user_id}, ${nome_cliente}) RETURNING id`;
          const venda_id = response[0].id;
          await transaction`INSERT INTO vendas_bebidas (venda_id, bebida_id, quantidade) VALUES (${venda_id}, ${bebida_id}, ${quantidade})`;
          await transaction`UPDATE bebidas SET total_unidades = total_unidades - ${quantidade} WHERE id = ${bebida_id}`;
        })
      }
    }
    res.status(200).json({ message: 'Venda concluída!' });
  } catch (error) {
    console.error('Erro ao inserir venda:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
});


router.post('/busca_cliente', authenticateToken, async (req, res) => {
  const { venda_id } = req.body;

  try {
    const response = await conn`SELECT vb.*, b.*, vb.quantidade
                                  FROM vendas_bebidas vb
                                  INNER JOIN bebidas b ON vb.bebida_id = b.id
                                  INNER JOIN vendas v ON vb.venda_id = v.id
                                  WHERE v.nome_cliente = ${venda_id}`;
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/concluir_venda', authenticateToken, async (req, res) => {
  const { id, forma_pagto } = req.body;
  try {
    await conn.begin(async (transaction) => {
      await transaction`UPDATE vendas SET forma_pagto = ${forma_pagto}, status = 'efetuado' WHERE id = ${id}`;
      const response = await transaction`SELECT vb.*, b.*, vb.quantidade
                                  FROM vendas_bebidas vb
                                  INNER JOIN bebidas b ON vb.bebida_id = b.id
                                  WHERE vb.venda_id = ${id}`;
      console.log(response);
      let total = 0;
      let lucro = 0;
      response.forEach(item => {
        total += (item.valor_venda_por_unidade * item.quantidade);
        lucro += ((item.valor_venda_por_unidade - item.custo_por_unidade) * item.quantidade);
      });
      if (forma_pagto === 'dinheiro') {
        await transaction`UPDATE caixa SET dinheiro = dinheiro + ${total}, lucro = lucro + ${lucro}`;
      }
      if (forma_pagto === 'pix') {
        await transaction`UPDATE caixa SET pix = pix + ${total}, lucro = lucro + ${lucro}`;
      }
      if (forma_pagto === 'debito') {
        await transaction`UPDATE caixa SET debito = debito + ${total}, lucro = lucro + ${lucro}`;
      }
      if (forma_pagto === 'credito') {
        await transaction`UPDATE caixa SET credito = credito + ${total}, lucro = lucro + ${lucro}`;
      }
    })
    res.status(200).json({ message: 'Pagamento efetuado!' });
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/todos-clientes', authenticateToken, async (req, res) => {
  const { user_id } = req.body;

  try {
    const response = await conn`SELECT 
                                  v.nome_cliente,
                                  v.status,
                                  SUM(b.valor_venda_por_unidade * vb.quantidade) AS valor_total_venda
                                  FROM 
                                  vendas v
                                  JOIN 
                                  vendas_bebidas vb ON v.id = vb.venda_id
                                  JOIN 
                                  bebidas b ON vb.bebida_id = b.id
                                  WHERE 
                                  v.user_id = ${user_id}
                                  GROUP BY 
                                  v.nome_cliente, v.status;`;
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/status-caixa', authenticateToken, async (req, res) => {
  const { user_id } = req.body;

  try {
    const caixa = await conn`SELECT * FROM caixa WHERE user_id = ${user_id} AND status = 'aberto'`;
    if (caixa.length > 0) {
      res.status(200).json({ message: 'aberto' });
    } else {
      res.status(200).json({ message: 'fechado' });
    }
  } catch (error) {
    console.error('Erro ao abrir o caixa:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/abrir-caixa', authenticateToken, async (req, res) => {
  const { user_id, nome_operador, dinheiro, senha } = req.body;
  try {
    const user = await conn`SELECT * FROM users WHERE id = ${user_id}`;
    const passwordMatch = await bcrypt.compare(senha, user[0].senha);
    if(!passwordMatch){
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const response = await conn`INSERT INTO caixa (user_id, nome_operador, dinheiro, status) VALUES (${user_id}, ${nome_operador}, ${dinheiro}, 'aberto') RETURNING id`;
    res.status(200).json({ message: 'Caixa aberto com sucesso!', id: response[0].id });
  } catch (error) {
    console.error('Erro ao abrir o caixa:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/caixa-aberto', authenticateToken, async (req, res) => {
  const { id } = req.body;

  try {
    const response = await conn`SELECT * FROM caixa WHERE id = ${id} AND status = 'aberto'`;
    res.json(response);
  } catch (error) {
    console.error('Erro ao abrir o caixa:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/caixas-abertos', authenticateToken, async (req, res) => {
  const { user_id } = req.body;

  try {
    const response = await conn`SELECT * FROM caixa WHERE user_id = ${user_id} AND status = 'aberto'`;
    res.json(response);
  } catch (error) {
    console.error('Erro ao verificar caixas abertos:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/retirada', authenticateToken, async (req, res) => {
  const { id, retirada } = req.body;

  try {
    await conn`UPDATE caixa SET retirada = retirada + ${retirada}, dinheiro = dinheiro - ${retirada} WHERE id = ${id}`;
    res.status(200).json({ message: 'Retirada feita com sucesso!' });
  } catch (error) {
    console.error('Erro ao fazer retirada:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/fechamento', authenticateToken, async (req, res) => {
  const { user_id, id, dinheiro_final, senha } = req.body;

  try {
    const user = await conn`SELECT * FROM users WHERE id = ${user_id}`;
    const passwordMatch = await bcrypt.compare(senha, user[0].senha);
    if(!passwordMatch){
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    await conn`UPDATE caixa SET status = 'fechado', dinheiro_final = ${dinheiro_final}, hora_final = NOW() WHERE id = ${id}`;
    res.status(200).json({ message: 'Caixa fechado com sucesso!' });
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

router.post('/autorizar-senha', authenticateToken, async (req, res) => {
  const { user_id, senha } = req.body;

  try {
    const user = await conn`SELECT * FROM users WHERE id = ${user_id}`;
    const passwordMatch = await bcrypt.compare(senha, user[0].senha);
    if(!passwordMatch){
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    res.status(200).json({ message: 'Acesso Concedido!' });
  } catch (error) {
    console.error('Erro ao verificar caixas abertos:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
})

module.exports = router;
