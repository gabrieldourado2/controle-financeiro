const express = require('express');
const {body, validationResult} = require('express-validator');
const promise = require('./database');

const app = express();//cria a aplicação ou o servidor


app.set('view engine', 'ejs');//fala pra ler arquivos ejs, configurando o ejs

app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));//disponibiliza os arquivos publicos como os css

app.get('/', (req, res) =>{
    res.render('login')
})

app.listen(3000, () =>{
    console.log('Servidor rodando em http://localhost:3000');
});

app.get('/cadastro', (req,res) =>{
    res.render('cadastro')
})


app.post('/cadastro',body('nome').trim().notEmpty().withMessage('Preencha o campo nome').bail().isLength({min:3}).withMessage('o nome precisa ter no mínimo 3 caracteres'),body('email').trim().notEmpty().withMessage('Preencha o campo email').bail().isEmail().withMessage('Digite um email válido'),body('senha').notEmpty().withMessage('Preencha o campo senha').bail().isLength({min:9}).withMessage('Digite uma senha válida'), body('confirmarSenha').notEmpty().withMessage('Preencha a confirmação de senha').bail().custom((confirmacao, meta) =>{if(confirmacao !== meta.req.body.senha){throw new Error('As senhas não coincidem')}}) , async (req,res) => {
    var validacaoArray = validationResult(req).array();
    const nome = req.body.nome
    const email = req.body.email
    const senha = req.body.senha
    const connection = await promise;

    //estrutura da confirmação de senha:
/*  body('confirmarSenha') .custom((confirmacao, meta) =>{
        if(confirmacao !== meta.req.body.senha){
            throw new Error('As senhas não coincidem')
        }
    }) */

    //.bail() serve pra parar as outras validação se a primeira ou outra testada primeira falhar
    
    if(validacaoArray.length > 0){
        var erro = '';
        for(let i = 0; i < validacaoArray.length; i++){
            erro += (`${validacaoArray[i].msg}<br>`)
        }
        return(
            res.send(erro)
        )
    }
    
    try {
        await connection.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES(?, ?, ?)',// Node manda um comando SQL pro MySQL
            [nome, email, senha]//valores que estão em ponto de interrogação
        )
    res.redirect('/dashboard')
    } catch (error) {
        console.log(error)
        if(error.code === 'ER_DUP_ENTRY'){//se o email estiver repetido, executar isso
            res.send('Email já cadastrado.')
        }else{
            res.send('Ocorreu um erro ao criar sua conta.')
        }
    } 
    
});

app.get('/dashboard', (req,res) =>{
    res.render('dashboard')
})
