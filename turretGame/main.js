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

    gc.strokeRect(canvas.width/2-20,0,20,canvas.height);
}

function mainLoop() {
    update();
    draw();
}

// calls 60 times a second
setInterval(mainLoop, 1000 / 60);