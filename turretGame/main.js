class Level {
    constructor(track = Track, spawnPoints = []) {
        this.track = track;
        this.spawnPoints = spawnPoints;
    }
}

class TrackEvent {
    constructor(body = Entity, spawnPoints = []) {
        this.body = body;
        this.spawnPoints = spawnPoints;
        this.started = false;
        this.ended = false;
    }

    start() {
        this.started = true;
        this.isOver = false;
    }

    end(){
        this.ended = true;
        // clear spawnpoints
        this.spawnPoints.splice(0,this.spawnPoints.length-1);
    }

    update() {
        // if event has started and is not completed
        if (this.started && !this.ended) {
            for (var i = 0; i < this.spawnPoints.length; i++) {
                this.spawnPoints[i].spawnEnemy();
            }
        }
        if(this.body.hp <= 0){
            this.end();
        }
    }
}

function getLevel1(){
    var track = new Track([
        TrackBuilder.shiftTrack(TrackBuilder.buildHoizontalLine(), new Vec2(50, canvas.height / 2)),
        TrackBuilder.buildHoizontalLine(),
        TrackBuilder.buildHoizontalLine(),
        TrackBuilder.buildCircle(),
        TrackBuilder.buildHoizontalLine(),
        TrackBuilder.buildHoizontalLine(),
        TrackBuilder.buildCircle(),
        TrackBuilder.buildHoizontalLine(),
        TrackBuilder.buildHoizontalLine(),
        TrackBuilder.buildCircle(),
    ]);

    TrackBuilder.linkTracks(track.parts);

    // event 1

    var center = computeCenterOfPoints(track.parts[3].points);
    var body = EntityBuilder.buildDestroyEventBody(center);
    
    var position1 = body.position.add(new Vec2(0,0));
    var position2 = body.position.add(new Vec2(-0,0));
    var position3 = body.position.add(new Vec2(0,-0));

    var event1 = new TrackEvent(
        body,
        [
            new Spawner(position1,999,2000,{runner:0.5,chaser:0.5}),
            new Spawner(position2,999,2000,{runner:0.5,chaser:0.5}),
            new Spawner(position3,999,2000,{runner:0.5,chaser:0.5}),
        ],
    )

    track.parts[3].events.push(event1);

    return track;
}

function isOutOfBounds(position=Vec2){
    var p = position.add(camera);
    return p.x < 0 || p.y < 0 || p.x > canvas.width || p.y > canvas.height; 
}

function update(){
    // update player
    player.update(track);

    // update track events
    for(var i = 0; i < track.parts.length; i++){
        for(var j = 0; j < track.parts[i].events.length; j++){
            track.parts[i].events[j].update();
        }
    }

    // update enemies
    for(var i = 0; i < enemies.length; i++){
        enemies[i].update();
        if(isOutOfBounds(enemies[i].position)){
            enemies.splice(i,1);
            i--;
        }
    }

    // update bullets
    for(var i = 0; i < bullets.length; i++){
        bullets[i].update();
        if (isOutOfBounds(bullets[i].position)) {
            bullets.splice(i, 1);
            i--;
        }
    }
}

function checkCollision(){
    // enemy bullet check
    enemyLoop: for(var i = 0; i < enemies.length; i++){
        var e = enemies[i];
        bulletLoop: for(var j = 0; j < bullets.length; j++){
            var b = bullets[j];
            var collide = circleCircleCollision(b.position, b.bounds.radius+2, e.position, e.bounds.radius);
            if(collide){
                bullets.splice(j,1);
                j--;
                e.hp -= 1;
                if(e.hp <= 0){
                    enemies.splice(i,1);
                    i--;
                    continue enemyLoop;
                }
            }
        }
    }

    // player enemy check
    for(var i = 0; i < enemies.length; i++){
        var e = enemies[i];
        var collide = circleBoxCollision(e.position, e.bounds.radius, player.position, player.bounds);
        if (collide) {
            player.hp -= 1;
            enemies.splice(i, 1);
            i--;
        }
    }
}

function setCamera() {
    camera.multLocal(0).subLocal(cameraDefault).subLocal(track.current.currentPoint);
}

// set up keyboard
var keyBoard = new Keyboard();
keyBoard.listenForEvents();

var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");
var cameraDefault = new Vec2(-canvas.width / 2, -canvas.height / 2);

var enemies = [];
var bullets = [];

var track = getLevel1();
var player = new TurretBase(track, track.current.currentPoint);

function mainLoop() {
    update();
    checkCollision();

    setCamera();
    
    // renderer.js draw()
    draw();
}

setInterval(mainLoop, 1000 / 60);

/*
player.maxHP = 10;
player.hp = 10;

var nextLevelScreen = false;
var nextLevelDelay = 3000;
var endLevelTime = 0;
var playerHasWon = false;
function update() {
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
*/


