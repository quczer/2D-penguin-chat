const loadedImages = {};
let canvas;
let ctx;
let socket;
let username;
let usercolor;

const cSizeX = 1500;
const cSizeY = 650;
const cMarginX = 200;
const cMarginY = 450;
const bSizeX = 2111;
const bSizeY = 1013;
const nickOffset = 32;
const hBarMarginX = 20;
const hBarMarginY = 15;
const hBarWidth = 100;
const hBarHeigth = 10;
let viewPosX = 0;
let viewPosY = 0;
var movement = {
    up: false,
    down: false,
    left: false,
    right: false
};
var getScale = function (player) {
    return Math.max(0.30, 0.9 * player.y / bSizeY);
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
    let images = ['balloon1.png', 'bg2.jpg', 'pingu0.png','pingu1.png', 'pingu2.png', 'pingu3.png'];
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
    for (let id in state) {
        let player = state[id];
        img = loadedImages['pingu0.png'];
        switch (player.color) {
            case "1":
                img = loadedImages['pingu1.png'];
                break;
            case "2":
                img = loadedImages['pingu2.png'];
                break;
            case "3":
                img = loadedImages['pingu3.png'];
                break;
        }
        console.log(player.color, img);

        drawImage(img,
            player.x - viewPosX,
            player.y - viewPosY,
            getScale(player),
            0);


        if (player.lastChat.killtime > Date.now()) {
            drawImage(loadedImages['balloon1.png'],
                player.x - viewPosX+50 -150*getScale(player),
                player.y - viewPosY-60 - 200*getScale(player),
                0.1,
                0);

            ctx.font = "15px Comic Sans MS";
            ctx.fillStyle = "black";
            ctx.textAlign = "left";
            var x = player.x - viewPosX+50 -150*getScale(player)-55;
            var y = player.y -viewPosY - 200*getScale(player)-97;
            var lineheight = 15;
            var lines = player.lastChat.data.split('\n');
            for (var i = 0; i < lines.length; i++)
                ctx.fillText(lines[i], x, y + (i * lineheight));
        }

        ctx.font = "15px Comic Sans MS";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText('[' + player.name + ']', player.x - viewPosX, player.y - viewPosY + nickOffset);
    }
}

function drawImage(image, x, y, scale, rotation) {
    ctx.setTransform(scale, 0, 0, scale, x, y); // sets scale and origin
    ctx.rotate(rotation);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
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
    socket.on('playerdata', function (playername, playercolor) {
        username = playername;
        usercolor = playercolor;
    });

  //  socket.on('chat', receiveChat);

    document.getElementById('chat-input').
        addEventListener('keyup', function (event) {
            if (event.keyCode === 13) {
                document.getElementById('chat-submit').click();
            }
        });
}

function submitChat() {
    data = document.getElementById('chat-input').value;
    data = data.trim();
    tab = data.split(" ");
    text = "";
    let j = 0;
    temp = "";
    let i = 0;
    for (; i < tab.length; i++) {

        if (temp.length == 0 || (temp.length + tab[i].length < 15)) {
            temp += tab[i] + " "
        }
        else {
            if (j < 5) {
                text += temp + "\n";
                temp = "";
                j++;
                i--;
            }
            else {
                break;
            }
        }
    }
    if (i == tab.length)
        text += temp;

    document.getElementById('chat-input').blur();
    socket.emit('chat', text, Date.now() + 3000);
    document.getElementById('chat-input').value = '';
}


