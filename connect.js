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


module.exports = conn;