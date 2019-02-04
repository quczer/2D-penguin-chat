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
    this.rotSpeed = 1.3;
    this.lastTimeShoot = Date.now();
    this.shootSpeed = 0.2;
    this.health = 100;
    this.isAlive = true;
    this.respawnCounter = 0;
    this.fragCtr = 0;

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

        let speed = 2;
        let angle = 0;
        if (mov.up) {
            if (mov.right)
                angle = Math.PI * 1.75;
            else if (mov.left)
                angle = Math.PI * 1.25;
            else
                angle = Math.PI * 1.5;

        } else if (mov.down) {
            if (mov.right)
                angle = Math.PI * 0.25;
            else if (mov.left)
                angle = Math.PI * 0.75;
            else
                angle = Math.PI * 0.5;
        } else {
            if (mov.right)
                angle = 0;
            else if (mov.left)
                angle = Math.PI;
            else
                speed = 0;
        }

        if (speed > 0)
            this.angle = (24 * this.angle + angle) / 25;
        this.x += speed * Math.cos(this.angle);
        this.y += speed * Math.sin(this.angle);
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