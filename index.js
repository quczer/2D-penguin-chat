const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const socketIO = require('socket.io');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const user = require('./model/user');
const sha256 = require('js-sha256').sha256;
const playersModule = require('./serverjs/player');
let Player = playersModule.Player;

const app = express();
let userName;
let userColor;

const server = http.Server(app);
const io = socketIO(server);

app.set('view engine', 'ejs');
app.engine("html", ejs.renderFile);
app.set('views', './templates');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({ secret: "secret", resave: true, saveUninitialized: true }));
app.use(cookieParser());

app.set('port', 5000);

app.use(express.static(__dirname + '/static/'));
app.use(express.static(__dirname + '/browserjs/'));

app.get('/', (req, res) => {
    if (req.session.user == undefined) {
        res.redirect(302, "/login");
        return;
    }
    var model = { name: req.session.user.name, color: req.session.user.color };
    console.log(model);
    res.render('index.html', model);
});

app.get('/register', (req, res) => {
    res.render('register.html', { nametaken: false, emptyName: false, emptyPassword: false});
});

app.post('/register', (req, res) => {
    if (req.body.login) {
        res.redirect(302, '/login');
        return;
    }
    let n = req.body.name;
    let p = req.body.password;
    let c = req.body.color;
    if (n == ""|| p == "" || user.get(n) != null) {
        res.render('register.html', { nametaken: (user.get(n) != null), emptyName: (n == ""), emptyPassword: (p == "")});
        return;
    }
    user.create(n, p, c);
    res.end(`<b>Congrats ${n}, you are registered! Your password is ${p}<br>
    <form action= "/login">
    <input type="submit" name="ref" value="Go to log in menu"></form></b>`);
});

app.get('/login', (req, res) => {
    res.render('login.html', { wrong: false });
});

app.post('/login', (req, res) => {
    if (req.body.guest) {
        res.redirect(302, '/guest');
        return;
    }
    if (req.body.register) {
        res.redirect(302, '/register');
        return;
    }
    let n = req.body.name;
    let p = req.body.password;
    u = user.get(n);
    if (u == null || sha256(p) !== u.hash) {
        res.render('login.html', { wrong: true });
        return;
    }
    req.session.user = u;
    userName = u.name;
    userColor = u.color;
    console.log(`${req.session.user};${userName};${userColor}`);
    res.redirect(302, '/');
});

app.get('/guest', (req, res) => {
    req.session.user = user.anon();
    userName = req.session.user.name;
    res.redirect(302, '/');
});

app.use((req, res, next) => {
    res.end(`404: ${req.url} not found\n`);
});

server.listen(app.get('port'), function () {
    console.log(`server created on port ${app.get('port')}`);
});

function addNews(socket, msg) {
    socket.emit('news', msg);
}

let players = {};
let disconnectedTmp = [];

io.on('connection', function (socket) {
    console.log('someone connected, show him da wey brotherz');
    socket.on('new_player', function (data) {
        players[socket.id] = new Player(userName, userColor,160,1951,330,853);
        players[socket.id].print('New player');
        addNews(socket, `${players[socket.id].name} connected!`);
        socket.emit('playerdata', userName, userColor);
    });
    socket.on('movement', function (data) {
        let res = players[socket.id].act(data);
        if (res !== false)
            io.sockets.emit('news', res);
    });
    socket.on('disconnect', function() {
        addNews(socket, `${players[socket.id].name} disconnected!`);
        disconnectedTmp.push(`${players[socket.id].name} disconnected!`);
        delete players[socket.id];
    });
    socket.on('chat', function(data, killtime) {
      data = data.trim();
      players[socket.id].lastChat.data = data;
      players[socket.id].lastChat.killtime = killtime;
      if (data == '') return;
    
    });
});

setInterval(function() {
    let updatedPlayers = [];
    for(let id in players){
        let p = players[id];
        updatedPlayers.push({
            "name": p.name,
            "x": p.x,
            "y": p.y,
            "lastChat": p.lastChat,
            "color": p.color
        });
    }

    io.sockets.emit('state', {"players": updatedPlayers});
    for(var id in disconnectedTmp)
        io.sockets.emit('news', disconnectedTmp[id]);
    disconnectedTmp = [];
}, 1000 / 60);