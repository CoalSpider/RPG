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
        var dx = Math.cos(player.rotationRad);
        var dy = Math.sin(player.rotationRad);
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
        //var speed = 5;
        if (keyBoard.isDown(KeyCode.LEFT_ARROW)) {
          //  this.x -= speed;
          this.rotationRad -= 0.1;
        }
        if (keyBoard.isDown(KeyCode.RIGHT_ARROW)) {
          //  this.x += speed;
          this.rotationRad += 0.1;
        }
        if (keyBoard.isDown(KeyCode.DOWN_ARROW)) {
        //    this.y += speed;
        path.backward();
        }
        if (keyBoard.isDown(KeyCode.UP_ARROW)) {
         //   this.y -= speed;
         
         path.forward();
        }/*
        if (keyBoard.isDown(KeyCode.A)) {
            this.rotationRad += 0.1;
        }
        if (keyBoard.isDown(KeyCode.D)) {
            this.rotationRad -= 0.1;
        }*/
        if (keyBoard.isDown(KeyCode.W)) {
            barrel.fire();
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
        gc.arc(this.x,this.y,this.colCircleRadius,0,Math.PI*2,false);
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
        if (this.x < 0 || this.y < 0 || this.x > canvas.width || this.y > canvas.height) {
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