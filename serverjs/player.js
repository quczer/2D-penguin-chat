const process = require('process');

const respawnTime = 7;

function getLucky(min, max) {
    return Math.random() * (max - min) + min;
}

function Player(name, ctr) {
    this.ctr = ctr;
    this.name = name;
    this.x = getLucky(0 + 200, 1920 - 200);
    this.y = getLucky(0 + 200, 1200 - 200);
    this.angle = getLucky(0, 3.1415 * 2);
    this.speed = 200;
    this.lastTime = Date.now();
    this.lastTimeShoot = Date.now();
    this.shootSpeed = 0.2;
    this.health = 100;
    this.isAlive = true;
    this.lastChat= {
        data:'',
        killtime: 0
    }

    this.print = function (str) {
        console.log(`${str} ${this.x}, ${this.y}, ${this.name}`);
    }

    this.act = function (mov) {
        let dt = (Date.now() - this.lastTime) / 1000.0;
        this.lastTime = Date.now();

        if (this.isAlive === false) {
            if (this.respawnCounter <= respawnTime) {
                this.respawnCounter += dt;
                return false;
            }
            else {
                //console.log(`respawn ${this.name}`);
                this.respawnCounter = 0;
                this.isAlive = true;
                this.x = getLucky(0 + 200, 1920 - 200);
                this.y = getLucky(0 + 200, 1200 - 200);
                this.angle = getLucky(0, 3.1415 * 2);
                return `${this.name} has respawned`;
            }
        }

        let speed = 10;
        let angle = 0;
       
        this.angle = Math.PI * 0.5;
        this.x += speed * (mov.right ? (mov.left ? 0 : 1) : (mov.left ? -1 : 0));
        this.y += speed * (mov.down ? (mov.up ? 0 : 1) : (mov.up ? -1 : 0));
        return false;
    }

    this.tryToShoot = function () {
        let dt = (Date.now() - this.lastTimeShoot) / 1000.0;
        if (dt > this.shootSpeed) {
            this.lastTimeShoot = Date.now();
            return true;
        }
        return false;
    }
}


module.exports = {
    Player: Player
};