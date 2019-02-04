const loadedImages = {};
let canvas;
let ctx;
let socket;
let username;
let bullets = [];
let playerColor = "rgb(179, 71, 0)";

const respawnTime = 7;
const planeScale = 0.1;
const bulletScale = 0.12;
const cSizeX = 1500;
const cSizeY = 650;
const cMarginX = 200;
const cMarginY = 150;
const bSizeX = 3600;
const bSizeY = 1800;
const nickOffset = 32;
const hBarMarginX = 20;
const hBarMarginY = 15;
const hBarWidth = 100;
const hBarHeigth = 10;
let viewPosX = 0;
let viewPosY = 0;
let newsArray = [];
let newsId = 0;
var lastCha
var movement = {
    up: false,
    down: false,
    left: false,
    right: false
};
var getScale = function(player){
    return Math.max(0.05, 0.25 * player.y/bSizeY);
}

document.addEventListener('keydown', function (event) {
    let chatInput =
        document.getElementById('chat-input');
    if (!(document.activeElement === chatInput))
        switch (event.keyCode) {
            case 32: // SPACE
                chatInput.focus();
                movement.left = movement.right = movement.up = movement.down = false;
                break;
            case 65: // A
                movement.left = true;
                break;
            case 87: // W
                movement.up = true;
                break;
            case 68: // D
                movement.right = true;
                break;
            case 83: // S
                movement.down = true;
                break;
        }
});

document.addEventListener('keyup', function (event) {
    
    switch (event.keyCode) {
        case 65: // A
            movement.left = false;
            break;
        case 87: // W
            movement.up = false;
            break;
        case 68: // D
            movement.right = false;
            break;
        case 83: // S
            movement.down = false;
            break;

    }
});

function prepareImages(imagesLoadedCB) {
    let images = ['balloon1.png', 'bg2.jpg', 'pingu1.png', 'pingu2.png', 'bullet.png', 'bullet2.png', 'bullet3.png', 'smoke.png'];
    let promiseArray = images.map(function (imgurl) {
        let prom = new Promise(function (resolve, reject) {
            let img = new Image();
            img.onload = function () {
                loadedImages[imgurl] = img;
                resolve();
            };
            img.src = imgurl;
        });
        return prom;
    });
    Promise.all(promiseArray).then(imagesLoadedCB);
}

function main() {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");

    prepareImages(onResourcesLoaded);
}

function onUpdate(state) {
    if (state === undefined || state === null)
        return;
    let myPenguin;
    for (let id in state) {
        if (username === undefined)
            myPenguin = state[0];
        else {
            if (state[id].name == username)
                myPenguin = state[id];
        }
    }
    if (myPenguin === undefined)
        return;

    // change viewPos
    viewPosX, cSizeX, cMarginX, myPenguin.x;
    if (myPenguin.x - viewPosX > cSizeX - cMarginX)
        viewPosX = myPenguin.x + cMarginX - cSizeX;
    if (myPenguin.x - viewPosX < cMarginX)
        viewPosX = myPenguin.x - cMarginX;
    if (myPenguin.y - viewPosY > cSizeY - cMarginY)
        viewPosY = myPenguin.y + cMarginY - cSizeY;
    if (myPenguin.y - viewPosY < cMarginY)
        viewPosY = myPenguin.y - cMarginY;

    // check borders
    if (viewPosX < 0)
        viewPosX = 0;
    if (viewPosX > bSizeX - cSizeX)
        viewPosX = bSizeX - cSizeX;
    if (viewPosY < 0)
        viewPosY = 0;
    if (viewPosY > bSizeY - cSizeY)
        viewPosY = bSizeY - cSizeY;
    ctx.drawImage(loadedImages['bg2.jpg'], -viewPosX, -viewPosY);
    let scoreArray = [];
    for (let id in state) {
        let player = state[id];
        scoreArray.push({
            "name": player.name,
            "frags": player.fragCtr
        });
        if (player.isAlive === false)
            continue;
        img = loadedImages['pingu1.png'];
        console.log(player);
        switch(player.color){
            case -1:
                img = loadedImages['pingu2.png'];
            break;
        }

        drawImage(img,
            player.x - viewPosX,
            player.y - viewPosY,
            getScale(player),
            player.angle);
            

        if (player.health >0)
            drawImage(loadedImages['balloon1.png'],
                player.x - viewPosX,
                player.y - viewPosY - 50 - getScale(player) * 900,
                0.1,
                0);
        if (player.health < 10)
            drawImage(loadedImages['smoke.png'],
                player.x - viewPosX,
                player.y - viewPosY,
                planeScale,
                Math.PI);

        ctx.font = "15px Comic Sans MS";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.fillText('[' + player.name + ']', player.x - viewPosX, player.y - viewPosY + nickOffset);
    }

    scoreArray.sort((a, b) => a.frags < b.frags);
    ctx.font = "15px Comic Sans MS";
    ctx.fillStyle = "green";
    ctx.textAlign = "left";
    let scoreTxt = "Top fighters:\n";
    ctx.fillText(scoreTxt, 5, 15);
    for (let pId in scoreArray) {
        if (pId > 5)
            break;
        scoreTxt = `${scoreArray[pId].name}: ${scoreArray[pId].frags}\n`;
        ctx.fillText(scoreTxt, 5, 30 + 15 * pId);
    }

    ctx.textAlign = "left";
    for (let nId in newsArray) {
        scoreTxt = `${newsArray[nId].news}\n`;
        console.log(scoreTxt);
        ctx.fillText(scoreTxt, 5, 30 + 75 + 15 * nId);
    }

}

