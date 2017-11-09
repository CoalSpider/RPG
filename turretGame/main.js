class BackgroundImageScroller {
    constructor(image = Image) {
        this.image = image;
        this.imageX = 0;
        this.imageY = 0;
        this.speed = 10;
    }
    // adds images leftward till background is filed
    addLeft() {
        var currWidth = Math.min(canvas.width - this.imageX, this.image.width);
        var sx = 0;
        var sy = 0;
        var sWidth = currWidth;
        var sHeight = this.image.height;
        var dx = this.imageX;
        var dy = this.imageY;
        var dWidth = currWidth
        var dHeight = this.image.height;
        gc.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        //      gc.strokeRect(dx - 2, dy, dWidth, dHeight);

        while (dx > 0) {
            currWidth = Math.min(dx, this.image.width);
            sx = this.image.width - currWidth;
            sWidth = currWidth;
            dWidth = currWidth;
            dx = dx - currWidth;
            gc.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
            //        gc.strokeRect(dx, dy, currWidth, image.height);
        }
    }

    // adds images rightward till background is filled
    addRight() {
        var currWidth = Math.min(canvas.width - this.imageX, this.image.width);
        var sx = 0;
        var sy = 0;
        var sWidth = currWidth;
        var sHeight = this.image.height;
        var dx = this.imageX;
        var dy = this.imageY;
        var dWidth = currWidth
        var dHeight = this.image.height;
        gc.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        //  gc.strokeRect(dx - 2, dy, dWidth, dHeight);

        dx += currWidth;
        while (dx < canvas.width) {
            currWidth = Math.min(canvas.width - dx, this.image.width);
            sWidth = currWidth;
            dWidth = currWidth;
            gc.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
            //       gc.strokeRect(dx, dy, currWidth, image.height);
            dx += currWidth;
        }
    }

    drawBackground() {
        this.addLeft();
        this.addRight();
    }
}

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

    end() {
        this.ended = true;
        // clear spawnpoints
        this.spawnPoints.splice(0, this.spawnPoints.length - 1);
    }

    update() {
        // if event has started and is not completed
        if (this.started && !this.ended) {
            var spawnsLeft = 0;
            for (var i = 0; i < this.spawnPoints.length; i++) {
                var sp = this.spawnPoints[i].spawnMax - this.spawnPoints[i].spawnCount;
                spawnsLeft += Math.max(0,sp);
                this.spawnPoints[i].spawnEnemy();
            //    console.log(spawnsLeft);
            }

            if (this.body.hp <= 0 || spawnsLeft <= 0) {
                this.end();
            }
        }
    }
}

function getLevel1() {
    var track = new Track([
        TrackBuilder.shiftTrack(TrackBuilder.buildHoizontalLine(), new Vec2(50, canvas.height / 2)),
        //  TrackBuilder.buildHoizontalLine(),
        //  TrackBuilder.buildHoizontalLine(),
        TrackBuilder.buildHoizontalLine(),
        TrackBuilder.buildCircle(),
     //   TrackBuilder.buildHoizontalLine(),
        TrackBuilder.buildHoizontalLine(),
        TrackBuilder.buildCircle(),
        TrackBuilder.buildHoizontalLine(),
        TrackBuilder.buildHoizontalLine(),
        //  TrackBuilder.buildHoizontalLine(),
        //  TrackBuilder.buildCircle(),
    ]);

    TrackBuilder.linkTracks(track.parts);
    //  var body = EntityBuilder.buildEmptyBody(new Vec2(0, 0));
    var body0 = EntityBuilder.buildEmptyBody(new Vec2(0, 0));

    // event 0
    var event0 = new TrackEvent(
        body0,
        [
            new Spawner(new Vec2(canvas.width * 0.75, canvas.height * 0.75), 10, 2000, { chaser: 1.0 }),
            new Spawner(new Vec2(canvas.width * 0.75, canvas.height * 0.25), 10, 2000, { chaser: 1.0 }),
        ]
    );
    track.parts[1].events.push(event0);

    // event 1

    var center = computeCenterOfPoints(track.parts[2].points);
    var body = EntityBuilder.buildDestroyEventBody(center);

    var position1 = body.position.add(new Vec2(0, 0));
    var position2 = body.position.add(new Vec2(-0, 0));
    var position3 = body.position.add(new Vec2(0, -0));

    var event1 = new TrackEvent(
        body,
        [
            new Spawner(position1, 999, 2000, { runner: 0.5, chaser: 0.5 }),
            new Spawner(position2, 999, 2000, { runner: 0.5, chaser: 0.5 }),
            new Spawner(position3, 999, 2000, { runner: 0.5, chaser: 0.5 }),
        ],
    );

    track.parts[2].events.push(event1);

    return track;
}

