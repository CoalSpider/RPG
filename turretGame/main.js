class Level {
    constructor(path = Path, spawnPoints) {
        this.path = path;
        this.spawnPoints = spawnPoints;
    }
}

var canvas = document.getElementById("canvas");

var Level1_Division = new Level(
    new Path(
        [
            new Vec2(canvas.width / 2, 25),
            new Vec2(canvas.width / 2, canvas.height - 25)
        ],
        Interpolator.linear,
        false,
    ),
    // list of spawners
    [
        new Spawner(
            new Vec2(canvas.width / 4, canvas.height / 2),
            10,
            2000,
            { runner: 1 }
        ),
        new Spawner(
            new Vec2(canvas.width * (3 / 4), canvas.height / 2),
            10,
            2000,
            { runner: 1 }
        )
    ]
);

var Level2_Horizon = new Level(
    new Path(
        [
            new Vec2(25, canvas.height / 2),
            new Vec2(canvas.width - 25, canvas.height / 2)
        ],
        Interpolator.linear,
        false
    ),
    // list of spawners
    [
        new Spawner(
            new Vec2(canvas.width / 2, canvas.height / 4),
            10,
            2000,
            { runner: 1 }
        ),
        new Spawner(
            new Vec2(canvas.width / 2, canvas.height * (3 / 4)),
            10,
            2000,
            { runner: 1 }
        )
    ]
);

var Level3_Chase = new Level(
    new Path(
        [
            new Vec2(25, 25),
            new Vec2(25, canvas.height - 25),
            new Vec2(canvas.width - 25, canvas.height - 25),
            new Vec2(canvas.width - 25, 25),
        ],
        Interpolator.linear,
        true,
    ),
    // list of spawners
    [
        new Spawner(
            new Vec2(canvas.width / 2, canvas.height / 2),
            20,
            2000,
            { runner: 0.5, chaser: 0.5 }
        ),
    ]
);

var levels = [
    Level1_Division, Level2_Horizon, Level3_Chase
];

var gc = canvas.getContext("2d");

// set up keyboard
var keyBoard = new Keyboard();
keyBoard.listenForEvents();

var points = fillPathCircle();
var path = new Path(points, Interpolator.catmullRom, true);
var player = new TurretBase(path, new Vec2(canvas.width / 2, canvas.height / 2));
player.maxHP = 10;
player.hp = 10;
var bullets = [];
var enemies = [];
/*
var spawner = new Spawner(
    new Vec2(canvas.width / 2, canvas.height / 2),
    50,
    1000,
    {runner:0.65,chaser:0.25,darter:0.10}
); */

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
            player.hp -= 1;
            enemies.splice(enemies.indexOf(e), 1);
            i -= 1;
            // TODO: iframe
        }
    }
}
var nextLevelScreen = false;
var nextLevelDelay = 3000;
var endLevelTime = 0;
var playerHasWon = false;
function update() {
    // spawner.spawnEnemy();
    var spawnsLeft = 0;
    for (var i = 0, j = currentLevel.spawnPoints.length; i < j; i++) {
        var spawner = currentLevel.spawnPoints[i];
        spawnsLeft += (spawner.spawnMax - spawner.spawnCount);
        spawner.spawnEnemy();
    }
    if (spawnsLeft <= 0 && enemies.length == 0) {
        var newIndx = levels.indexOf(currentLevel) + 1;
        if (newIndx >= levels.length) {
            playerHasWon = true;
            return;
        }
        currentLevel = levels[newIndx];
        player.path = currentLevel.path;
        bullets.splice(0, bullets.length);
        nextLevelScreen = true;
        endLevelTime = Date.now();
        updatePlayer();
    } else {
        updatePlayer();
        updateBullets();
        updateEnemies();
        collisionEnemyBullet();
        collisionEnemyPlayer();
    }
}

