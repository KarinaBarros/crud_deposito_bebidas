const postgres = require('postgres');

const conn = postgres({
    host: process.env.HOST,       
    port: process.env.PORT,                
    username: process.env.US,  
    password: process.env.PASSWORD,    
    database: process.env.DATABASE, 
    max: 30,                 
    idle_timeout: 5000        
});

(async () => {
    try {
        await conn`SET timezone = 'America/Sao_Paulo'`;
        console.log("Timezone configurado para 'America/Sao_Paulo'");
    } catch (error) {
        console.error("Erro ao definir timezone:", error);
    }
})();


module.exports = conn;