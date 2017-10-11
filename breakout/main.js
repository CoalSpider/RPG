// graphics context 2d
var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");

var dx = 2 * 60;
var dy = -2 * 60;
var pdx = 7 * 60;

var ballColors = ["white", "red", "orange", "yellow", "green", "blue", "violet"];

class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    update(dt) {
        // frame independent movement
        var idx = dx * (dt / 1000);
        var idy = dy * (dt / 1000);

        this.x += idx;
        this.y += idy;

        // bounce off walls
        if (this.x + idx < this.radius || this.x + idx > canvas.width - this.radius) {
            dx = -dx;
            this.color = ballColors[random(0, ballColors.length)];
        }
        if (this.y + idy < this.radius) {
            dy = -dy;
            this.color = ballColors[random(0, ballColors.length)];
        } else if (this.y + idy > canvas.height) {
            alert("GAME OVER");
            document.location.reload();
        }

        if (this.y >= paddle.y && this.x > paddle.x && this.x < paddle.x + paddle.width) {
            dy = -dy;
        }
    }

    draw() {
        gc.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        gc.fillStyle = this.color;
        gc.fill();
    }
}


class Paddle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    update(dt) {
        var idx = pdx * (dt / 1000);
        if (leftPressed) {
            this.x -= idx;
        }
        if (rightPressed) {
            this.x += idx;
        }
        // prevent movement past left side of canvas
        if (this.x < 0) {
            this.x = 0;
        }
        // prevent movement past right side of canvas
        if (this.x > canvas.width - this.width) {
            this.x = canvas.width - this.width;
        }
    }

    draw() {
        gc.fillStyle = "white";
        gc.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Brick {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        gc.strokeStyle="green";
        gc.strokeRect(this.x, this.y, this.width, this.height);
    }
}

var ball = new Ball(canvas.width / 2, canvas.height - 30, 10, "white");
var paddle = new Paddle(canvas.width / 2, canvas.height - 10, 75, 10);

var brickRowCount = 5;
var brickColumnCount = 10;
var brickWidth = canvas.width/brickColumnCount;
var brickHeight = 20;
var bricks = [];
for (var i = 0; i < brickColumnCount; i++) {
    for (var j = 0; j < brickRowCount; j++) {
        bricks.push(new Brick(i*brickWidth,j*brickHeight,brickWidth,brickHeight));
    }
}

function ballBrickCollision(){
    // ball axis-rect collision detection
    for(var i = 0; i < bricks.length; i++){
        var brick = bricks[i];
        if(ball.x > brick.x && ball.x < brick.x+brickWidth){
            if(ball.y > brick.y && ball.y < brick.y+brickHeight){
                dy = -dy;
                // remove the brick
                bricks.splice(i,1);
            }
        }
    }
}

/** randomizes between min and max (excludes max) */
function random(min, max) {
    var randomNum = Math.floor(Math.random() * (max - min)) + min
    return randomNum;
}

function clearCanvas() {
    gc.fillStyle = "black";
    gc.fillRect(0, 0, canvas.width, canvas.height);
}

var oldTime = -1;
var dt;
function draw() {
    if (oldTime == undefined) {
        oldTime = new Date().getMilliseconds();
    }
    dt = new Date().getMilliseconds() - oldTime;
    // sanity check
    if (dt < 0) {
        dt = 0;
    }
    oldTime = new Date().getMilliseconds();

    ball.update(dt);
    paddle.update(dt);
    ballBrickCollision();

    gc.beginPath();

    clearCanvas();
    ball.draw();
    paddle.draw();
    for(var i = 0; i < bricks.length; i++){
        bricks[i].draw();
    }

    gc.closePath();
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
var rightPressed = false;
var leftPressed = false;
function keyDownHandler(e) {
    if (e.keyCode == 39) {
        rightPressed = true;
    } else if (e.keyCode == 37) {
        leftPressed = true;
    }
}
function keyUpHandler(e) {
    if (e.keyCode == 39) {
        rightPressed = false;
    } else if (e.keyCode == 37) {
        leftPressed = false;
    }
}
// calls 60 times a second
setInterval(draw, 1000 / 60);