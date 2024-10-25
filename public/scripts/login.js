var containerLogin = document.getElementById('container-login');
var containerRegistration = document.getElementById('container-registration');
var containerChange = document.getElementById('container-change');
var containerButton = document.getElementById('container-button');
var Logo = document = document.getElementById('logo');
var buttonLogin = document.getElementById('button-login');
var buttonRegistration = document.getElementById('button-registration');

//Navegação entre formulários
function Registration() {
    containerLogin.style.display = 'none';
    containerRegistration.style.display = 'block';

    buttonLogin.style.color = 'var(--color-text)';
    buttonLogin.style.borderBottom = '2px solid var(--color-text)';

    buttonRegistration.style.color = 'var(--color-highlight)';
    buttonRegistration.style.borderBottom = '2px solid var(--color-highlight)';
}

function Login() {
    containerRegistration.style.display = 'none';
    containerLogin.style.display = 'block';

    buttonLogin.style.color = 'var(--color-highlight)';
    buttonLogin.style.borderBottom = '2px solid var(--color-highlight)';

    buttonRegistration.style.color = 'var(--color-text)';
    buttonRegistration.style.borderBottom = '2px solid var(--color-text)';
}

async function chagePassword() {
    var inputEmail = document.getElementById('email-login').value;
    // Verifica se o campo 'email' está preenchido
    if (inputEmail.trim() === '') {
        alert('Por favor, preencha o campo Email.');
        return;
    }
    // Verifica se o email é válido usando uma expressão regular
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail);
    if (!emailValido) {
        alert('Por favor, insira um email válido.');
        return;
    }

    try {
        const response = await axios.post('/api/forgot-password', {email : inputEmail});
        console.log('Dados enviados com sucesso:', response.data);
        alert(response.data.message);
    } catch (error) {
        console.error('Erro ao enviar os dados:', error);
        alert(error.message);
    }

}

//Função para enviar formulario de login
async function handleSubmitLogin(event) {
    event.preventDefault();

    const formData = {
        email: document.getElementById("email-login").value,
        senha: document.getElementById("password-login").value,
    };

    try {
        const response = await axios.post('/api/login', formData);
        console.log('Dados enviados com sucesso:', response.data);
        const token = response.data.token;
        const nome = response.data.nome;
        localStorage.setItem('token', token);
        localStorage.setItem('nome', nome);
        window.location.href = '/';
    } catch (error) {
        console.error('Erro ao enviar os dados:', error);
        alert(error.message);
    }
}

var Senha = document.getElementById('password-registration');
var Minimo = document.getElementById('minimo');
var Maiuscula = document.getElementById('maiuscula');
var Minuscula = document.getElementById('minuscula');
var Numero = document.getElementById('numero');
var Especial = document.getElementById('especial');


//Validação de senha
function verificarSenhaForte() {
    var senha = Senha.value;
    if (senha.length < 8) {
        return false;
    }

    var temMaiuscula = /[A-Z]/.test(senha);
    var temMinuscula = /[a-z]/.test(senha);
    var temNumero = /\d/.test(senha);
    var temEspecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(senha);

    if (temMaiuscula && temMinuscula && temNumero && temEspecial) {
        return true;
    } else {
        return false;
    }
}


function verificarSenha() {
    var senha = Senha.value;
    if (verificarSenhaForte(senha)) {
        return true;
    } else {
        alert('A senha não atende aos padrões');
        event.preventDefault();
        return false;
    }
}
//Alteração de cores para os requisitos da senha
Senha.addEventListener("input", function () {
    var senha = this.value;


    if (senha.length >= 8) {
        Minimo.style.color = 'var(--color-text)';
    }
    else {
        Minimo.style.color = 'var(--color-highlight)';
    }

    if (/[A-Z]/.test(senha)) {
        Maiuscula.style.color = 'var(--color-text)';
    }
    else {
        Maiuscula.style.color = 'var(--color-highlight)';
    }

    if (/[a-z]/.test(senha)) {
        Minuscula.style.color = 'var(--color-text)';
    }
    else {
        Minuscula.style.color = 'var(--color-highlight)';
    }

    if (/\d/.test(senha)) {
        Numero.style.color = 'var(--color-text)';
    }
    else {
        Numero.style.color = 'var(--color-highlight)';
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
        Especial.style.color = 'var(--color-text)';
    }
    else {
        Especial.style.color = 'var(--color-highlight)';
    }
});

//Validação de confirmação de senha
function validatePassword() {
    var password = Senha.value;
    var confirmPassword = document.getElementById("confirm-password").value;

    if (password != confirmPassword) {
        alert("As senhas não correspondem!");
        event.preventDefault();
        return false;
    }
    else {
        return true;
    }
}

//Função para enviar formulario de cadastro
async function handleSubmitRegistration(event) {
    event.preventDefault();

    if (!verificarSenha() || !validatePassword()) {
        return false; // Se alguma validação falhar, não envie os dados
    }

    const formData = {
        nome: document.getElementById("name").value,
        email: document.getElementById("email-registration").value,
        senha: Senha.value,
    };

    try {
        const response = await axios.post('/api/register', formData);
        console.log('Dados enviados com sucesso:', response.data);
        alert(response.data.message);
    } catch (error) {
        console.error('Erro ao enviar os dados:', error);
        alert(error.message);
    }
}

//Lembrar dados no localStorage
window.onload = function () {
    var rememberedData = JSON.parse(localStorage.getItem('rememberedData'));
    if (rememberedData && rememberedData.remember) {
        document.getElementById('email-login').value = rememberedData.username;
        document.getElementById('password-login').value = rememberedData.password;
        document.getElementById('remember').checked = true;
    }
};

document.getElementById('remember').addEventListener('change', function (event) {
    var username = document.getElementById('email-login').value;
    var password = document.getElementById('password-login').value;
    var remember = document.getElementById('remember').checked;

    if (remember) {
        localStorage.setItem('rememberedData', JSON.stringify({ username: username, password: password, remember: true }));
    } else {
        localStorage.removeItem('rememberedData');
    }
});
