var camera = new Vec2(0,0);

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
    gc.arc(x, y, entity.bounds.radius-1, 0, Math.PI * 2);
    gc.fill();
    gc.closePath();
    gc.beginPath();
    gc.fillStyle = color;
    var ratio = hp / maxHP;
    
    if(maxHP > 50){// pie slice style
        gc.moveTo(x,y);
        gc.arc(x,y, entity.bounds.radius, 0, Math.PI * 2 * ratio, false);
        gc.lineTo(x,y); 
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

function drawBossAmalgamate(boss){
    var color = "black";
    var hpColor = "grey";
    var parts = boss.parts;
    for(var i = 0,j=parts.length; i < j; i++){
        var e = parts[i];
        drawBounds(e.position.add(camera),e.bounds);
        if(e.hp != undefined){
            drawHPBar(e, color, hpColor);
        }
    }
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
            case 100: drawBossAmalgamate(e); color="black";hpColor="grey";break;
            default: color="black",hpColor="white";break;
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
    for (var i = 0; i < bullets.length; i++) {
        var b = bullets[i];
        drawBounds(b.position.add(camera), b.bounds);
    }
}

function drawTrack() {
    gc.strokeStyle = "purple";
    for(var i = 0; i < track.parts.length; i++){
        gc.beginPath();
        for(var j = 0; j < track.parts[i].points.length; j++){
            var p = track.parts[i].points[j].add(camera);
            gc.arc(p.x,p.y,4,0,Math.PI*2,false);
        }
        gc.stroke();
        gc.closePath();
    }
}

function drawPlayer() {
    gc.strokeStyle = "black";
    drawBounds(player.position.add(camera), player.bounds);
    drawBounds(player.barrel.position.add(camera), player.barrel.bounds);
}

function draw() {
    clearCanvas();
    drawEnemies();
    drawBullets();
    drawTrack();
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