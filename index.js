require('dotenv').config(); // Isso precisa estar no topo do seu arquivo

const express = require('express')
const { default: mongoose } = require('mongoose')
const cors = require('cors')
const session = require('express-session')


const UserModel = require('./models/User');

const app = express()
const port = 3001


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log("MongoDB conectado");
  }).catch((err) => {
    console.error("Erro ao conectar ao MongoDB:", err);
  });
  


app.use(cors({ origin: "http://localhost:3000",    
    credentials: true, // Isso é ESSENCIAL
})); // Ajuste a porta conforme necessário
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
    secret: 'seuSegredoAqui',
    resave: false,
    saveUninitialized: false, // melhor segurança
    cookie: {
      secure: false, // true apenas em produção com HTTPS
      httpOnly: true,
      sameSite: 'lax'
    }
}))

app.post('/register', (req,res)=>{
    UserModel.create(req.body)
    .then(users => res.json(users))
    .catch(err => res.json(err))
})

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  UserModel.findOne({ email }).then(user => {
    if (!user) return res.json({ success: false, message: "Usuário não encontrado" });

    if (user.password === password) {
      req.session.user = {
        name: user.name,
        email: user.email
      };
      return res.json({ success: true });
    }

    res.json({ success: false, message: "Senha incorreta" });
  });
});

app.get('/session', (req, res) => {
  if (req.session.user) {
    res.json({
      loggedIn: true,
      user: {
        name: req.session.user.name,
        email: req.session.user.email
      }
    });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: "Erro ao fazer logout" });
    }
    res.clearCookie('connect.sid'); // limpa o cookie da sessão
    res.json({ success: true, message: "Logout realizado com sucesso" });
  });
});
  

app.listen(port, () => console.log(`Example app listening on port ${port}!`))