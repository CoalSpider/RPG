var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");

// set up keyboard
var keyBoard = new Keyboard();
keyBoard.listenForEvents();

var points = fillPathCircle();
var path = new Path(points, Interpolator.catmullRom, true);
var player = new TurretBase(path, new Vec2(canvas.width / 2, canvas.height / 2));
var playerHealthMax = 10;
var playerHealth = 10;

var bullets = [];
var enemies = [];

var old = Date.now();
function spawnEnemy() {
    if (Date.now() - old > 1000) {
        var loc = new Vec2(canvas.width / 2, canvas.height / 2);
        var rand = Math.random();
        if (rand < 0.25) {
            enemies.push(EntityBuilder.build(ENTITY_ID.CHASER.value, loc, player));
        } else if (rand < 0.35) {
            enemies.push(EntityBuilder.buildDarter(loc, player));
        } else {
            enemies.push(EntityBuilder.buildRunner(loc));
        }
        old = Date.now();
    }
}

function updatePlayer() {
    player.update();
}

function updateBullets() {
    for (var i = 0; i < bullets.length; i++) {
        bullets[i].update();
        var x = bullets[i].position.x;
        var y = bullets[i].position.y;
        if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) {
            bullets.splice(i, 1);
            i -= 1;
        }
    }
}
function updateEnemies() {
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].update();
        var e = enemies[i];
        if (e.x < 0 || e.y < 0 || e.x > canvas.width || e.y > canvas.width) {
            enemies.splice(i, 1);
            i--;
        }
    }
}
function collisionEnemyBullet() {
    // brute force check every bullet agianst every enemy
    for (var i = 0; i < bullets.length; i++) {
        var b = bullets[i];
        for (var j = 0; j < enemies.length; j++) {
            var e = enemies[j];
            var collide = circleCircleCollision(b.position, 4, e.position, 10);
            if (collide) {
                bullets.splice(bullets.indexOf(b), 1);
                e.hp -= 1;
                if (e.hp <= 0) {
                    enemies.splice(enemies.indexOf(e), 1);
                    j -= 1;
                }
                i -= 1;
                break;
            }
        }
    }
}
function collisionEnemyPlayer() {
    // brute force check every enemy agianst the turret-base/player
    for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        var collide = circleBoxCollision(new Vec2(e.position.x, e.position.y), 10, new Vec2(player.position.x, player.position.y), player.bounds);
        if (collide) {
            playerHealth -= 1;
            enemies.splice(enemies.indexOf(e), 1);
            i -= 1;
            // TODO: iframe
        }
    }
}

function update() {
    spawnEnemy();
    updatePlayer();
    updateBullets();
    updateEnemies();
    collisionEnemyBullet();
    collisionEnemyPlayer();
}

function drawUI() {
    var ratio = Math.max(0, playerHealth / playerHealthMax);
    gc.fillStyle = "red";
    gc.fillRect(25, 25, canvas.width / 4, 50);
    gc.fillStyle = "green";
    gc.fillRect(25, 25, canvas.width / 4 * ratio, 50);
    gc.strokeStyle = "black";
    var lw = 5;
    gc.lineWidth = lw;
    gc.strokeRect(25 - lw / 2, 25 - lw / 2, canvas.width / 4 + lw, 50 + lw);
    gc.lineWidth = 1;
}

function drawCircleBounds(position, bounds){
    gc.arc(position.x, position.y, bounds.radius, 0, Math.PI * 2);
}

function drawRectBounds(position, bounds){
    var pnts = bounds.getPoints(position);
    gc.moveTo(pnts[0].x, pnts[0].y);
    for (var i = 1, j = pnts.length; i < j; i++) {
        gc.lineTo(pnts[i].x, pnts[i].y);
    }
    gc.lineTo(pnts[0].x, pnts[0].y);
}

function drawAxisRectBounds(position, bounds){
    var hw = bounds.halfWidth;
    var hh = bounds.halfHeight;
    gc.strokeRect(position.x -hw, position.y - hh, hw * 2, hh * 2);
}

function drawBounds(position, bounds) {
    gc.beginPath();
    if (bounds instanceof CircleBounds) {
        drawCircleBounds(position, bounds);
    } else if (bounds instanceof RectBounds) {
        drawRectBounds(position,bounds);
    } else if (bounds instanceof AxisRectBounds) {
        drawAxisRectBounds(position, bounds);
    } else {
        throw new Error("unknown bounds");
    }
    gc.closePath();
    gc.stroke();
}

function drawHPBar(entity, color, hpColor) {
    var hp = entity.hp;
    var maxHP = entity.maxHP;
    var x = entity.position.x;
    var y = entity.position.y;
    gc.beginPath();
    gc.fillStyle = hpColor;
    gc.arc(x, y, 9, 0, Math.PI * 2);
    gc.fill();
    gc.closePath();
    gc.beginPath();
    gc.fillStyle = color;
    var ratio = hp / maxHP;
    // pie slice style
    /*
    gc.moveTo(x,y);
    gc.arc(x,y, 9, 0, Math.PI * 2 * ratio, false);
    gc.lineTo(x,y); 
    */
    // energy style
    gc.arc(x, y, ratio * 10, 0, Math.PI * 2, false);
    gc.fill();
    gc.closePath();
}

function clearCanvas(){
    gc.clearRect(0, 0, canvas.width, canvas.height);
    gc.strokeStyle = "black";
    gc.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawEnemies(){
    for (var i = 0, j = enemies.length; i < j; i++) {
        var e = enemies[i];
        var pos = e.position;
        var bounds = e.bounds;
        var hpColor = undefined;
        var color = undefined;
        switch (e.id) {
            case 0: color = "black"; hpColor = "grey"; break;
            case 1: color = "red"; hpColor = "black"; break;
            case 2: color = "blue"; hpColor = "black"; break;
            case 3: color = "orange"; hpColor = "black"; break;
            case 4: color = "pink"; hpColor = "black"; break;
            case 5: color = "pink"; hpColor = "black"; break;
            case 6: color = "pink"; hpColor = "black"; break;
            case 7: color = "pink"; hpColor = "black"; break;
            case 8: color = "pink"; hpColor = "black"; break;
            default: throw new Error("unknown entity");
        }
        gc.strokeStyle = color;
        drawBounds(pos, bounds);
        if (e.hp != undefined) {
            drawHPBar(e, color, hpColor);
        }
    }
}

function drawBullets(){
    gc.strokeStyle = "black";
    for (var i = 0, j = bullets.length; i < j; i++) {
        var b = bullets[i];
        var x = b.position.x;
        var y = b.position.y;
        drawBounds(b.position, b.bounds);
    }
}

function drawPath(){
    gc.beginPath();
    gc.strokeStyle = "purple";
    for (var i = 0; i < path.points.length; i++) {
        var p = path.points[i];
        gc.arc(p.x, p.y, 4, 0, Math.PI * 2, false);
    }
    gc.closePath();
    gc.stroke();
}

function drawPlayer(){
    gc.strokeStyle = "black";
    drawBounds(player.position, player.bounds);
    drawBounds(player.barrel.position, player.barrel.bounds);
}

function draw() {
    clearCanvas();
    drawEnemies();
    drawBullets();
    drawPath();
    drawPlayer();
    drawUI();
}

function mainLoop() {
    if (playerHealth <= 0) {
        var cont = confirm("Continue?");
        if (cont) {
            playerHealth = 10;
            enemies.splice(0, enemies.length);
            bullets.splice(0, bullets.length);
        } else {
            document.location.reload();
        }
    } else {
        update();
        draw();
    }
}

// calls 60 times a second
setInterval(mainLoop, 1000 / 60);