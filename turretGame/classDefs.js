class AxisRectBounds {
    constructor(halfWidth, halfHeight) {
        this.halfWidth = halfWidth;
        this.halfHeight = halfHeight;
        /* centered on origin, counter-clock-wise, ordering */
        this.basePoints = [
            new Point(-this.halfWidth, -this.halfHeight),
            new Point(-this.halfWidth, +this.halfHeight),
            new Point(+this.halfWidth, +this.halfHeight),
            new Point(+this.halfWidth, -this.halfHeight),
        ];
    }

    getPoints(translation) {
        var newPoints = [];
        var len = this.basePoints.length;
        for (var i = 0; i < len; i++) {
            var p = basePoints[i];
            newPoints.push(
                new Point(p.x + translation.x, p.y + translation.y)
            );
        }
        return newPoints;
    }
}

class RectBounds extends AxisRectBounds {
    constructor(halfWidth, halfHeight, angleRad, shift) {
        super(halfWidth, halfHeight);
        this.angleRad = angleRad;
        if (shift != undefined) {
            for (var i = 0, j = this.basePoints.length; i < j; i++) {
                this.basePoints[i].x += shift.x;
                this.basePoints[i].y += shift.y;
            }
        }
    }

    getPoints(translation) {
        var sin = Math.sin(this.angleRad);
        var cos = Math.cos(this.angleRad);
        /* counter-clock-wise order */
        var newPoints = [];
        for (var i = 0; i < this.basePoints.length; i++) {
            /* points centered around origin */
            var p = this.basePoints[i];
            /* rotate */
            var nX = (p.x * cos) - (p.y * sin);
            var nY = (p.x * sin) + (p.y * cos);
            /* translate */
            nX += translation.x;
            nY += translation.y;
            /* add to new points arr */
            newPoints.push(new Point(nX, nY));
        }
        return newPoints;
    }
}

class CircleBounds {
    constructor(radius) {
        this.radius = radius;
    }
}

class Entity {
    constructor(x, y, bounds, color) {
        this.x = x;
        this.y = y;
        this.bounds = bounds;
        this.color = color;
    }

    update() {
        /* empty */
    }

    draw(gc) {
        gc.beginPath();
        gc.strokeStyle = this.color;
        if (this.bounds instanceof CircleBounds) {
            gc.arc(this.x, this.y, this.bounds.radius, 0, Math.PI * 2);
        } else if (this.bounds instanceof RectBounds) {
            var pnts = this.bounds.getPoints(new Point(this.x, this.y));
            var len = pnts.length;
            gc.moveTo(pnts[0].x, pnts[0].y);
            for (var i = 1; i < len; i++) {
                gc.lineTo(pnts[i].x, pnts[i].y);
            }
            gc.lineTo(pnts[0].x, pnts[0].y);
        } else if (this.bounds instanceof AxisRectBounds) {
            /* strokeRect draws from top left we want to center the drawing */
            gc.strokeRect(this.x - this.halfWidth, this.y - this.halfHeight, this.halfWidth * 2, this.halfHeight * 2);
        } else {
            throw new Error("unknown bounds");
        }
        gc.stroke();
        gc.closePath();
    }
}

class Mob extends Entity {
    constructor(x, y, bounds, color, velocity, hp) {
        super(x, y, bounds, color);
        this.velocity = velocity;
        this.hp = hp;
    }

