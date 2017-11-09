
// set up keyboard
var keyBoard = new Keyboard();
keyBoard.listenForEvents();

// set up canvas
var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");
/*
var image = new Image();
image.src = "images/background_test.png";
var image2 = new Image();
image2.src = "images/background.png";

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

    gc.strokeStyle = "red";
    rightAdder();
    gc.strokeStyle = "blue";
    leftAdder();
} */

function drawRotatedImage(image = Image, position = Vec2, angleDegs = 0, width = Number, height = Number) {
    gc.translate(position.x, position.y);
    gc.rotate(angleDegs);
    gc.drawImage(image, -width / 2, -height / 2, width, height);
    gc.rotate(-angleDegs);
    gc.translate(-position.x, -position.y);
}

var trackPart0 = TrackBuilder.buildCircle();
var pnts0 = trackPart0.points;

var trackPart = TrackBuilder.buildHoizontalLine();
var pnts = trackPart.points;
var img = new Image();
img.src = "images/track.png";

var indx = 0;

function getCirclePoints() {
    var result = [];
    for (var i = 0; i < pnts0.length; i++) {
        var p1 = pnts0[(i + 0) % pnts0.length];
        var p2 = pnts0[(i + 1) % pnts0.length];
        var p3 = pnts0[(i + 2) % pnts0.length];
        var p4 = pnts0[(i + 3) % pnts0.length];
        for (var j = 0, k = 0.1; j < 1, k < 1; j += 0.2, k += 0.2) {
            var ip1 = Interpolator.catmullRom(p1, p2, p3, p4, j);
            var ip2 = Interpolator.catmullRom(p1, p2, p3, p4, k);
            var rad = angleBetween(ip1, ip2);
            var pos = new Vec2(ip1.x + img.width / 2, ip1.y + img.height / 2);
            //  drawRotatedImage(img,pos,rad,img.width,img.height);
            result.push({ p: pos, r: rad });
        }
    }
    return result;
}
var circlePnts = getCirclePoints();
var frameCount = 0;
var frameTime = 0;
var camera = new Vec2(0,0);
var scroll = true;
function mainLoop() {
   // var start = Date.now();
    gc.clearRect(0, 0, canvas.width, canvas.height);

    
    if(keyBoard.isDown(KeyCode.A)){
        if(!scroll)
        camera.x+=5;
    }
    if(keyBoard.isDown(KeyCode.D)){
        if(!scroll)
        camera.x-=5;
    }

    for (var i = 0; i < pnts.length - 4; i++) {
        var p1 = pnts[i];
        var p2 = pnts[i + 1];
        for (var j = 0, k = 0.1; j < 1, k < 1; j += 0.2, k += 0.2) {
            var ip1 = Interpolator.linear(p1, p2, j);
            var ip2 = Interpolator.linear(p1, p2, k);
            var rad = angleBetween(ip1, ip2);
            var pos = new Vec2(ip1.x + img.width / 2, ip1.y + img.height / 2);
            pos.addLocal(new Vec2(indx, 0)).addLocal(camera);
            drawRotatedImage(img, pos, rad, img.width, img.height);
        }
    }
    /*   for(var i = 0; i < pnts0.length; i++){
           var p1 = pnts0[(i+0)%pnts0.length];
           var p2 = pnts0[(i+1)%pnts0.length];
           var p3 = pnts0[(i+2)%pnts0.length];
           var p4 = pnts0[(i+3)%pnts0.length];
           for(var j = 0,k=0.1; j < 1, k < 1; j+=0.2,k+=0.2){
               var ip1 = Interpolator.catmullRom(p1,p2,p3,p4,j);
               var ip2 = Interpolator.catmullRom(p1,p2,p3,p4,k);
               var rad = angleBetween(ip1,ip2);
               var pos = new Vec2(ip1.x+img.width/2,ip1.y+img.height/2);
               drawRotatedImage(img,pos,rad,img.width,img.height);
           }
       } */
    for (var i = 0; i < circlePnts.length; i++) {
        drawRotatedImage(img, circlePnts[i].p, circlePnts[i].r, img.width, img.height);
    }

    if(scroll) {
        if(keyBoard.isDown(KeyCode.D)){
            indx -= 5;
            if (indx < -60) {
                indx = 0;
            }
        }
        if(keyBoard.isDown(KeyCode.A)){
            indx += 5;
            if (indx >= 0) {
                indx = -60;
            }
        }
    }

    if(keyBoard.isDown(KeyCode.P)){
        indx = 0;
        scroll =false;
    }

    /*frameTime += Date.now() - start;
    frameCount++;
    if (frameCount % 100 == 0) {
        console.log(frameTime / frameCount);
    }*/
}

setInterval(mainLoop, 1000 / 60);