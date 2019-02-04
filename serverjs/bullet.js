function Bullet(_x, _y, _angle, _speed, owner){
    this.x = _x;
    this.y = _y;
    this.speed = _speed;
    this.angle = _angle;
    this.owner = owner;
    this.dmg = 5;
    this.lastTime = Date.now();


    this.print = function(str){
        console.log(`${str} ${this.x}, ${this.y}, ${this.name}`);
    }

    this.act = function(){
        let dt = (Date.now() - this.lastTime)/1000.0;
        this.lastTime = Date.now();
        this.x += this.speed*dt*Math.cos(this.angle);
        this.y += this.speed*dt*Math.sin(this.angle);
    }
} 


module.exports = {
    Bullet: Bullet
};