function drawUI() {
    var ratio = Math.max(0, player.hp / player.maxHP);
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

function drawCircleBounds(position, bounds) {
    gc.arc(position.x, position.y, bounds.radius, 0, Math.PI * 2);
}

function drawRectBounds(position, bounds) {
    var pnts = bounds.getPoints(position);
    gc.moveTo(pnts[0].x, pnts[0].y);
    for (var i = 1, j = pnts.length; i < j; i++) {
        gc.lineTo(pnts[i].x, pnts[i].y);
    }
    gc.lineTo(pnts[0].x, pnts[0].y);
}

function drawAxisRectBounds(position, bounds) {
    var hw = bounds.halfWidth;
    var hh = bounds.halfHeight;
    gc.strokeRect(position.x - hw, position.y - hh, hw * 2, hh * 2);
}

function drawBounds(position, bounds) {
    gc.beginPath();
    if (bounds instanceof CircleBounds) {
        drawCircleBounds(position, bounds);
    } else if (bounds instanceof RectBounds) {
        drawRectBounds(position, bounds);
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

function clearCanvas() {
    gc.clearRect(0, 0, canvas.width, canvas.height);
    gc.strokeStyle = "black";
    gc.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawEnemies() {
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

function drawBullets() {
    gc.strokeStyle = "black";
    for (var i = 0, j = bullets.length; i < j; i++) {
        var b = bullets[i];
        var x = b.position.x;
        var y = b.position.y;
        drawBounds(b.position, b.bounds);
    }
}

function drawPath() {
    gc.beginPath();
    gc.strokeStyle = "purple";
    // for (var i = 0; i < path.points.length; i++) {
    for (var i = 0; i < currentLevel.path.points.length; i++) {
        //     var p = path.points[i];
        var p = currentLevel.path.points[i];
        gc.arc(p.x, p.y, 4, 0, Math.PI * 2, false);
    }
    gc.closePath();
    gc.stroke();
}

function drawPlayer() {
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

function resetGame() {
    player.hp = player.maxHP;
    enemies.splice(0, enemies.length);
    bullets.splice(0, bullets.length);
    currentLevel = levels[0];
    player.path = currentLevel.path;
}

function drawNextLevelScreen() {
    draw();
    gc.fillStyle = "black";
    gc.font = "100px Arial";
    gc.fillText("Level: " + (levels.indexOf(currentLevel) + 1), canvas.width / 2 - 200, canvas.height / 2);
}

function mainLoop() {
    if (playerHasWon) {
        var cont = confirm("Replay?");
        if (cont) {
            resetGame();
        } else {
            showStartWindow();
        }
    }
    if (player.hp <= 0) {
        var cont = confirm("Continue?");
        if (cont) {
            resetGame();
        } else {
            resetGame();
            showStartWindow();
        }
    } else {
        if (nextLevelScreen == false) {
            update();
            draw();
        } else {
            if (Date.now() - endLevelTime >= nextLevelDelay) {
                nextLevelScreen = false;
            } else {
                drawNextLevelScreen();
            }
        }
    }
}
var interval;
var currentLevel;
function launchGame() {
    canvas.removeEventListener("click", clickListener, false);
    canvas.removeEventListener("mousemove", mousemoveListener, false);
    clearInterval(interval);
    // calls 60 times a second
    interval = setInterval(mainLoop, 1000 / 60);
    currentLevel = levels[0];
    player.path = currentLevel.path;
}
class EntryScreenButton {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.opacity = 0.9;
    }
}
var launchButton = new EntryScreenButton(
    canvas.width / 2 - 100, 150, 200, 50);
var creditsButton = new EntryScreenButton(
    canvas.width / 2 - 100, 250, 200, 50);
var settingsButton = new EntryScreenButton(
    canvas.width / 2 - 100, 350, 200, 50);

var img = new Image(canvas.width, canvas.height);
img.src = "images/entry_screen_background.jpg";
var imgButton = new Image(launchButton.width, launchButton.height);
imgButton.src = "images/entry_screen_button2.png";

function drawButton(button = EntryScreenButton, name) {
    gc.globalAlpha = button.opacity;
    gc.drawImage(imgButton, button.x, button.y - 10, button.width + 20, button.height + 20);
    gc.globalAlpha = button.opacity;
    gc.font = "30px Arial";
    gc.fillStyle = rgb(252, 214, 47);
    gc.fillText(name, button.x + button.width / 4, button.y + button.height / 2 + 10);
    gc.globalAlpha = 1.0;
}

function drawEntryScreen() {
    clearCanvas();
    gc.fillStyle = "black";
    gc.fillRect(0, 0, canvas.width, canvas.height);
    gc.drawImage(img, 0, 0, canvas.width, canvas.height);
    gc.font = "100px Arial";
    gc.fillText("BIG GUN", canvas.width / 2 - 200, 100);

    drawButton(launchButton, "Launch");
    drawButton(creditsButton, "Credits");
    drawButton(settingsButton, "Settings");
}


function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
}

function isInside(pos, rect) {
    return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y < rect.y + rect.height && pos.y > rect.y;
}

function clickListener(evt) {
    var mousePos = getMousePos(canvas, evt);
    if (isInside(mousePos, launchButton)) {
        launchGame();
    } else if (isInside(mousePos, creditsButton)) {
        //  launchCredits();
    } else if (isInside(mousePos, settingsButton)) {
        //  launchSettings();
    }
}

function mousemoveListener(evt) {
    var mousePos = getMousePos(canvas, evt);
    launchButton.opacity = (isInside(mousePos, launchButton)) ? 1.0 : 0.9;
    creditsButton.opacity = (isInside(mousePos, creditsButton)) ? 1.0 : 0.9;
    settingsButton.opacity = (isInside(mousePos, settingsButton)) ? 1.0 : 0.9;

}

function showStartWindow() {
    canvas.addEventListener("click", clickListener, false);
    canvas.addEventListener("mousemove", mousemoveListener, false);
    clearInterval(interval);
    interval = setInterval(drawEntryScreen, 1000 / 10);
}

showStartWindow();