function drawHud(myPenguin) {
    // ctx.fillStyle = '#808080';
    // ctx.fillRect(0, 0, cSizeX, 30);
    ctx.fillStyle = "black";
    ctx.fillRect(cSizeX - hBarMarginX - hBarWidth - 3, hBarMarginY - 3, hBarWidth + 6, hBarHeigth + 6);
    var grd = ctx.createLinearGradient(cSizeX - hBarMarginX - hBarWidth, 0, cSizeX - hBarMarginX - hBarWidth * (1 / 3), 0);
    grd.addColorStop(0, "red");
    grd.addColorStop(1, "green");
    ctx.fillStyle = grd;
    ctx.fillRect(cSizeX - hBarMarginX - hBarWidth, hBarMarginY, hBarWidth * (myPenguin.health / 100), hBarHeigth);
    ctx.font = "10px Comic Sans MS";
    ctx.fillStyle = "yellow";
    ctx.fillText('Health', cSizeX - hBarMarginX - hBarWidth + hBarWidth / 2, hBarMarginY);
};

function drawImage(image, x, y, scale, rotation) {
    ctx.setTransform(scale, 0, 0, scale, x, y); // sets scale and origin
    ctx.rotate(rotation);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function onNews(data) {
    let tmpNewsId = newsId++;
    newsArray.push({
        "news": data,
        "newsId": tmpNewsId
    });
    console.log(data);
    setTimeout(function () {
        for (let id in newsArray) {
            if (newsArray[id].newsId == tmpNewsId) {
                newsArray.splice(id, 1);
            }
        }
    }, 3000);
}

function onResourcesLoaded() {
    socket = io();
    socket.on('connect_error', function (m) { log("connect_error "); });
    socket.on('connect', function (m) {
        console.log("socket.io connection open");
        socket.emit('new_player', {});
        setInterval(function () {
            socket.emit('movement', movement);
        }, 1000 / 60);
    });

    socket.on('state', function (data) {
        onUpdate(data.players, data.bullets);
    });

    socket.on('news', function (data) {
        onNews(data);
    });

    socket.on('playername', function (data) {
        username = data;
    });

    socket.on('chat', receiveChat);
    document.getElementById('chat-input').
        addEventListener('keyup', function (event) {
            if (event.keyCode === 13) {
                document.getElementById('chat-submit').click();
            }
        });
}

function submitChat() {
    data = document.getElementById('chat-input').value;
    document.getElementById('chat-input').blur();
    socket.emit('chat', data, Date() + 3000);
    document.getElementById('chat-input').value = '';
}

function receiveChat(data) {
    document.getElementById('chat').innerHTML +=
        '<b style="color: ' + playerColor + '">' + data.name + '</b>: ' + data.message + '<br>';
    var elem = document.getElementById('chat');
    elem.scrollTop = elem.scrollHeight;
}
