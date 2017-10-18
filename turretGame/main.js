var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");

// set up keyboard
var keyBoard = new Keyboard();
keyBoard.listenForEvents();

var points = fillPathCircle();
var path = new Path(points, Interpolator.catmullRom, true);
var player = new TurretBase(canvas.width/2,canvas.height/2,path);

var bullets = [];
var enemies = [];

var old = Date.now();
const distSqrd = 12 * 12;
function update() {
    if (Date.now() - old > 1000) {
        var x = canvas.width/2;
        var y = canvas.height/2;
        var rand = Math.random();
        if(rand < 0.25){
            enemies.push(MobBuilder.chaser(x,y,player));
        } else if(rand < 0.35){
            enemies.push(MobBuilder.darter(x,y,player));
        } else {
            enemies.push(MobBuilder.runner(x,y));
        }
        old = Date.now();
    }
    player.update();
    player.barrel.update();
    for (var i = 0; i < bullets.length; i++) {
        bullets[i].update();
    }
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].update();
        var e = enemies[i];
        if(e.x < 0 || e.y < 0 || e.x > canvas.width || e.y > canvas.width){
            enemies.splice(i,1);
            i--;
        }
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
    player.draw(gc);
    player.barrel.draw(gc);
    for (var i = 0; i < bullets.length; i++) {
        bullets[i].draw(gc);
    }
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].draw(gc);
    }

    gc.beginPath();
    gc.strokeStyle = "purple";
    for (var i = 0; i < path.points.length; i++) {
        var p = path.points[i];
        gc.arc(p.x, p.y, 4, 0, Math.PI * 2, false);
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