    update() {
        super.update();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class MobBuilder {
    static setVelocity(startVel, speed) {
        var len = Math.sqrt(startVel.x * startVel.x + startVel.y * startVel.y);
        startVel.x /= len;
        startVel.y /= len;
        startVel *= speed;
        startVel *= speed;
    }

    static runner(x, y) {
        /* runs in random direction */
        var rX = Math.random() * ((Math.random() < 0.5) ? -1 : 1);
        var rY = Math.random() * ((Math.random() < 0.5) ? -1 : 1);
        var velocity = new Point(rX,rY);
        MobBuilder.setVelocity(velocity, 0.25);
        var bounds = new CircleBounds(10);
        var color = rgb(255, 0, 0);
        var hp = 2;
        return new Mob(x, y, bounds, color, velocity, hp);
    }

    static chaser(x, y, target) {
        /* chases target */

    }

    static darter(x, y) {
        /* darts twords target in straight line */
    }

    static brownian(x, y) {
        /* random walk */
    }

    static mage(x, y) {
        /* teleports around does not move */
        /* can change enemy type to any other type except a mage */
    }

    static priest(x, y) {
        /* static */
        /* heals others */
    }

    static fatty(x, y) {
        /* big mob that sits on track */
    }

    static spinner(x, y) {
        /* spins in circle around target */
    }
}

class TurretBase extends Entity {
    constructor(x, y, path) {
        super(x,y,new RectBounds(16, 16, 0),rgb(0, 0, 0));
        this.path = path;
        this.barrel = new Barrel(this);
        this.fireTime = Date.now();
    }

    update() {
        super.update();
        if (keyBoard.isDown(KeyCode.LEFT_ARROW)) {
            this.bounds.angleRad -= 0.025;
        }
        if (keyBoard.isDown(KeyCode.RIGHT_ARROW)) {
            this.bounds.angleRad += 0.025;
        }
        if (keyBoard.isDown(KeyCode.DOWN_ARROW)) {
            this.path.backward();
        }
        if (keyBoard.isDown(KeyCode.UP_ARROW)) {
            this.path.forward();
        }
        if (keyBoard.isDown(KeyCode.W)) {
            if (Date.now() - this.fireTime > 100) {
                this.barrel.fire();
                this.fireTime = Date.now();
            }
        }
        var pnt = this.path.currentPoint;
        this.x = pnt.x;
        this.y = pnt.y;
    }
}

class Barrel extends Entity {
    constructor(turretBase) {
        super(
            turretBase.x, 
            turretBase.y, 
            new RectBounds(24, 4, 0, new Point(turretBase.bounds.halfWidth,0)), 
            rgb(0, 255, 0));
        this.turretBase = turretBase;
    }

    getBarrelEnd() {
        var sin = Math.sin(this.bounds.angleRad);
        var cos = Math.cos(this.bounds.angleRad);
        var nX = this.bounds.halfWidth * cos;
        var nY = this.bounds.halfWidth * sin;
        // shift 10 pixels out
        nX += this.x + cos*10;
        nY += this.y + sin*10;
        return new Point(nX, nY);
    }

    fire() {
        var barrelEnd = this.getBarrelEnd();
        var dx = Math.cos(this.bounds.angleRad) * 10;
        var dy = Math.sin(this.bounds.angleRad) * 10;
        bullets.push(new Bullet(barrelEnd.x, barrelEnd.y, dx, dy));
    }

    update() {
        super.update();
        this.x = this.turretBase.x;
        this.y = this.turretBase.y;
        this.bounds.angleRad = this.turretBase.bounds.angleRad;
    }
}

class Bullet extends Mob {
    constructor(x, y, velX, velY) {
        super(x, y, new CircleBounds(4), rgb(0, 0, 0), new Point(velX, velY), 1);
    }

    update() {
        super.update();
        // remove if our of bounds
        if (this.x < 0 || this.y < 0 || this.x > canvas.width || this.y > canvas.height || this.hp <= 0) {
            bullets.splice(bullets.indexOf(this), 1);
        }
    }
}
/*

class Movement {
    constructor(mob, speed) {
        this.mob = mob;
        // default movement is static
        this.vx = 0;
        this.vy = 0;
        this.speed = speed;
    }

    move() {
        this.mob.x += this.vx * this.speed;
        this.mob.y += this.vy * this.speed;
    }
}

class RandomMovement extends Movement {
    constructor(mob, speed) {
        super(mob, speed);
        this.vx = Math.random();
        this.vx *= (Math.random() > 0.5) ? -1 : 1;
        this.vy = Math.random();
        this.vy *= (Math.random() > 0.5) ? -1 : 1;
        var len = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.vx /= len;
        this.vy /= len;
    }
}

class ChaseMovement extends Movement {
    constructor(mob, speed, target) {
        super(mob, speed);
        this.target = target;
    }

    move() {
        this.vx = this.target.x - this.mob.x;
        this.vy = this.target.y - this.mob.y;
        var len = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.vx /= len;
        this.vy /= len;

        super.move();
    }
} */