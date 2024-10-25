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
        Minimo.style.color = 'green';
    }
    else {
        Minimo.style.color = 'red';
    }

    if (/[A-Z]/.test(senha)) {
        Maiuscula.style.color = 'green';
    }
    else {
        Maiuscula.style.color = 'red';
    }

    if (/[a-z]/.test(senha)) {
        Minuscula.style.color = 'green';
    }
    else {
        Minuscula.style.color = 'red';
    }

    if (/\d/.test(senha)) {
        Numero.style.color = 'green';
    }
    else {
        Numero.style.color = 'red';
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
        Especial.style.color = 'green';
    }
    else {
        Especial.style.color = 'red';
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
 // Função para extrair o token da URL
 function getToken() {
    const pathname = window.location.pathname;
    const segments = pathname.split('/');
    return segments[segments.length - 1]; 
}

//Função para enviar formulario de cadastro
async function handleSubmitRegistration(event) {
    event.preventDefault();

    if (!verificarSenha() || !validatePassword()) {
        return false; // Se alguma validação falhar, não envie os dados
    }

    const formData = {
        token: getToken(),
        newPassword: Senha.value,
    };

    try {
        const response = await axios.post('/api/reset-password', formData);
        console.log('Dados enviados com sucesso:', response.data);
        alert(response.data.message);
        window.location.href = '/login';
    } catch (error) {
        console.error('Erro ao enviar os dados:', error);
        alert(error.message);
    }
}