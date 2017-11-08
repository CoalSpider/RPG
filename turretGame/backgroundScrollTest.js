
// set up keyboard
var keyBoard = new Keyboard();
keyBoard.listenForEvents();

// set up canvas
var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");

var image = new Image();
image.src = "images/background_test.png";

var imageX = 0;
var imageY = 0;
var speed = 10;

// adds images leftward till background is filed
function leftAdder() {
    var currWidth = Math.min(canvas.width - imageX, image.width);
    var sx = 0;
    var sy = 0;
    var sWidth = currWidth;
    var sHeight = image.height;
    var dx = imageX;
    var dy = imageY;
    var dWidth = currWidth
    var dHeight = image.height;
    gc.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    gc.strokeRect(dx - 2, dy, dWidth, dHeight);

    while (dx > 0) {
        currWidth = Math.min(dx, image.width);
        sx = image.width - currWidth;
        sWidth = currWidth;
        dWidth = currWidth;
        dx = dx - currWidth;
        gc.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        gc.strokeRect(dx, dy, currWidth, image.height);
    }
}

// adds images rightward till background is filled
function rightAdder() {
    var currWidth = Math.min(canvas.width - imageX, image.width);
    var sx = 0;
    var sy = 0;
    var sWidth = currWidth;
    var sHeight = image.height;
    var dx = imageX;
    var dy = imageY;
    var dWidth = currWidth
    var dHeight = image.height;
    gc.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    gc.strokeRect(dx - 2, dy, dWidth, dHeight);

    dx += currWidth;
    while (dx < canvas.width) {
        currWidth = Math.min(canvas.width - dx, image.width);
        sWidth = currWidth;
        dWidth = currWidth;
        gc.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        gc.strokeRect(dx, dy, currWidth, image.height);
        dx += currWidth;
    }
}

function mainLoop() {
    if (keyBoard.isDown(KeyCode.W)) {
        // move up
        imageY = (imageY - speed) % image.height;
    }
    if (keyBoard.isDown(KeyCode.A)) {
        // move left
        imageX = (imageX + speed) % image.width;
    }
    if (keyBoard.isDown(KeyCode.S)) {
        // move down
        imageY = (imageY + speed) % image.height;
    }
    if (keyBoard.isDown(KeyCode.D)) {
        // move right
        imageX = (imageX - speed) % image.width;
    }

    gc.fillStyle = "black";
    gc.fillRect(0, 0, canvas.width, canvas.height);
    gc.strokeStyle = "white";


    // img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight
    /*
    var currWidth = Math.min(canvas.width-imageX,image.width);
    var sx = 0;
    var sy = 0;
    var sWidth =currWidth;
    var sHeight = image.height;
    var dx = imageX;
    var dy = imageY;
    var dWidth = currWidth
    var dHeight = image.height;
    gc.drawImage(image,sx,sy,sWidth,sHeight,dx,dy,dWidth,dHeight);
    gc.strokeRect(dx-2,dy,dWidth,dHeight);

    dx += currWidth;
    if(dx < canvas.width){
        currWidth = Math.min(canvas.width-dx,image.width);
        sWidth = currWidth;
        dWidth = currWidth;
        gc.drawImage(image,sx,sy,sWidth,sHeight,dx,dy,dWidth,dHeight);
        gc.strokeRect(dx,dy,currWidth,image.height);
    }

    dx+=currWidth;

    if(dx < canvas.width){
        currWidth = Math.min(canvas.width-dx,image.width);
        sWidth = currWidth;
        dWidth = currWidth;
        gc.drawImage(image,sx,sy,sWidth,sHeight,dx,dy,dWidth,dHeight);
        gc.strokeRect(dx,dy,currWidth,image.height);
    } */

    rightAdder();
    leftAdder();

}

setInterval(mainLoop, 1000 / 60);