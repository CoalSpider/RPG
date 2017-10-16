var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");

// set up keyboard
var keyBoard = new Keyboard();
keyBoard.listenForEvents();

var player = new Player();

var barrel = new Barrel();

var bullets = [];
var enemies = [];

var points = fillPathCircle();
var path = new Path(points, Interpolator.catmullRom, true);

var old = Date.now();
const distSqrd = 12 * 12;
function update() {
    if (Date.now() - old > 1000) {
        var x = canvas.width / 2;
        var y = canvas.height / 2;
        var hp = 2;
        var speed = 0.25;
        if (Math.random() < 0.1) {
            // spawn chaser
            hp = 20;
            speed = 3;
        } else {
            
        }
        var e = new Enemy(x, y, hp, speed);
        enemies.push(e);
        old = Date.now();
    }
    player.update(path);
    for (var i = 0; i < bullets.length; i++) {
        bullets[i].update();
    }
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].update();
    }

    // brute force check every bullet agianst every enemy
    for (var i = 0; i < bullets.length; i++) {
        var b = bullets[i];
        for (var j = 0; j < enemies.length; j++) {
            var e = enemies[j];
            var dx = b.x - e.x;
            var dy = b.y - e.y;
            var lenSqrd = dx * dx + dy * dy;
            if (lenSqrd < distSqrd) {
                bullets.splice(bullets.indexOf(b), 1);
                e.hp -= 1;
                if (e.hp <= 0) {
                    enemies.splice(enemies.indexOf(e), 1);
                }
                i -= 1;
                break;
            }
        }
    }
}

function draw() {
    gc.clearRect(0, 0, canvas.width, canvas.height);
    gc.strokeStyle = "black";
    gc.strokeRect(0, 0, canvas.width, canvas.height);
    player.draw();
    barrel.draw();
    for (var i = 0; i < bullets.length; i++) {
        bullets[i].draw();
    }
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].draw();
    }

    gc.beginPath();
    for (var i = 0; i < path.points.length; i++) {
        var p = path.points[i];
        gc.arc(p.x, p.y, 2, 0, Math.PI * 2, false);
    }
    gc.closePath();
    gc.stroke();
}

function mainLoop() {
    update();
    draw();
}

// calls 60 times a second
setInterval(mainLoop, 1000 / 60);