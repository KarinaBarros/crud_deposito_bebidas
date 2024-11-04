const token = localStorage.getItem('token');
const id = localStorage.getItem('id');
//Função para verificar rota protegida
async function verificarToken() {
    if (token) {
        try {
            const response = await axios.get('/api/protected', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('Acesso concedido' + response);
        } catch (error) {
            console.error('Erro:', error);
            window.location.href = '/login';
        }
    } else {
        window.location.href = '/login';
    }
}
verificarToken();


//funçao para popular tabela de estoque e nome de bebidas em vendas
let idProdutoSelecionado;
async function buscaEstoque() {
    if (id && token) {
        try {
            const response = await axios.post('/api/estoque', { user_id: id }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            let tbodyEstoque = document.getElementById('tbody-estoque');
            tbodyEstoque.innerHTML = '';

            let vendaBebida = document.getElementById('venda-bebida');
            vendaBebida.innerHTML = '';
            let linhaBranco = document.createElement('option');
            linhaBranco.value = '';
            linhaBranco.setAttribute('data-preco', '');
            vendaBebida.appendChild(linhaBranco);


            response.data.forEach(function (item) {
                let novaLinha = document.createElement("tr");

                let tipo = document.createElement("td");
                tipo.textContent = item.tipo;
                novaLinha.appendChild(tipo);

                let nome = document.createElement("td");
                nome.textContent = item.nome;
                novaLinha.appendChild(nome);

                let unidades = document.createElement("td");
                unidades.textContent = item.total_unidades;
                novaLinha.appendChild(unidades);

                let tdbotao = document.createElement("td");

                let botao = document.createElement("button");
                botao.classList.add('btn-alterar-estoque');
                botao.title = "Altere dados do produto";
                botao.innerHTML = `<i class="fas fa-edit"></i>`;
                botao.onclick = () => EstoqueId(item.id);

                let botaoExcluir = document.createElement("button");
                botaoExcluir.classList.add('btn-alterar-estoque');
                botaoExcluir.title = "Excluir produto";
                botaoExcluir.innerHTML = `<i class="fas fa-trash"></i>`;
                botaoExcluir.onclick = () => IdExcluir(item.id);

                // Defina um evento de clique que chama EstoqueId com o ID do item

                tdbotao.appendChild(botao);
                tdbotao.appendChild(botaoExcluir);
                novaLinha.appendChild(tdbotao);
                tbodyEstoque.appendChild(novaLinha);

                let linhaVenda = document.createElement('option');
                linhaVenda.value = item.id;
                linhaVenda.textContent = item.nome;
                linhaVenda.setAttribute('data-preco', item.valor_venda_por_unidade);
                vendaBebida.appendChild(linhaVenda);
            });

        } catch (error) {
            console.error('Erro:', error);
        }
    } else {
        window.location.href = '/login';
    }

}

//Buscar dados para alterar estoque

async function EstoqueId(idProduto) {
    try {
        const response = await axios.post('/api/estoque-id', { id: idProduto }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        idProdutoSelecionado = idProduto;
        console.log("produto", idProdutoSelecionado);
        console.log(response.data);

        // Atualiza o conteúdo do nome do produto
        const nomeProduto = document.getElementById('nome-produto');
        nomeProduto.textContent = "Bebida: " + response.data[0].nome;

        const NovoValor = document.getElementById("novo-venda-valor");
        NovoValor.value = response.data[0].valor_venda_por_unidade;
        formatarDinheiro(NovoValor);

        // Exibe e oculta os containers de estoque
        const estoquePrincipal = document.getElementById("container-estoque-principal");
        const alterarEstoque = document.getElementById("container-alterar-estoque");
        if (estoquePrincipal && alterarEstoque) {
            estoquePrincipal.style.display = 'none';
            alterarEstoque.style.display = 'block';
        }

    } catch (error) {
        console.error('Erro:', error);
    }
}

buscaEstoque();

//pesquisar no estoque
const searchInput = document.getElementById("pesquisa-estoque");
const tableBody = document.getElementById("tbody-estoque");

searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase(); // Captura o texto do input em minúsculas
    const rows = tableBody.getElementsByTagName("tr"); // Seleciona todas as linhas do tbody específico de estoque

    for (let row of rows) {
        const nomeCell = row.cells[1]; // Seleciona a segunda coluna (index 1) que contém o nome do produto
        const itemText = nomeCell ? nomeCell.textContent.toLowerCase() : ""; // Conteúdo do <td> em minúsculas

        // Exibe a linha se o nome do produto incluir o valor da pesquisa; caso contrário, esconde.
        if (itemText.includes(query)) {
            row.style.display = ""; // Exibe a linha
        } else {
            row.style.display = "none"; // Oculta a linha
        }
    }
});

//voltar para estoque principal
function CloseAlterarEstoque() {
    const estoquePrincipal = document.getElementById("container-estoque-principal");
    const alterarEstoque = document.getElementById("container-alterar-estoque");
    estoquePrincipal.style.display = 'block';
    alterarEstoque.style.display = 'none';
}

//submeter formulário de alteração de estoque
async function submitFormAlterar(event) {
    event.preventDefault();
    if (token) {
        const formData = {
            id: idProdutoSelecionado,
            quantidade_caixas: document.getElementById("novo-unidade-caixa").value,
            unidades_por_caixa: document.getElementById("novo-unidade").value,
            valor_gasto_por_caixa: extrairValor(document.getElementById("novo-gasto-caixa").value),
            valor_venda_por_unidade: extrairValor(document.getElementById("novo-venda-valor").value),
        };
        console.log(formData);

        try {
            const response = await axios.post('/api/alterar-estoque', formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            alert(response.data.message);
            buscaEstoque();
            document.getElementById("form-cadastro-alterar").reset();
        } catch (error) {
            console.error('Erro ao enviar os dados:', error);
            alert(error.message);
        }
    } else {
        window.location.href = '/login'
    }
}

//função para excluir um produto do estoque
async function IdExcluir(idProdutoExcluir) {
    if (token) {
        let resposta = confirm("Tem certeza que deseja excluir esse item?");
        if (resposta) {
            try {
                const response = await axios.post('/api/excluir-bebida', { id: idProdutoExcluir }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                alert(response.data.message);
                buscaEstoque();
            } catch (error) {
                console.error('Erro ao enviar os dados:', error);
                alert(error.message);
            }
        }
    } else {
        window.location.href = '/login';
    }
}

//Função para buscar nomes dos clientes
async function ListarClientes() {


    if (token && id) {
        try {
            const response = await axios.post('/api/clientes-pendente', { user_id: id }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            let listaNome = document.getElementById('lista-nome');
            listaNome.innerHTML = '';
            let linhaVazia = document.createElement('option');
            linhaVazia.value = '';
            linhaVazia.textContent = '';
            listaNome.appendChild(linhaVazia);

            let pesquisaCliente = document.getElementById('pesquisa-cliente');
            pesquisaCliente.innerHTML = '';
            pesquisaCliente.appendChild(linhaVazia);

            response.data.forEach(function (item) {
                let linha = document.createElement('option');
                linha.value = item.id;
                linha.textContent = item.nome_cliente;
                listaNome.appendChild(linha);

                let linhaPesquisa = document.createElement('option');
                linhaPesquisa.value = item.id;
                linhaPesquisa.textContent = item.nome_cliente;
                pesquisaCliente.appendChild(linhaPesquisa);
            })

            listaNome.value = '';
            pesquisaCliente.value = '';
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        }
    } else {
        window.location.href = '/login';
    }
}
ListarClientes();

//Função para capturar preço do produto
function capturarPreco() {
    let vendaBebida = document.getElementById('venda-bebida');
    let optionSelecionada = vendaBebida.options[vendaBebida.selectedIndex];
    let preco = optionSelecionada.getAttribute('data-preco');

    let valor = preco.replace(/\D/g, '');
    valor = (Number(valor) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let vendaValor = document.getElementById('venda-valor');
    vendaValor.value = valor;
}

//Funçao para enviar formulário de vendas
async function submitFormVendas(event) {
    event.preventDefault();
    //user_id, nome_cliente, bebida_id, quantidade
    //vendas_nova_comanda

    if (token && id) {
        const vendaNome = document.getElementById('venda-nome').value;
        const listaNome = document.getElementById('lista-nome').value;
        const vendaBebida = document.getElementById('venda-bebida').value;
        const vendaQuantidade = document.getElementById('venda-quantidade').value;
        if (vendaNome && listaNome) {
            alert('Escolha somente um dos campos de nomes');
            return;
        }
        if (vendaNome || listaNome) {
            if (vendaNome) {
                try {
                    const data = {
                        user_id: id,
                        nome_cliente: vendaNome,
                        bebida_id: vendaBebida,
                        quantidade: vendaQuantidade
                    }
                    const response = await axios.post('/api/vendas_nova_comanda', data, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    alert(response.data.message);
                    document.getElementById('form-vendas').reset();

                    ListarClientes();
                    TodosClientes();
                } catch (error) {
                    console.error('Erro ao inserir venda de nova comanda:', error);
                }
            } else {
                try {
                    const data = {
                        venda_id: listaNome,
                        bebida_id: vendaBebida,
                        quantidade: vendaQuantidade
                    }
                    const response = await axios.post('/api/venda', data, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    alert(response.data.message);
                    document.getElementById('venda-bebida').value = '';
                    document.getElementById('venda-quantidade').value = '';
                    document.getElementById('venda-valor').value = '';
                    TodosClientes();
                } catch (error) {
                    console.error('Erro ao inserir venda:', error);
                }
            }
        } else {
            alert('Escolha uma comanda ou adicione um nome pra nova comanda.');
        }
    } else {
        window.location.href = '/login';
    }

}

//função para buscar itens comprados pelo cliente
async function BuscarCliente(event) {
    event.preventDefault();
    try {
        const pesquisaCliente = document.getElementById('pesquisa-cliente').value;
        const response = await axios.post('/api/busca_cliente', { venda_id: pesquisaCliente }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        console.log(response.data);
        let tbody = document.getElementById('tbody-pagto');
        tbody.innerHTML = '';

        let total = 0;

        response.data.forEach(function (item) {
            let novaLinha = document.createElement("tr");

            let tdbebida = document.createElement("td");
            tdbebida.textContent = item.nome;
            novaLinha.appendChild(tdbebida);

            let tdquantidade = document.createElement("td");
            tdquantidade.textContent = item.quantidade;
            novaLinha.appendChild(tdquantidade);

            let tdValorU = document.createElement("td");
            let valor = item.valor_venda_por_unidade.replace(/\D/g, '');
            valor = (Number(valor) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            tdValorU.textContent = valor;
            novaLinha.appendChild(tdValorU);

            let tdValorT = document.createElement("td");
            let valorT = item.valor_venda_por_unidade * item.quantidade;
            let valorTFormatado = valorT.toFixed(2).replace(/\D/g, '');
            valorTFormatado = (Number(valorTFormatado) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            tdValorT.textContent = valorTFormatado;
            novaLinha.appendChild(tdValorT);

            total += valorT;

            tbody.appendChild(novaLinha);
        })
        total = total.toFixed(2).replace(/\D/g, '');
        total = (Number(total) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        document.getElementById('total-pagto').value = total;

    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
    }
}

//Funçao para excluir dados do pagamento
function excluirDadosPagto() {
    let tbody = document.getElementById('tbody-pagto');
    tbody.innerHTML = '';
    document.getElementById('total-pagto').value = '';
    document.getElementById('pesquisa-cliente').value = '';
}

async function EfetuarPagto(tipoPagto) {
    const pesquisaCliente = document.getElementById('pesquisa-cliente').value;
    const listaProdutos = document.getElementById('tbody-pagto');
    if(!token && id){
        window.location.href = '/login';
    }
    if (listaProdutos.rows.length > 0) {
        const confirm = window.confirm(`Deseja concluir pagamento com ${tipoPagto}`);
        if(confirm){
            try {
                const data = {
                    id : pesquisaCliente,
                    forma_pagto: tipoPagto
                }
                const response = await axios.post('/api/concluir_venda', data, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                alert(response.data.message);
                ListarClientes();
                excluirDadosPagto();
                TodosClientes();
            } catch (error) {
                console.error('Erro ao confirmar venda:', error);
            }
        }
    } else {
        alert('Abra uma comanda!');
    }
}

//Função para buscar todos os clientes
async function TodosClientes() {
    if(!token && id){
        window.location.href = '/login';
    }
    try{
        const response = await axios.post('/api/todos-clientes', {user_id:id}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        console.log(response.data);
        const tbodyBusca = document.getElementById('tbody-busca');
        tbodyBusca.innerHTML = '';

        response.data.forEach(function (item) {
            let linha = document.createElement("tr");

            let tdCliente = document.createElement("td");
            tdCliente.textContent = item.nome_cliente;
            linha.appendChild(tdCliente);

            let tdTotal = document.createElement("td");
            let valor = item.valor_total_venda.replace(/\D/g, '');
            valor = (Number(valor) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            tdTotal.textContent = valor;
            linha.appendChild(tdTotal);

            let tdStatus = document.createElement("td");
            tdStatus.textContent = item.status;
            let cor;
            if(item.status === 'pendente'){
                cor = 'red';
            }else{
                cor = 'green';
            }
            tdStatus.style.color = cor;
            linha.appendChild(tdStatus);

            tbodyBusca.appendChild(linha);
        })


    }catch (error) {
        console.error('Erro ao bucar todos os clientes:', error);
    }
}
TodosClientes();

//pesquisar em todos os clientes
const searchInputClientes = document.getElementById("busca-clientes");
const tableBodyClientes = document.getElementById("tbody-busca");

searchInputClientes.addEventListener("input", function () {
    const query = this.value.toLowerCase(); // Captura o texto do input em minúsculas
    const rows = tableBodyClientes.getElementsByTagName("tr"); // Seleciona todas as linhas do tbody específico de estoque

    for (let row of rows) {
        const nomeCell = row.cells[0]; // Seleciona a primeira coluna (index 1) que contém o nome do produto
        const itemText = nomeCell ? nomeCell.textContent.toLowerCase() : ""; // Conteúdo do <td> em minúsculas

        // Exibe a linha se o nome do produto incluir o valor da pesquisa; caso contrário, esconde.
        if (itemText.includes(query)) {
            row.style.display = ""; // Exibe a linha
        } else {
            row.style.display = "none"; // Oculta a linha
        }
    }
});



//Formataçao dinheiro
function formatarDinheiro(input) {

    let valor = input.value.replace(/\D/g, '');
    valor = (Number(valor) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    input.value = valor;
}

//Formatar para armazenar no db
function extrairValor(moeda) {
    // Remove o símbolo de moeda e espaços em branco
    let valor = moeda.replace(/[^0-9,]/g, '').replace(',', '.');

    // Converte a string em um número
    return parseFloat(valor);
}

//nome do usuario
const nomeStorage = localStorage.getItem('nome');
if (nomeStorage) {
    document.getElementById('nome-login').innerHTML = nomeStorage;
}


//Alerta sair da conta
function alertLogout() {
    if (confirm('Tem certeza que deseja sair da sua conta?')) {
        localStorage.removeItem('nome');
        localStorage.removeItem('token');
        localStorage.removeItem('id');
        window.location.href = '/login';
    }
}

//navegação
var containerPrincipal = document.getElementById('container-principal');
var containerCadastro = document.getElementById('container-cadastro');
var containerVendas = document.getElementById('container-vendas');
var containerEstoque = document.getElementById('container-estoque');
var containerPagamento = document.getElementById('container-pagamento');
var containerBusca = document.getElementById('container-busca');
var containerTVendas = document.getElementById('container-tvendas');
var allContainers = [containerPrincipal, containerCadastro, containerVendas, containerEstoque, containerPagamento, containerBusca, containerTVendas];

var botaoCBebidas = document.getElementById('c-bebidas');
var botaoVBebidas = document.getElementById('v-bebidas');
var botaoPagto = document.getElementById('pagto');
var botaoBuscaC = document.getElementById('busca-c');
var botaoTodasV = document.getElementById('todas-v');
var botaoEstoqueB = document.getElementById('estoque-b');
var allBotao = [botaoCBebidas, botaoVBebidas, botaoPagto, botaoBuscaC, botaoTodasV, botaoEstoqueB];

var hamburgerMenu = document.getElementById('hamburger-menu');
var closeMenu = document.getElementById('close-menu');
var navigationHome = document.getElementById('navigation-home');

function toggleNav() {
    navigationHome.style.display = 'block';
    hamburgerMenu.style.display = 'none';
    closeMenu.style.display = 'block';
}

function closeNav() {
    navigationHome.style.display = 'none';
    hamburgerMenu.style.display = 'block';
    closeMenu.style.display = 'none';
}

function closeNav2() {
    if (window.matchMedia("(max-width: 1024px)").matches) {
        closeNav();
    }
}

function Close() {
    for (var i = 0; i < allContainers.length; i++) {
        allContainers[i].style.display = 'none';
    }
    containerPrincipal.style.display = 'block';

    for (var ib = 0; ib < allBotao.length; ib++) {
        allBotao[ib].style.color = 'var(--color-text)';
        allBotao[ib].style.borderBottom = '2px solid var(--color-text)';
    }
}

function cadastroBebidas() {
    for (var i = 0; i < allContainers.length; i++) {
        allContainers[i].style.display = 'none';
    }
    containerCadastro.style.display = 'block';


    for (var ib = 0; ib < allBotao.length; ib++) {
        allBotao[ib].style.color = 'var(--color-text)';
        allBotao[ib].style.borderBottom = '2px solid var(--color-text)';
    }
    botaoCBebidas.style.color = 'var(--color-highlight)';
    botaoCBebidas.style.borderBottom = '2px solid var(--color-highlight)';

    closeNav2();
}

function vendasBebidas() {
    for (var i = 0; i < allContainers.length; i++) {
        allContainers[i].style.display = 'none';
    }
    containerVendas.style.display = 'block';


    for (var ib = 0; ib < allBotao.length; ib++) {
        allBotao[ib].style.color = 'var(--color-text)';
        allBotao[ib].style.borderBottom = '2px solid var(--color-text)';
    }
    botaoVBebidas.style.color = 'var(--color-highlight)';
    botaoVBebidas.style.borderBottom = '2px solid var(--color-highlight)';

    closeNav2();
}

function Estoque() {
    for (var i = 0; i < allContainers.length; i++) {
        allContainers[i].style.display = 'none';
    }
    containerEstoque.style.display = 'block';


    for (var ib = 0; ib < allBotao.length; ib++) {
        allBotao[ib].style.color = 'var(--color-text)';
        allBotao[ib].style.borderBottom = '2px solid var(--color-text)';
    }
    botaoEstoqueB.style.color = 'var(--color-highlight)';
    botaoEstoqueB.style.borderBottom = '2px solid var(--color-highlight)';

    closeNav2();
}

function Pagamento() {
    for (var i = 0; i < allContainers.length; i++) {
        allContainers[i].style.display = 'none';
    }
    containerPagamento.style.display = 'block';


    for (var ib = 0; ib < allBotao.length; ib++) {
        allBotao[ib].style.color = 'var(--color-text)';
        allBotao[ib].style.borderBottom = '2px solid var(--color-text)';
    }
    botaoPagto.style.color = 'var(--color-highlight)';
    botaoPagto.style.borderBottom = '2px solid var(--color-highlight)';

    closeNav2();
    excluirDadosPagto();
}

function Busca() {
    for (var i = 0; i < allContainers.length; i++) {
        allContainers[i].style.display = 'none';
    }
    containerBusca.style.display = 'block';


    for (var ib = 0; ib < allBotao.length; ib++) {
        allBotao[ib].style.color = 'var(--color-text)';
        allBotao[ib].style.borderBottom = '2px solid var(--color-text)';
    }
    botaoBuscaC.style.color = 'var(--color-highlight)';
    botaoBuscaC.style.borderBottom = '2px solid var(--color-highlight)';
    closeNav2();
}

function TVendas() {
    for (var i = 0; i < allContainers.length; i++) {
        allContainers[i].style.display = 'none';
    }
    containerTVendas.style.display = 'block';


    for (var ib = 0; ib < allBotao.length; ib++) {
        allBotao[ib].style.color = 'var(--color-text)';
        allBotao[ib].style.borderBottom = '2px solid var(--color-text)';
    }
    botaoTodasV.style.color = 'var(--color-highlight)';
    botaoTodasV.style.borderBottom = '2px solid var(--color-highlight)';
    closeNav2();
}

//funçao submete o formulário e limpa o formulário sem recarregar a página. Permitindo que o usuario continue cadastrando. Emite alerta de cadastro efetuado no cadastro de produtos e venda confirmada no formulario de vendas.
async function submitForm(event) {
    event.preventDefault();
    //user_id, nome, tipo, quantidade_caixas, unidades_por_caixa, valor_gasto_por_caixa, valor_venda_por_unidade
    if (token && id) {
        const formData = {
            user_id: id,
            nome: document.getElementById("nome-bebida").value,
            tipo: document.getElementById("tipo-bebida").value,
            quantidade_caixas: document.getElementById("unidade-caixa").value,
            unidades_por_caixa: document.getElementById("unidade").value,
            valor_gasto_por_caixa: extrairValor(document.getElementById("gasto-caixa").value),
            valor_venda_por_unidade: extrairValor(document.getElementById("venda-unidade").value),
        };

        try {
            const response = await axios.post('/api/cadastro-bebidas', formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            alert(response.data.message);
            buscaEstoque();
            document.getElementById("form-cadastrob").reset();
        } catch (error) {
            console.error('Erro ao enviar os dados:', error);
            alert(error.message);
        }
    } else {
        window.location.href = '/login'
    }
}

function submitVenda() {
    event.preventDefault();
    document.getElementById("form-venda").reset();
    alert('Venda confirmada!');
}