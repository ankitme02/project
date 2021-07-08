if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}


const express = require('express')
const app = express();
const path = require('path');
const bcrypt = require('bcrypt')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const mongoose = require('mongoose');
const passport=require('passport');
app.set('views', path.join(__dirname, 'views'));
app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
const initializePassport = require('./passport');

const Task = require('./models/task');
const dbUrl=process.env.dbUrl;
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true,useUnifiedTopology:true,useFindAndModify:false,useCreateIndex:true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("connected to MongoDB");
});
app.use(methodOverride('_method'));
const users = [];

initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)
app.use(passport.initialize())
app.use(passport.session());
const secret="TheSecretIssecret";
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

 app.get('/tasks/new',checkAuthenticated,(req, res) => {
      res.render('new.ejs');
  })
  
  app.post('/tasks',checkAuthenticated,async (req, res) => {
      const newTask = new Task(req.body);
      await newTask.save();
      res.redirect(`/tasks/${newTask._id}`)
  })
  
  app.get('/tasks/:id',checkAuthenticated,async (req, res) => {
      const { id } = req.params;
      const task = await Task.findById(id);
      res.render('show.ejs', { task });
  })
  
  app.get('/tasks/:id/edit',checkAuthenticated,async (req, res) => {
      const { id } = req.params;
      const task = await Task.findById(id);
      res.render('edit.ejs', {task});
  })
  
  app.put('/tasks/:id',checkAuthenticated,async (req, res) => {
      const { id } = req.params;
      const task = await Task.findByIdAndUpdate(id, req.body, { runValidators: true, new: true });
      res.redirect(`/tasks/${task._id}`);
  })
  
  app.delete('/tasks/:id',checkAuthenticated, async (req, res) => {
      const { id } = req.params;
      const deletedtask = await Task.findByIdAndDelete(id);
      res.redirect('/');
  })
app.get('/', checkAuthenticated,async (req, res) => {
  const tasks = await Task.find({});
  res.render('index.ejs', {tasks,name: req.user.name })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}
const port=process.env.PORT||3000;
app.listen(port,()=>{
console.log("LISTENING TO PORT 3000");
})