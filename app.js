const express = require('express');
const {body, validationResult} = require('express-validator');
const session = require('express-session')
const promise = require('./database');

const app = express();//cria a aplicação ou o servidor


app.set('view engine', 'ejs');//fala pra ler arquivos ejs, configurando o ejs

app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));//disponibiliza os arquivos publicos como os css
app.use(session({secret:'2512J', resave:false, saveUninitialized:false, cookie:{secure:false}}))//configura o session

app.get('/', (req, res) =>{
    var validacaoArray = [];
    req.session.usuarioId >= 1 ? res.redirect('/dashboard') : res.render('login', {validacaoArray})
})

app.post('/login' ,body('email').trim().notEmpty().withMessage("Preencha o email").bail().isEmail().withMessage('Digite um email válido'),body('senha').notEmpty().withMessage('Preencha a senha') , async (req,res) =>{
    var validacaoArray = validationResult(req).array();
    const email = req.body.email;
    const senha = req.body.senha;
    const connection = await promise;


    if(validacaoArray.length >= 1){//verifica se tem erros
        res.render('login', {validacaoArray})
        return
    }

    const [result] = await connection.query(//ve se tem o login que o usuario inseriu no banco de dados
        'SELECT * FROM usuarios WHERE email = ? AND senha = ?', [email, senha]
    )

    if(result.length >= 1){//ve se o array tem alguma coisa, se tiver quer dizer que o login é valido
        req.session.usuarioId = result[0].id
        res.redirect('/dashboard')
        return
    }else{
        validacaoArray.push({msg:'Email ou Senha inválidos'})//se nao, ele registra o erro no validacaoArray e volta
        res.render('login', {validacaoArray})
    }

})


app.listen(3000, () =>{
    console.log('Servidor rodando em http://localhost:3000');
});

app.get('/cadastro', (req,res) =>{
    var validacaoArray = [];
    req.session.usuarioId >= 1 ? res.redirect('/dashboard') : res.render('cadastro', {validacaoArray})
})


app.post('/cadastro',body('nome').trim().notEmpty().withMessage('Preencha o campo nome').bail().isLength({min:3}).withMessage('O Nome precisa ter no mínimo 3 caracteres'),body('email').trim().notEmpty().withMessage('Preencha o campo email').bail().isEmail().withMessage('Digite um email válido'),body('senha').notEmpty().withMessage('Preencha o campo senha').bail().isLength({min:9}).withMessage('A senha precisa ter no mínimo 9 caracteres'), body('confirmarSenha').notEmpty().withMessage('Preencha a confirmação de senha').bail().custom((confirmacao, meta) =>{if(confirmacao !== meta.req.body.senha){throw new Error('As senhas não coincidem')}else{return true}}) , async (req,res) => {
    var validacaoArray = validationResult(req).array();
    const nome = req.body.nome
    const email = req.body.email
    const senha = req.body.senha
    const connection = await promise;

    //estrutura da confirmação de senha:
    /*  body('confirmarSenha') .custom((confirmacao, meta) =>{
        if(confirmacao !== meta.req.body.senha){
            throw new Error('As senhas não coincidem')
            }else{
                return true (esse é importante pra caso colocar senhas iguais porem menores q 9 caracteres)
        }
        }) */ 
       
       //.bail() serve pra parar as outras validação se a primeira ou outra testada primeira falhar
    try {
        const [resultado] = await connection.query(
            'SELECT EXISTS(SELECT 1 FROM usuarios WHERE email = ?) AS email', [email]
        )
    
        if(resultado[0].email === 1){
            validacaoArray.push({msg:'Email já cadastrado', path:'email'})
        }
    } catch (error) {
        res.send('Ocorreu um erro, tente novamente mais tarde.')
        return
    }


    if(validacaoArray.length > 0){
        return(
            res.render('cadastro',{
                validacaoArray
            })
        )
    }else{
        try {
            await connection.query(
                   'INSERT INTO usuarios (nome, email, senha) VALUES(?, ?, ?)',// Node manda um comando SQL pro MySQL
                   [nome, email, senha]//valores que estão em ponto de interrogação
               )  
        } catch (error) {
            console.log(error)
            res.send('Ocorreu um erro ao cadastrar.')
            return
        }
        res.redirect('/dashboard')
    }

    //senha ainda está sendo salva diretamente no banco, aprender sobre hash de senha futuramente.
    
});

app.get('/dashboard', (req,res) =>{
    req.session.usuarioId === undefined ? res.redirect('/') : res.render('dashboard')
})

app.get('/logout', (req,res) =>{
    req.session.destroy((erro) => {
        erro !== undefined ? res.send('Ocorreu um erro') : res.redirect('/')
    })
})