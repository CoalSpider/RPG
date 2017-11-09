var camera = new Vec2(0, 0);

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
    var x = entity.position.x + camera.x;
    var y = entity.position.y + camera.y;
    gc.beginPath();
    gc.fillStyle = hpColor;
    gc.arc(x, y, entity.bounds.radius - 1, 0, Math.PI * 2);
    gc.fill();
    gc.closePath();
    gc.beginPath();
    gc.fillStyle = color;
    var ratio = hp / maxHP;

    if (maxHP > 50) {// pie slice style
        gc.moveTo(x, y);
        gc.arc(x, y, entity.bounds.radius, 0, Math.PI * 2 * ratio, false);
        gc.lineTo(x, y);
    } else { // energy style
        gc.arc(x, y, ratio * (entity.bounds.radius), 0, Math.PI * 2, false);
    }
    gc.fill();
    gc.closePath();
}

function clearCanvas() {
    gc.clearRect(0, 0, canvas.width, canvas.height);
    gc.strokeStyle = "black";
    gc.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawEnemies() {
    for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        var pos = e.position.add(camera);
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
            case 100: color = "black"; hpColor = "grey"; break;
            case -1: //console.log(e.position);
            default: color = "black", hpColor = "red"; break;
        }
        gc.strokeStyle = color;
        drawBounds(pos, bounds);
        if (e.hp != undefined) {
            drawHPBar(e, color, hpColor);
        }
    }
}
var bulletImg = new Image();
bulletImg.src = "images/entry_screen_button2.png";

function drawRotatedImage(image = Image, position = Vec2, angleDegs = 0, width = Number, height = Number) {
    gc.translate(position.x, position.y);
    gc.rotate(angleDegs);
    gc.drawImage(image, -width / 2, -height / 2, width, height);
    gc.rotate(-angleDegs);
    gc.translate(-position.x, -position.y);
}
function drawBullets() {
    //gc.strokeStyle = "black";
    for (var i = 0; i < bullets.length; i++) {
        var radius = bullets[i].bounds.radius;
        var pos = bullets[i].position.add(camera);
        var angleDegs = bullets[i].angle * (180 / Math.PI);
        drawRotatedImage(bulletImg, pos, toRad(angleDegs), radius * 4, radius * 2);
    }
}

