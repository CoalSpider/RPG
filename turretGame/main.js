var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");

// set up keyboard
var keyBoard = new Keyboard();
keyBoard.listenForEvents();

var player = new Player();

var barrel = new Barrel();

var bullets = [];

function update() {
    player.update();
    for(var i = 0; i < bullets.length; i++){
        bullets[i].update();
    }
}

function draw() {
    gc.clearRect(0, 0, canvas.width, canvas.height);
    gc.strokeStyle = "black";
    gc.strokeRect(0, 0, canvas.width, canvas.height);
    player.draw();
    barrel.draw();
    for(var i = 0; i < bullets.length; i++){
        bullets[i].draw();
    }

    gc.beginPath();
    for(var i = 0; i < pathPoints.length; i++){
        var p = pathPoints[i];
        gc.arc(p.x,p.y,2,0,Math.PI*2,false);
    }
    gc.closePath();
    gc.fill();
}

function mainLoop() {
    update();
    draw();
}

// calls 60 times a second
setInterval(mainLoop, 1000 / 60);