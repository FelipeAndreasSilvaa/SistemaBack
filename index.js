require('dotenv').config(); // Isso precisa estar no topo do seu arquivo

const express = require('express')
const { default: mongoose } = require('mongoose')
const cors = require('cors')
const session = require('express-session')
const multer = require('multer')
const fs = require("fs");
const path = require('path')
const MongoStore = require('connect-mongo');



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
    origin: function (origin, callback) {
      const allowed = [
        "http://localhost:3000",
        "https://ecommerce-shop-git-main-felipeandreassilvaas-projects.vercel.app",
        "ecommerce-shop-nmsyt39dk-felipeandreassilvaas-projects.vercel.app"
      ];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }));
  

  
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
  secret: 'seuSegredoAqui',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 60 * 60 * 24
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // false local, true prod
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.post('/register', async (req, res) => {
  console.log("📥 [Register] Dados recebidos:", req.body);
  try {
    const user = await UserModel.create(req.body);
    console.log("✅ [Register] Usuário criado:", user);
    res.json(user);
  } catch (err) {
    console.error("❌ [Register] Erro ao registrar:", err);
    res.status(500).json({ message: "Erro ao registrar usuário", error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    console.log("📥 [Login] BODY:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("⚠️ [Login] Campos faltando");
      return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
    }

    const user = await UserModel.findOne({ email });
    console.log("🔍 [Login] Usuário encontrado:", user);

    if (!user) {
      console.log("❌ [Login] Usuário não encontrado");
      return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
    }

    if (user.password !== password) {
      console.log("❌ [Login] Senha incorreta");
      return res.status(401).json({ success: false, message: 'Senha incorreta' });
    }

    req.session.user = {
      name: user.name,
      email: user.email
    };

    console.log("✅ [Login] Login bem-sucedido:", req.session.user);
    return res.json({ success: true, name: user.name });

  } catch (error) {
    console.error('❌ [Login] Erro no login:', error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
});

app.post("/Add_Produto", upload.single("imagem"), async (req, res) => {
  console.log("📥 [Add_Produto] Dados recebidos:", req.body);
  console.log("📥 [Add_Produto] Arquivo recebido:", req.file);
  try {
      const { name, categoria, preco } = req.body;
      const imagem = req.file ? `/uploads/${req.file.filename}` : "";

      const novoProduto = new ProductModel({ name, categoria, preco, imagem });
      await novoProduto.save();

      console.log("✅ [Add_Produto] Produto criado:", novoProduto);
      res.status(201).json({ message: "Produto adicionado com sucesso", produto: novoProduto });
  } catch (error) {
      console.error("❌ [Add_Produto] Erro ao adicionar produto:", error);
      res.status(500).json({ message: "Erro ao adicionar produto", error });
  }
});

app.get('/Get_Produto', async (req, res) => {
  console.log("📥 [Get_Produto] Requisição recebida");
  try {
    const produtos = await ProductModel.find();
    console.log("✅ [Get_Produto] Produtos encontrados:", produtos.length);
    res.status(200).json(produtos);            
  } catch (error) {
    console.error("❌ [Get_Produto] Erro:", error);
    res.status(500).json({ message: "Erro ao buscar o produto", error });
  }
});

app.get('/Get_Produto/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`📥 [Get_Produto/:id] Requisição para produto ID: ${id}`);
  try {
    const produto = await ProductModel.findById(id);
    if (!produto) {
      console.log("⚠️ [Get_Produto/:id] Produto não encontrado");
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    console.log("✅ [Get_Produto/:id] Produto encontrado:", produto);
    res.json(produto);
  } catch (err) {
    console.error("❌ [Get_Produto/:id] Erro no servidor:", err);
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
  console.log("[Session] Verificando sessão atual");
  if (req.session.user) {
    console.log("[Session] Sessão ativa:", req.session.user);
    res.json({
      loggedIn: true,
      user: {
        name: req.session.user.name,
        email: req.session.user.email
      }
    });
  } else {
    console.log("[Session] Nenhuma sessão ativa");
    res.json({ loggedIn: false });
  }
});;

app.post('/logout', (req, res) => {
  console.log("[Logout] Pedido de logout recebido");
  req.session.destroy(err => {
    if (err) {
      console.error("[Logout] Erro ao fazer logout:", err);
      return res.status(500).json({ message: "Erro ao fazer logout" });
    }
    res.clearCookie('connect.sid');
    console.log("[Logout] Logout realizado com sucesso");
    res.json({ success: true, message: "Logout realizado com sucesso" });
  });
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))