var imgTrack = new Image();
imgTrack.src = "images/track.png"
var drawStuff = [];
var animationShift = 0;
function drawTrack() {
    if(track.scrolling){
        if(keyBoard.isDown(KeyCode.UP_ARROW)){
            animationShift -= 5;
            animationShift = (animationShift < -60) ? 0 : animationShift;
        }
        if(keyBoard.isDown(KeyCode.DOWN_ARROW)){
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
        /*   drawTrackOuter(track.parts[i]);
           drawTrackInner(track.parts[i]);
           if(track.parts[i].interpolationMethod==Interpolator.linear)
               drawLinearInterpolation(track.parts[i]);
           else
               drawCatmullInterpolation(track.parts[i]); */
    }
    for (var i = 0; i < drawStuff.length; i++) {
        for (var j = 0; j < drawStuff[i].length; j++) {
            var pos = drawStuff[i][j].position.add(camera);
            if(track.parts[i].interpolationMethod == Interpolator.linear){
                if(track.scrolling){
                    pos.addLocal(new Vec2(animationShift,0));
                }
            }
            var rad = drawStuff[i][j].angleRad;
            drawRotatedImage(imgTrack, pos, rad, imgTrack.width, imgTrack.height);
        }
    }
}
/*
function drawLinearInterpolation(trackPart) {
    var pnts = trackPart.points;
    gc.beginPath();
    var shift = new Vec2(0, 10);
    for (var i = 0; i < pnts.length - 1; i++) {
        var p1 = pnts[i].add(camera).addLocal(shift);
        var p2 = pnts[i + 1].add(camera).addLocal(shift);
        var p3 = pnts[i].add(camera).subLocal(shift);
        var p4 = pnts[i + 1].add(camera).subLocal(shift);
        for (var percent = 0; percent < 1; percent += 0.1) {
            var interpol = Interpolator.linear(p1, p2, percent);
            var interpol2 = Interpolator.linear(p3, p4, percent);
            gc.arc(interpol.x, interpol.y, 2, 0, Math.PI * 2, false);
            gc.arc(interpol2.x, interpol2.y, 2, 0, Math.PI * 2, false);
        }
    }
    gc.stroke();
    gc.closePath();
}

function drawCatmullInterpolation(trackPart) {
    var pnts = trackPart.points;
    gc.beginPath();
    for (var i = 0; i < pnts.length; i++) {
        var i1 = (i - 1 < 0) ? (i + pnts.length - 1) % pnts.length : (i - 1) % pnts.length;
        var i2 = (i) % pnts.length;
        var i3 = (i + 1) % pnts.length;
        var i4 = (i + 2) % pnts.length;
        var perpSlope = pnts[i3].sub(pnts[i2]);
        // TODO: change shift per interpolation
        perpSlope = new Vec2(-perpSlope.y, perpSlope.x);
        var shift = perpSlope.normalize().mult(10);

        var p1 = pnts[i1].add(camera).addLocal(shift);
        var p2 = pnts[i2].add(camera).addLocal(shift);
        var p3 = pnts[i3].add(camera).addLocal(shift);
        var p4 = pnts[i4].add(camera).addLocal(shift);

        var p5 = pnts[i1].add(camera).subLocal(shift);
        var p6 = pnts[i2].add(camera).subLocal(shift);
        var p7 = pnts[i3].add(camera).subLocal(shift);
        var p8 = pnts[i4].add(camera).subLocal(shift);
        for (var percent = 0; percent < 1; percent += 0.05) {
            var interpol = Interpolator.catmullRom(p1, p2, p3, p4, percent);
            var interpol2 = Interpolator.catmullRom(p5, p6, p7, p8, percent);
            gc.arc(interpol.x, interpol.y, 2, 0, Math.PI * 2, false);
            gc.arc(interpol2.x, interpol2.y, 2, 0, Math.PI * 2, false);
        }
    }
    gc.stroke();
    gc.closePath();
}

function drawTrackOuter(trackPart) {
    gc.beginPath();
    for (var j = 0; j < trackPart.points.length; j++) {
        var p = trackPart.points[j].add(camera).subLocal(new Vec2(0, 10));
        gc.arc(p.x, p.y, 4, 0, Math.PI * 2, false);
    }
    gc.stroke();
    gc.closePath();
}

function drawTrackInner(trackPart) {
    gc.beginPath();
    for (var j = 0; j < trackPart.points.length; j++) {
        var p = trackPart.points[j].add(camera).addLocal(new Vec2(0, 10));
        gc.arc(p.x, p.y, 4, 0, Math.PI * 2, false);
    }
    gc.stroke();
    gc.closePath();
} */

function drawPlayer() {
    gc.strokeStyle = "black";
    drawBounds(player.position.add(camera), player.bounds);
    drawBounds(player.barrel.position.add(camera), player.barrel.bounds);
}

var playerBodyImg = new Image();
playerBodyImg.src = "images/turretBody.png";
var playerBarrelImg = new Image();
playerBarrelImg.src = "images/turretBarrel.png";
function draw() {
    clearCanvas();
    bis.drawBackground();
    drawEnemies();
    drawBullets();
    drawTrack();
    var width = player.bounds.halfWidth * 2;
    var height = player.bounds.halfHeight * 2;
    var angle = player.bounds.angleRad;
    drawRotatedImage(playerBodyImg, player.position.add(camera), angle, width, height);
    drawRotatedImage(playerBarrelImg, player.position.add(camera), angle, width, height);
    drawPlayer();
    drawUI();
}

function drawNextLevelScreen() {
    draw();
    gc.fillStyle = "black";
    gc.font = "100px Arial";
    gc.fillText("Level: " + (levels.indexOf(currentLevel) + 1), canvas.width / 2 - 200, canvas.height / 2);
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