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
class TrackEvent {
    constructor(bodies = []) {
        this.bodies = bodies;
        this.started = false;
        this.ended = false;
    }
    start() {
        console.log("started");
        this.started = true;
        this.isOver = false;

        for (var i = 0; i < this.bodies.length; i++) {
            entityManager.registerEntity(this.bodies[i]);
        }
    }

    end() {
        console.log("ended");
        this.ended = true;

        for (var i = 0; i < this.bodies.length; i++) {
            entityManager.markForRemoval(this.bodies[i]);
        }

        entityManager.removeMarkedEntities();
        this.bodies.splice(0, this.bodies.length);
    }

    update() {
        // if event has started and is not completed
        if (this.started && !this.ended) {
            for (var i = 0; i < this.bodies.length; i++) {
                if (entityManager.isEntityRegistered(this.bodies[i]) == false) {
                    this.bodies.splice(i, 1);
                    i--;
                }
            }
            if (this.bodies.length <= 0) {
                this.end();
            }
        }
    }
}

function loadLevelOne() {
    track = new Track([
        // start
        TrackBuilder.shiftTrack(TrackBuilder.buildHoizontalLine(), new Vec2(50, canvas.height / 2)),
        // e1
        TrackBuilder.buildHoizontalLine(),
        // mini boss
        TrackBuilder.buildCircle(),
        // e2
        TrackBuilder.buildHoizontalLine(),
        // boss
        TrackBuilder.buildCircle(),
        // vistory lap
        TrackBuilder.buildHoizontalLine(),
        TrackBuilder.buildHoizontalLine(),
    ]);

    // attach all track parts, this also moves them into position
    TrackBuilder.linkTracks(track.parts);

    var p1 = track.parts[1].points[0];
    var p2 = track.parts[1].points[track.parts[1].points.length - 1];
    var mid = p1.add(p2.sub(p1).multLocal(0.5));
    track.parts[1].events.push(new TrackEvent(
        [
            EntityFactory.buildSpawner(new Vec2(0, -canvas.height/4).addLocal(p2),2,4000,{chaser: 1.0},player),
            EntityFactory.buildSpawner(p2,2,4000,{chaser: 1.0},player),
            EntityFactory.buildSpawner(new Vec2(0, canvas.height/4).addLocal(p2),2,4000,{chaser: 1.0},player),
        ]
    ));
    track.parts[1].events.push(new TrackEvent(
        [
            EntityFactory.buildSpawner(new Vec2(0, -canvas.height/4).addLocal(p1), 10, 4000, { chaser: 1.0 },player),
            EntityFactory.buildSpawner(new Vec2(0, 0).addLocal(p2), 10, 4000, { chaser: 1.0 },player),
            EntityFactory.buildSpawner(new Vec2(0, canvas.height/4).addLocal(p1), 10, 4000, { chaser: 1.0 },player),
        ]
    ));

    var center = computeCenterOfPoints(track.parts[2].points);
    track.parts[2].events.push(new TrackEvent(
        [
            EntityFactory.buildDestroyEventBody(center),
            EntityFactory.buildSpawner(center, 20, 4000, { runner: 0.5, chaser: 0.5 },player),
            EntityFactory.buildSpawner(center, 20, 4000, { runner: 0.5, chaser: 0.5 },player),
            EntityFactory.buildSpawner(center, 20, 4000, { runner: 0.5, chaser: 0.5 },player),
        ]
    ));

    var p3 = track.parts[3].points[0];
    var p4 = track.parts[3].points[track.parts[3].points.length - 1];
    var mid2 = p3.add(p4.sub(p3).multLocal(0.5));
    track.parts[3].events.push(new TrackEvent(
        [
            EntityFactory.buildSpawner(new Vec2(-canvas.width/4,-canvas.height/2).addLocal(mid2), 10, 4000, { chaser:0.9,darter:0.1 },player),
            EntityFactory.buildSpawner(new Vec2(0,-canvas.height/2).addLocal(mid2), 10, 4000, { chaser:0.9,darter:0.1 },player),
            EntityFactory.buildSpawner(new Vec2(canvas.width/4,-canvas.height/2).addLocal(mid2), 10, 4000, { chaser:0.9,darter:0.1 },player),
        ]
    ));

    var bossPos = computeCenterOfPoints(track.parts[4].points);
    track.parts[4].events.push(new TrackEvent(
        [
            EntityFactory.buildAmalgamate(bossPos,player),
        ]
    ));
}

function update() {
    var aiUpdateList = entityManager.getEntitiesWithComponentID(ComponentID.AI);
    if (aiUpdateList != undefined) {
        for (var i = 0; i < aiUpdateList.length; i++) {
            aiUpdateList[i].getComponent(ComponentID.AI).update();
        }
    }

    var event = track.current.events[0];
    if (event != undefined && event.started) {
        event.update();
    }

    entityManager.markOutOfBounds();
    entityManager.markDead();
    entityManager.markEmptySpawners();
}

