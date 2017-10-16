/*TODO: box2d port, prismatic joint on barrel, revolute joint for base
etc... */
class Barrel {
    constructor() {
        this.halfWidth = 24;
        this.halfHeight = 4;
        this.basePoints = [
            new Vec2(-this.halfWidth, -this.halfHeight),
            new Vec2(-this.halfWidth, +this.halfHeight),
            new Vec2(+this.halfWidth, +this.halfHeight),
            new Vec2(+this.halfWidth, -this.halfHeight),
        ];
    }

    getPoly() {
        var sin = Math.sin(player.rotationRad);
        var cos = Math.cos(player.rotationRad);
        // counter-clock-wise order
        var newPoints = [];
        for (var i = 0; i < this.basePoints.length; i++) {
            var p = this.basePoints[i];
            // rotate
            var nX = (p.x * cos) - (p.y * sin);
            var nY = (p.x * sin) + (p.y * cos);
            // translate
            nX += player.x + player.halfWidth * cos;
            nY += player.y + player.halfHeight * sin;
            // add to new points arr
            newPoints.push(new Vec2(nX, nY));
            // TODO: figure out how to shift barrel over so we can have more than one
        }
        return newPoints;
    }

    getBarrelEnd() {
        var sin = Math.sin(player.rotationRad);
        var cos = Math.cos(player.rotationRad);
        // rotate midpoint new Vec2(halfWidth, 0);
        var nX = (this.halfWidth * cos);
        var nY = (this.halfWidth * sin);
        // translate
        nX += player.x + player.halfWidth * cos;
        nY += player.y + player.halfHeight * sin;

        return new Vec2(nX, nY);
    }

    fire() {
        var barrelEnd = this.getBarrelEnd();
        var dx = Math.cos(player.rotationRad) * 10;
        var dy = Math.sin(player.rotationRad) * 10;
        bullets.push(new Bullet(barrelEnd.x, barrelEnd.y, dx, dy));
    }

    draw() {
        gc.fillStyle = "blue";
        gc.strokeStyle = "blue";
        gc.beginPath();
        var points = this.getPoly();
        // move to first point
        gc.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            // draw line to next point
            gc.lineTo(points[i].x, points[i].y);
        }
        gc.closePath();
        gc.stroke();

        gc.beginPath();
        gc.strokeStyle = "red";
        var barrelEnd = this.getBarrelEnd();
        gc.arc(barrelEnd.x, barrelEnd.y, 10, 0, 2 * Math.PI);
        gc.closePath();

        gc.stroke();
    }
}
class Player {
    constructor() {
        this.rotationRad = 0;
        this.halfWidth = 16;
        this.halfHeight = 16;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.colCircleRadius = 8;
        // counter-clock-wise order
        this.basePoints = [
            new Vec2(-this.halfWidth, -this.halfHeight),
            new Vec2(-this.halfWidth, +this.halfHeight),
            new Vec2(+this.halfWidth, +this.halfHeight),
            new Vec2(+this.halfWidth, -this.halfHeight),
        ];

        this.fireTime = Date.now();
    }

    getPoly() {
        var sin = Math.sin(this.rotationRad);
        var cos = Math.cos(this.rotationRad);
        // counter-clock-wise order
        var newPoints = [];
        for (var i = 0; i < this.basePoints.length; i++) {
            var p = this.basePoints[i];
            // rotate
            var nX = (p.x * cos) - (p.y * sin);
            // replacing p.y with p.y creates a cool skew when rotating
            var nY = (p.x * sin) + (p.y * cos);
            // translate
            nX += this.x;
            nY += this.y;
            // add to new points arr
            newPoints.push(new Vec2(nX, nY));
        }
        return newPoints;
    }

    update(path) {
        if (keyBoard.isDown(KeyCode.LEFT_ARROW)) {
            this.rotationRad -= 0.025;
        }
        if (keyBoard.isDown(KeyCode.RIGHT_ARROW)) {
            this.rotationRad += 0.025;
        }
        if (keyBoard.isDown(KeyCode.DOWN_ARROW)) {
            path.backward();
        }
        if (keyBoard.isDown(KeyCode.UP_ARROW)) {
            path.forward();
        }
        if (keyBoard.isDown(KeyCode.W)) {
            if (Date.now() - this.fireTime > 100) {
                barrel.fire();
                this.fireTime = Date.now();
            }
        }
        var pnt = path.currentPoint;
        this.x = pnt.x;
        this.y = pnt.y;
    }

    draw() {
        gc.fillStyle = "black";
        gc.strokeStyle = "black";
        gc.beginPath();
        var points = this.getPoly();
        // move to first point
        gc.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            // draw line to next point
            gc.lineTo(points[i].x, points[i].y);
        }
        gc.closePath();
        gc.stroke();
        gc.arc(this.x, this.y, this.colCircleRadius, 0, Math.PI * 2, false);
        gc.fill();
    }
}


class Bullet {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
    }
    update() {
        this.x += this.dx;
        this.y += this.dy;
        if (this.x < 0 || this.y < 0 || this.x > canvas.width || this.y > canvas.height || this.hp <= 0) {
            bullets.splice(bullets.indexOf(this), 1);
        }
    }
    draw() {
        gc.beginPath();
        gc.fillStyle = "black";
        gc.arc(this.x, this.y, 4, 0, Math.PI * 2);
        gc.fill();
        gc.closePath();
    }
}

class Enemy {
    constructor(x, y, hp, speed) {
        this.x = x;
        this.y = y;
        this.hp = hp;
        this.movement = new RandomMovement(this,speed);
    }

    update() {
        if (this.movement != ChaseMovement) {
            // if mob has reached edge of screen
            if (this.x < 0 || this.y < 0 || this.x > canvas.width || this.y > canvas.height) {
                this.chase = true;
                this.health = 10;
                this.movement = new ChaseMovement(this,1,player);
            }
        }
        this.movement.move();
    }

    draw() {
        gc.beginPath();
        gc.fillStyle = "red";
        gc.arc(this.x, this.y, 8, 0, Math.PI * 2);
        gc.fill();
        gc.closePath();
    }
}

class Movement {
    constructor(mob,speed) {
        this.mob = mob;
        // default movement is static
        this.vx = 0;
        this.vy = 0;
        this.speed = speed;
    }

    move() {
        this.mob.x += this.vx*this.speed;
        this.mob.y += this.vy*this.speed;
    }
}

class RandomMovement extends Movement{
    constructor(mob,speed) {
        super(mob,speed);
        this.vx = Math.random();
        this.vx *= (Math.random() > 0.5) ? -1 : 1;
        this.vy = Math.random();
        this.vy *= (Math.random() > 0.5) ? -1 : 1;
        var len = Math.sqrt(this.vx*this.vx + this.vy * this.vy);
        this.vx /= len;
        this.vy /= len;
    }
}

class ChaseMovement extends Movement{
    constructor(mob, speed, target){
        super(mob,speed);
        this.target = target;
    }

    move(){
        this.vx = this.target.x - this.mob.x;
        this.vy = this.target.y - this.mob.y;
        var len = Math.sqrt(this.vx*this.vx + this.vy * this.vy);
        this.vx /= len;
        this.vy /= len;

        super.move();
    }
}