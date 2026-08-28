const mysql = require('mysql2/promise')

const promise = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"minecraft7781.",
    database:"controle_financeiro"
})

promise
 .then(() =>{//se a conexão der certo
    console.log('Banco conectado!');//executa esse bloco
}).catch((erro) => {//se a conexão der errado
    console.log(erro)//executa esse bloco
});

module.exports = promise;//disponibiliza a const promise pra outros arquivos
