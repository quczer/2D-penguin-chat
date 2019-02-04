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
const bulletsModule = require('./serverjs/bullet');
let Bullet = bulletsModule.Bullet;

const app = express();
let userName;
let playerCtr=0;

const server = http.Server(app);
const io = socketIO(server);

app.set('view engine', 'ejs');
app.engine("html", ejs.renderFile);
app.set('views', './templates');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
    //store: new FileStore({path: "./sessions", logFn: function(){}}),
    secret: "pls send help", resave: true, saveUninitialized: true}));
app.use(cookieParser());

app.set('port', 5000);

app.use(express.static(__dirname + '/static/'));
app.use(express.static(__dirname + '/browserjs/'));

app.get('/', (req, res) => {
  if (req.session.user == undefined) {
    res.redirect(302, "/login");
    return;
  }
  var model = {name: req.session.user.name};
  res.render('index.html', model);
});

app.get('/register', (req, res) => {
  res.render('register.html', {nametaken:false});
});

app.post('/register', (req, res) => {
    let n = req.body.name;
    let p = req.body.password;
    if (user.get(n) != null) {
        res.render('register.html', {nametaken: true});
        return;
    }
    user.create(n, p);
    res.end(`<h1>Congrats ${n}, you are registered! Your password is ${p}</h1>`);
});

app.get('/login', (req, res) => {
  res.render('login.html', {wrong:false});
});

app.post('/login', (req, res) => {
  if (req.body.guest) {
    res.redirect(302, '/guest');
    return;
  }
  let n = req.body.name;
  let p = req.body.password;
  u = user.get(n);
  if (u == null || sha256(p) !== u.hash) {
    res.render('login.html', {wrong:true});
    return;
  }
  req.session.user = u;
  userName=u.name;
  console.log(`${req.session.user};${userName}`);
  res.redirect(302, '/');
});

app.get('/guest', (req, res) => {
  req.session.user = user.anon();
  userName=req.session.user.name;
  res.redirect(302, '/');
});

app.use((req,res,next) => {
  res.end(`404: ${req.url} not found\n`);
});

server.listen(app.get('port'), function(){
  console.log(`server created on port ${app.get('port')}`);
});

function addNews(socket, msg){
    socket.emit('news', msg);
}

let players = {};
let disconnectedTmp=[];
let bullets = [];

function spawnBullet(socket, plane){
    //socket.emit('new_bullet', newBullet);
    bullets.push(new Bullet(plane.x, plane.y, plane.angle, 1000, plane.ctr));
}

io.on('connection', function(socket) {
    console.log('someone connected, show him da wey brotherz');
    socket.on('new_player', function(data) {
        //console.log(`new_player ${socket.id}`);
        players[socket.id] = new Player(userName, playerCtr++);
        players[socket.id].print('New player');
        addNews(socket, `${players[socket.id].name} connected!`);
        socket.emit('playername', userName);
    });
    socket.on('movement', function(data) {
        let res = players[socket.id].act(data);
        if(res !== false)
            io.sockets.emit('news', res);
        if(data.space && players[socket.id].isAlive && players[socket.id].tryToShoot()){
            spawnBullet(socket, players[socket.id]);
        }
    });
    socket.on('disconnect', function() {
        //console.log(`${players[socket.id].name} disconnected!`);
        //addNews(socket, `${players[socket.id].name} disconnected!`);
        disconnectedTmp.push(`${players[socket.id].name} disconnected!`);
        delete players[socket.id];
    });
    socket.on('chat', function(data) {
      data = data.trim();
      if (data == '') return;
      
      console.log(players[socket.id].name + ': ' + data);
      io.sockets.emit('chat', {
        name: players[socket.id].name,
        message: data,
      });
    });
});

function testCollision(player, bullet){
    return (player.x-bullet.x)*(player.x-bullet.x)+
            (player.y-bullet.y)*(player.y-bullet.y) <= 2134+1673;
}

setInterval(function() {
    for(let id = bullets.length-1; id >= 0; id--){
        if(bullets[id].x < 50 || bullets[id].x > 1920 + 50
            || bullets[id].y < 50 || bullets[id].y > 1200 + 50)
            bullets.splice(id, 1);
        else
            bullets[id].act();
    }

    for(pId in players){
        for(let bId = bullets.length-1; bId >= 0; bId--){
            let p = players[pId];
            let b = bullets[bId];
            if(p.isAlive && b.owner !== p.ctr && testCollision(p, b)){
                p.health -= b.dmg;
                console.log(`${p.name} got shot`);
                
                if(p.health <= 0){
                    p.isAlive=false;
                    p.respawnCounter=0;
                    p.health=100;
                    for(pId2 in players){
                        let p2 = players[pId2];
                        if(p2.ctr === b.owner){
                            io.sockets.emit('news', `${p2.name} pwned ${p.name}`);
                            p2.fragCtr++;
                            p.fragCtr--;
                        }
                    }
                }

                bullets.splice(bId, 1);
            }
        }
    }

    let reducedPlayers = [];
    for(let id in players){
        let p = players[id];
        reducedPlayers.push({
            "name": p.name,
            "x": p.x,
            "y": p.y,
            "angle": p.angle,
            "health": p.health,
            "isAlive": p.isAlive,
            "respawnCounter":p.respawnCounter,
            "fragCtr": p.fragCtr
        });
    }

    let reducedBullets = [];
    for(let id in bullets){
        let b = bullets[id];
        reducedBullets.push({
            "x": b.x,
            "y": b.y,
            "angle": b.angle
        });
    }

    io.sockets.emit('state', {"players": reducedPlayers, "bullets": reducedBullets});
    for(var id in disconnectedTmp)
        io.sockets.emit('news', disconnectedTmp[id]);
    disconnectedTmp = [];
}, 1000 / 60);