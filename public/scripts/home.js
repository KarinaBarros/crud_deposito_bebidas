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


//funçao para popular tabela de estoque enome de bebidas em vendas
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
    

    if(token && id){
        try{
            const response = await axios.post('/api/clientes', {user_id: id}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            let listaNome = document.getElementById('lista-nome');
            listaNome.innerHTML = '';

            response.data.forEach(function(item){
                let linha = document.createElement('option');
                linha.value = item.nome_cliente;
                listaNome.appendChild(linha);
            })
        }catch(error){
            console.error('Erro ao buscar clientes:', error);
        }
    }else{
        window.location.href = '/login'
    }
}
ListarClientes();

//Função para capturar preço do produto
function capturarPreco(){
    let vendaBebida = document.getElementById('venda-bebida');
    let optionSelecionada = vendaBebida.options[vendaBebida.selectedIndex];
    let preco = optionSelecionada.getAttribute('data-preco');
    
    let valor = preco.replace(/\D/g, '');
    valor = (Number(valor) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let vendaValor = document.getElementById('venda-valor');
    vendaValor.value = valor;
}

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
var containerPendente = document.getElementById('container-pendente');
var containerEfetuado = document.getElementById('container-efetuado');
var containerBusca = document.getElementById('container-busca');
var containerTVendas = document.getElementById('container-tvendas');
var allContainers = [containerPrincipal, containerCadastro, containerVendas, containerEstoque, containerPagamento, containerPendente, containerEfetuado, containerBusca, containerTVendas];

var botaoCBebidas = document.getElementById('c-bebidas');
var botaoVBebidas = document.getElementById('v-bebidas');
var botaoPagto = document.getElementById('pagto');
var botaoPagtoP = document.getElementById('pagto-p');
var botaoPagtoE = document.getElementById('pagto-e');
var botaoBuscaC = document.getElementById('busca-c');
var botaoTodasV = document.getElementById('todas-v');
var botaoEstoqueB = document.getElementById('estoque-b');
var allBotao = [botaoCBebidas, botaoVBebidas, botaoPagto, botaoPagtoP, botaoPagtoE, botaoBuscaC, botaoTodasV, botaoEstoqueB];

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
}

function Pendente() {
    for (var i = 0; i < allContainers.length; i++) {
        allContainers[i].style.display = 'none';
    }
    containerPendente.style.display = 'block';


    for (var ib = 0; ib < allBotao.length; ib++) {
        allBotao[ib].style.color = 'var(--color-text)';
        allBotao[ib].style.borderBottom = '2px solid var(--color-text)';
    }
    botaoPagtoP.style.color = 'var(--color-highlight)';
    botaoPagtoP.style.borderBottom = '2px solid var(--color-highlight)';

    closeNav2();
}

function Efetuado() {
    for (var i = 0; i < allContainers.length; i++) {
        allContainers[i].style.display = 'none';
    }
    containerEfetuado.style.display = 'block';


    for (var ib = 0; ib < allBotao.length; ib++) {
        allBotao[ib].style.color = 'var(--color-text)';
        allBotao[ib].style.borderBottom = '2px solid var(--color-text)';
    }
    botaoPagtoE.style.color = 'var(--color-highlight)';
    botaoPagtoE.style.borderBottom = '2px solid var(--color-highlight)';
    closeNav2();
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