function collides(p1, b1, entity = ComponentEntity) {
    var p2 = entity.getComponent(ComponentID.PHYSICAL).position;
    var b2 = entity.getComponent(ComponentID.COLLISION).bounds;
    if (b1 instanceof Circle) {
        if (b2 instanceof Circle) {
            return circleCircleCollision(p1, b1.radius, p2, b2.radius);
        } else if (b2 instanceof Rectangle) {
            return circleBoxCollision(p1, b1.radius, p2, b2);
        } else {
            throw new Error("unkown bounds in entity");
        }
    } else if (b1 instanceof Rectangle) {
        if (b2 instanceof Circle) {
            return circleBoxCollision(p2, b2.radius, p1, b1);
        } else if (b2 instanceof Rectangle) {
            throw new Error("rectangle rectagle collision check not implemented");
        } else {
            throw new Error("unkown bounds in entity");
        }
    } else {
        throw new Error("unknown bounds argument");
    }
}

function checkCollision() {
    var collidables = entityManager.getEntitiesWithComponentID(ComponentID.COLLISION);
    // brute force collision check of player verses enemies
    var playerPos = player.getComponent(ComponentID.PHYSICAL).position;
    var playerBounds = player.getComponent(ComponentID.COLLISION).bounds;
    for (var i = 0; i < collidables.length; i++) {
        var e = collidables[i];
        if (e.id == EntityID.PLAYER) continue;
        if (collides(playerPos, playerBounds, e)) {
         //   if(e.hasComponent(ComponentID.HEALTH)){
         //       e.getComponent(ComponentID.HEALTH).currentHealth -=1;
         //   } else {
                entityManager.markForRemoval(e);
         //   }
            player.getComponent(ComponentID.HEALTH).currentHealth -= 1;
        }
    }
    // brute force collision check player bullets vs enemy bodies
    var bullets = entityManager.getEntitiesByID(EntityID.BULLET);
    for(var i = 0; i < collidables.length; i++){
        var e = collidables[i];
        if(e.id == EntityID.PLAYER) continue;
        var ePos = e.getComponent(ComponentID.PHYSICAL).position;
        var eBounds = e.getComponent(ComponentID.COLLISION).bounds;
        for(var j = 0; j < bullets.length; j++){
            if(e == bullets[j]) continue;
            if(collides(ePos,eBounds,bullets[j])){
                entityManager.markForRemoval(bullets[j]);
                if(e.hasComponent(ComponentID.HEALTH)){
                    e.getComponent(ComponentID.HEALTH).currentHealth -= 1;
                }
            }
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
// set up canvas
var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");
var cameraDefault = new Vec2(-canvas.width / 2, -canvas.height / 2);
// set up background
var background = new Image();
background.src = "images/background.png";
var bis = new BackgroundImageScroller(background);
// build the player
var player = undefined;
// build out entity manager
var entityManager = undefined;

var playerHasWon = false;

var track = undefined;

function resetGame() {
    player = EntityFactory.buildPlayer();
    entityManager.clearManager();
    loadLevelOne();
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
        handleKeyboardInputs();
        update();
        entityManager.removeMarkedEntities();
        checkCollision();
        entityManager.removeMarkedEntities();
        setCamera();
        // renderer.js draw()
        draw();
    }
}

function handleKeyboardInputs() {
    var p = player.getComponent(ComponentID.PHYSICAL);
    if(keyBoard.isDown(KeyCode.W)){
        var newBullet = player.getComponent(ComponentID.SHOOTER).fire();
        if(newBullet != null){
            entityManager.registerEntity(newBullet);
        }
    }
    if (keyBoard.isDown(KeyCode.UP_ARROW)) {
        bis.imageX -= 5;
        track.forward();
        p.position = track.current.currentPoint;
    }

    if (keyBoard.isDown(KeyCode.DOWN_ARROW)) {
        bis.imageX += 5;
        track.backward();
        p.position = track.current.currentPoint;
    }

    if (keyBoard.isDown(KeyCode.LEFT_ARROW)) {
        p.rotate(-0.05);//rotationRadians -= 0.05;
    }

    if (keyBoard.isDown(KeyCode.RIGHT_ARROW)) {
        p.rotate(0.05);//p.rotationRadians += 0.05;
    }
}

var interval;
function launchGame() {
    canvas.removeEventListener("click", clickListener, false);
    canvas.removeEventListener("mousemove", mousemoveListener, false);
    clearInterval(interval);
    // calls 60 times a second
    interval = setInterval(mainLoop, 1000 / 60);
    player = EntityFactory.buildPlayer(new Vec2(0, 0));
    loadLevelOne();
    player.getComponent(ComponentID.PHYSICAL).position = track.current.currentPoint;
    entityManager = new EntityManager();
    entityManager.registerEntity(player);
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