function isOutOfBounds(position = Vec2) {
    var p = position.add(camera);
    return p.x < 0 || p.y < 0 || p.x > canvas.width || p.y > canvas.height;
}

function update() {
    // update player
    player.update(track);

    // update track events
    for (var i = 0; i < track.parts.length; i++) {
        for (var j = 0; j < track.parts[i].events.length; j++) {
            track.parts[i].events[j].update();
        }
    }

    // update enemies
    for (var i = 0; i < enemies.length; i++) {
        enemies[i].update();
        if (isOutOfBounds(enemies[i].position)) {
            enemies.splice(i, 1);
            i--;
        }
    }

    // update bullets
    for (var i = 0; i < bullets.length; i++) {
        bullets[i].update();
        if (isOutOfBounds(bullets[i].position)) {
            bullets.splice(i, 1);
            i--;
        }
    }
}

function checkCollision() {
    // enemy bullet check
    enemyLoop: for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        bulletLoop: for (var j = 0; j < bullets.length; j++) {
            var b = bullets[j];
            var collide = circleCircleCollision(b.position, b.bounds.radius + 2, e.position, e.bounds.radius);
            if (collide) {
                bullets.splice(j, 1);
                j--;
                e.hp -= 1;
                if (e.hp <= 0) {
                    enemies.splice(i, 1);
                    i--;
                    continue enemyLoop;
                }
            }
        }
    }

    // player enemy check
    for (var i = 0; i < enemies.length; i++) {
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

function checkIfPlayerHasWon() {
    var levelIndx = track.parts.indexOf(track.current);
    // if were on the last track
    if (levelIndx == track.parts.length - 1) {
        // if all events are finished
        if (track.current.events.length == 0) {
            playerHasWon = true;
        }
    }
}

// set up keyboard
var keyBoard = new Keyboard();
keyBoard.listenForEvents();

var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");
var cameraDefault = new Vec2(-canvas.width / 2, -canvas.height / 2);

var background = new Image();
background.src = "images/background.png";
var bis = new BackgroundImageScroller(background);

var enemies = [];
var bullets = [];

var track = getLevel1();
var player = new TurretBase(track, track.current.currentPoint);

var playerHasWon = false;
function resetGame() {
    player.hp = player.maxHP;
    enemies.splice(0, enemies.length);
    bullets.splice(0, bullets.length);
    track = getLevel1();
    playerHasWon = false;
}

function showConfirmDialog(msg) {
    var cont = confirm(msg);
    if (!cont) {
        resetGame();
        showStartWindow();
    } else {
        resetGame();
    }
}

function mainLoop() {
    checkIfPlayerHasWon();
    if (playerHasWon) {
        showConfirmDialog("You Won! Replay?");
    } else if (player.hp <= 0) { // if player has died
        showConfirmDialog("You Died! Continue?")
    } else { // play game
        update();
        checkCollision();
        setCamera();
        // renderer.js draw()
        draw();


        if (keyBoard.isDown(KeyCode.UP_ARROW)) {
            bis.imageX -= 5;
        }

        if (keyBoard.isDown(KeyCode.DOWN_ARROW)) {
            bis.imageX += 5;
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
    track = getLevel1();
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
    clearInterval(interval);
    canvas.addEventListener("click", clickListener, false);
    canvas.addEventListener("mousemove", mousemoveListener, false);
    clearInterval(interval);
    interval = setInterval(drawEntryScreen, 1000 / 10);
}

showStartWindow();


