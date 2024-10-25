 // Função para extrair o token da URL
 function getToken() {
    const pathname = window.location.pathname;
    const segments = pathname.split('/');
    return segments[segments.length - 1]; 
}


async function fetchData() {
    try {
        const token = getToken();
        const response = await axios.post('/api/confirm', { token });
        console.log(token);
        console.log(response.data);
        alert(response.data.message);
        window.location.href = '/login';
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById("message").textContent = 'Erro ao cadastrar novo usuário.';
    }
}

fetchData();