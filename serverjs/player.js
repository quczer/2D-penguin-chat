const process = require('process');
function getLucky(min, max) {
    return Math.random() * (max - min) + min;
}

function Player(name, color) {
    this.name = name;
    this.x = getLucky(0 + 200, 1920 - 200);
    this.y = getLucky(0 + 200, 1200 - 200);
    this.speed = 200;
    this.lastTime = Date.now();
    this.color = color;
    this.lastChat= {
        data:'',
        killtime: 0
    }

    this.print = function (str) {
        console.log(`${str} ${this.x}, ${this.y}, ${this.name}`);
    }

    this.act = function (mov) {
        let speed = 10;
        this.x += speed * (mov.right ? (mov.left ? 0 : 1) : (mov.left ? -1 : 0));
        this.y += speed * (mov.down ? (mov.up ? 0 : 1) : (mov.up ? -1 : 0));
        return false;
    }
}


module.exports = {
    Player: Player
};