var camera = new Vec2(0, 0);

var imgTrack = new Image();
imgTrack.src = "images/track.png"

var bulletImg = new Image();
bulletImg.src = "images/entry_screen_button2.png";

var playerBodyImg = new Image();
playerBodyImg.src = "images/turretBody.png";

var playerBarrelImg = new Image();
playerBarrelImg.src = "images/turretBarrel.png";

function clearCanvas() {
    gc.clearRect(0, 0, canvas.width, canvas.height);
    gc.strokeStyle = "black";
    gc.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawRotatedImage(image = Image, position = Vec2, angleDegs = 0, width = Number, height = Number) {
    gc.translate(position.x, position.y);
    gc.rotate(angleDegs);
    gc.drawImage(image, -width / 2, -height / 2, width, height);
    gc.rotate(-angleDegs);
    gc.translate(-position.x, -position.y);
}

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

function drawPlayerHPBar() {
    var hpComp = player.getComponent(ComponentID.HEALTH);
    var ratio = Math.max(0, hpComp.currentHealth / hpComp.maxHealth);
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

var drawStuff = [];
var animationShift = 0;
function drawTrack() {
    if (track.scrolling) {
        if (keyBoard.isDown(KeyCode.UP_ARROW)) {
            animationShift -= 5;
            animationShift = (animationShift < -60) ? 0 : animationShift;
        }
        if (keyBoard.isDown(KeyCode.DOWN_ARROW)) {
            animationShift += 5;
            animationShift = (animationShift >= 0) ? -60 : animationShift;
        }
    }
    gc.strokeStyle = "purple";
    for (var i = 0; i < track.parts.length; i++) {
        if (drawStuff.length == track.parts.length) {
            break;
        }
        var interpolation = track.parts[i].interpolationMethod;
        if (interpolation == Interpolator.linear) {
            drawStuff.push(calcImgPosLinear(track.parts[i].points));
        } else if (interpolation == Interpolator.catmullRom) {
            drawStuff.push(calcImgPosCatmull(track.parts[i].points));
        }
    }
    for (var i = 0; i < drawStuff.length; i++) {
        for (var j = 0; j < drawStuff[i].length; j++) {
            var pos = drawStuff[i][j].position.add(camera);
            if (track.parts[i].interpolationMethod == Interpolator.linear) {
                if (track.scrolling) {
                    pos.addLocal(new Vec2(animationShift, 0));
                }
            }
            var rad = drawStuff[i][j].angleRad;
            drawRotatedImage(imgTrack, pos, rad, imgTrack.width, imgTrack.height);
        }
    }
}

function drawCollision(position = Vec2, bounds = CollisionBounds) {
    gc.beginPath();
    if (bounds instanceof Circle) {
        gc.arc(position.x, position.y, bounds.radius, 0, Math.PI * 2, false);
        gc.fill();
    } else if (bounds instanceof Rectangle) {
        gc.fillRect(position.x - bounds.halfWidth, position.y - bounds.halfHeight, bounds.halfWidth * 2, bounds.halfHeight * 2);
    } else {
        throw new Error("unknown bounds");
    }
    gc.closePath();
}

function drawHPBar(entity = ComponentEntity,color,hpColor){
    var position = entity.getComponent(ComponentID.PHYSICAL).position;
    var bounds = entity.getComponent(ComponentID.COLLISION).bounds;
    var health = entity.getComponent(ComponentID.HEALTH);
    var ratio = health.currentHealth/health.maxHealth;
    var x = position.x+camera.x;
    var y = position.y+camera.y;
    // draw base
    gc.beginPath();
    gc.fillStyle = color;
    gc.arc(x,y,bounds.radius -1, 0, Math.PI*2);
    gc.fill();
    gc.closePath();
    // draw health remaining
    gc.beginPath();
    gc.fillStyle=hpColor;
    if(health.maxHealth > 50) { // pie slice style
        gc.moveTo(x,y);
        gc.arc(x,y,bounds.radius,0,Math.PI*2*ratio,false);
        gc.lineTo(x,y);
    } else { // energy style
        gc.arc(x,y,ratio*bounds.radius,0,Math.PI*2,false);
    }
    gc.fill();
    gc.closePath();
}

function drawEntites() {
    var renderableList = entityManager.getEntitiesWithComponentID(ComponentID.RENDER);
    for (var i = 0; i < renderableList.length; i++) {
        var id = renderableList[i].id;
        var phsyical = renderableList[i].getComponent(ComponentID.PHYSICAL);
        var nPos = camera.add(phsyical.position);
        var hpColor = "pink";
        var color = "black";
        switch (id) {
            case EntityID.BULLET:
                var collBounds = renderableList[i].getComponent(ComponentID.COLLISION).bounds;
                var angle = phsyical.rotationRadians;
                var radius = collBounds.radius;
                drawRotatedImage(bulletImg, nPos, angle, radius*4, radius*2);
                continue;
            case EntityID.PLAYER:
                var collBounds = renderableList[i].getComponent(ComponentID.COLLISION).bounds;
                var angle = phsyical.rotationRadians;
                var width = collBounds.halfWidth * 2;
                var height = collBounds.halfHeight * 2;
                drawRotatedImage(playerBarrelImg, nPos, angle, width, height);
                continue;
            case EntityID.RUNNER: hpColor = "red"; color="black"; break;
            case EntityID.CHASER: hpColor = "blue";color="black"; break;
            case EntityID.DARTER: hpColor = "orange"; color="black"; break;
            default: break;
        }
        if (renderableList[i].hasComponent(ComponentID.COLLISION)) {
            drawCollision(nPos, renderableList[i].getComponent(ComponentID.COLLISION).bounds);
            if(renderableList[i].hasComponent(ComponentID.HEALTH)){
                drawHPBar(renderableList[i],color,hpColor);
            }
        } else {
            gc.fillRect(nPos.x, nPos.y, 5, 5);
        }
    }
}

function draw() {
    clearCanvas();
    bis.drawBackground();
    drawTrack();
    drawEntites();
    drawPlayerHPBar();
}