class Level {
    constructor(path = Path, spawnPoints) {
        this.path = path;
        this.spawnPoints = spawnPoints;
    }
}

var canvas = document.getElementById("canvas");

var Level1_Division = new Level(
    // vertical line
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
    // horizontal line
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
    // square
    new Path(
        rectanglePath(
            (canvas.width-50)/2,
            (canvas.height-50)/2, 
            new Vec2(canvas.width/2,canvas.height/2)
        ),
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

var Level4_SoFast = new Level(
    // triangle
    new Path(
        eqTrianglePath(
            (canvas.height/2),
            new Vec2(canvas.width/2,canvas.height/2)
        ),
        Interpolator.linear,
        true,
    ),
    // list of spawners
    [
        new Spawner(
            new Vec2(canvas.width / 2, canvas.height / 2),
            20,
            2000,
            { runner: 0.5, chaser: 0.10, darter: 0.40, }
        ),
    ]
);

var Level5_Boss = new Level(
    // circle
    new Path(
        fillPathCircle(),
        Interpolator.catmullRom,
        true,
    ),
    // list of spawners
    [
        new Spawner(
            new Vec2(canvas.width / 2, canvas.height / 2),
            1,
            1000,
            { amalgamate: 1.0}
        ),
    ]
);

var levels = [
    Level1_Division,
    Level2_Horizon,
    Level3_Chase,
    Level4_SoFast,
    Level5_Boss
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
        var p = enemies[i].position;
        if (p.x < 0 || p.y < 0 || p.x > canvas.width || p.y > canvas.height) {
            enemies.splice(i, 1);
            i--;
        }
        if(enemies[i].id == 100){
            for(var j = 0; j < enemies.length; j++){
                var ep = enemies[i].parts[j];
                if (ep.x < 0 || ep.y < 0 || ep.x > canvas.width || ep.y > canvas.height) {
                    enemies[i].parts.splice(j, 1);
                    j--;
                }
            }
        }
    }
}
function collisionEnemyBullet() {
    // brute force check every bullet agianst every enemy
    bLoop:
    for (var i = 0; i < bullets.length; i++) {
        var b = bullets[i];
        eLoop:
        for (var j = 0; j < enemies.length; j++) {
            var e = enemies[j];
            // if were a multipart boss
            if(e.id == 100){
                pLoop:
                for(var p = 0; p < e.parts.length; p++){
                    var part = e.parts[p];
                    var collide = 
                    circleCircleCollision(b.position,4,part.position,10);
                    if(collide){
                        bullets.splice(bullets.indexOf(b),1);
                        i -= 1;
                        part.hp -= 1;
                        if(part.hp <= 0){
                            e.parts.splice(e.parts.indexOf(part),1);
                            p -= 1;
                        }
                        continue bLoop;
                    }
                }
            }
            var collide = circleCircleCollision(b.position, 4, e.position, 10);
            if (collide) {
                bullets.splice(bullets.indexOf(b), 1);
                e.hp -= 1;
                if (e.hp <= 0) {
                    enemies.splice(enemies.indexOf(e), 1);
                    j -= 1;
                }
                i -= 1;
                continue bLoop;
            }
        }
    }
}
function collisionEnemyPlayer() {
    // brute force check every enemy agianst the turret-base/player
    for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if(e.id == 100){
            for(var p = 0; p < e.parts.length; p++){
                var part = e.parts[p];
                var collide = circleBoxCollision(part.position, part.bounds.radius, player.position, player.bounds);
                if (collide) {
                    player.hp -= 1;
                    e.parts.splice(e.parts.indexOf(part), 1);
                    p -= 1;
                    // TODO: iframe
                }
            }
        }
        var collide = circleBoxCollision(e.position, e.bounds.radius, player.position, player.bounds);
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
    if (spawnsLeft <= 0 && enemies.length <= 0) {
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

function resetGame() {
    player.hp = player.maxHP;
    enemies.splice(0, enemies.length);
    bullets.splice(0, bullets.length);
    currentLevel = levels[0];
    player.path = currentLevel.path;
    playerHasWon = false;
}

function mainLoop() {
    if (playerHasWon) {
        var cont = confirm("Replay?");
        if (cont) {
            resetGame();
        } else {
            resetGame();
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
    currentLevel = levels[4];
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

