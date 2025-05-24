require('dotenv').config(); // Isso precisa estar no topo do seu arquivo

const express = require('express')
const { default: mongoose } = require('mongoose')
const cors = require('cors')
const session = require('express-session')
const multer = require('multer')
const fs = require("fs");
const path = require('path')


const UserModel = require('./models/User');
const ProductModel = require('./models/Product');

const app = express()
const port = process.env.PORT || 3001;


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log("MongoDB conectado");
  }).catch((err) => {
    console.error("Erro ao conectar ao MongoDB:", err);
  });
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "uploads");
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ storage });

  app.use(cors({
    origin: [
      "http://localhost:3000",
      "https://ecommerce-shop-git-main-felipeandreassilvaas-projects.vercel.app",
      "ecommerce-shop-nmsyt39dk-felipeandreassilvaas-projects.vercel.app"
    ],
    credentials: true,
  }));
  
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
    secret: 'seuSegredoAqui',
    resave: false,
    saveUninitialized: false, // melhor segurança
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
    
}))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


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

app.post("/Add_Produto", upload.single("imagem"), async (req, res) => {
  try {
      const { name, categoria, preco } = req.body;
      const imagem = req.file ? `/uploads/${req.file.filename}` : "";

      const novoProduto = new ProductModel({ name, categoria, preco, imagem });
      await novoProduto.save();

      res.status(201).json({ message: "Produto adicionado com sucesso", produto: novoProduto });
  } catch (error) {
      res.status(500).json({ message: "Erro ao adicionar produto", error });
  }
});

app.get('/Get_Produto', async (req, res) => {
  try {
    const produtos = await ProductModel.find();
    res.status(200).json(produtos);            
  } catch (error) {
    console.error("Erro na rota /Get_Produto:", error); // <- Log completo
    res.status(500).json({ message: "Erro ao buscar o produto", error });
  }
});

app.get('/Get_Produto/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const produto = await ProductModel.findById(id);
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (err) {
    console.error("Erro no servidor:", err); // Adicione log de erro
    res.status(500).json({ message: 'Erro ao buscar produto' });
  }
});

app.get('/produtos', async (req, res) => {
  try {
    const categoria = req.query.categoria?.toString().toLowerCase();

    const todos = await ProductModel.find();
    const filtrados = todos.filter(p => 
      p.categoria.toLowerCase() === categoria
    );

    res.status(200).json(filtrados);
  } catch (error) {
    console.error("Erro na rota /produtos:", error);
    res.status(500).json({ message: "Erro ao buscar produtos", error });
  }
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