var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");

// set up keyboard
var keyBoard = new Keyboard();
keyBoard.listenForEvents();
class Point{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
}

class Path{
    constructor(points){
        this.points = points;
        var midIdx = Math.floor(points.length/2);
        this.targetForward = points[midIdx];
        this.targetBehind = points[midIdx-1];
    }
}

class PathPosition{
    constructor(path){
        this.path = path;
        this.percentBetweenTargets = 0;
        
        this.setCurrentPoint();
    }

    setCurrentPoint(){
        this.currentPoint = lerp(
            this.path.targetBehind,
            this.path.targetForward,
            this.percentBetweenTargets);
    }

    forward(){
        this.percentBetweenTargets += 0.02;
        // if were on or past the next point
        if(this.percentBetweenTargets >= 1){
            var indx = this.path.points.indexOf(this.path.targetForward);
            // if not at the end of the path moving forward
            if(indx < this.path.points.length-1){
                this.path.targetForward = this.path.points[indx+1];
                this.path.targetBehind = this.path.points[indx];
                this.percentBetweenTargets = 0;
            } else {
                // stop at end of path
                this.percentBetweenTargets = 1;
            }
        }
        this.setCurrentPoint();
    }

    backward(){
        this.percentBetweenTargets -= 0.02;
        // if were on or past the next point
        if(this.percentBetweenTargets < 0){
            var indx = this.path.points.indexOf(this.path.targetBehind);
            // if not at the end of the path moving backwards
            if(indx > 0){
                this.path.targetBehind = this.path.points[indx-1];
                this.path.targetForward = this.path.points[indx];
                this.percentBetweenTargets = 1;
            } else {
                // stop at end of path
                this.percentBetweenTargets = 0;
            }
        }
        this.setCurrentPoint();
    }
}

function lerp(p1,p2,percent){
    var nX = (p1.x*(1-percent) + (p2.x*percent));
    var nY = (p1.y*(1-percent) + (p2.y*percent));
    return new Point(nX,nY);
}

function fillPathDiag(){
    var points = [];
    var len = Math.min(canvas.height,canvas.width);
    for(var i = 40; i <= len-40; i+=len/5){
        points.push(new Point(i, i));
    }
    return points;
}
var points = fillPathDiag();
var path = new Path(points);
var pathPos = new PathPosition(path);

function move(){
    if(keyBoard.isDown(KeyCode.UP_ARROW)){
        pathPos.forward();
    }
    if(keyBoard.isDown(KeyCode.DOWN_ARROW)){
        pathPos.backward();
    }
}

function drawCircle(p){
    gc.arc(p.x,p.y,5,0,Math.PI*2,false);
}
function drawCircleSmall(p){
    gc.arc(p.x,p.y,2,0,Math.PI*2,false);
}

function draw(){
    gc.clearRect(0,0,canvas.width,canvas.height);
    //draw path
    gc.beginPath();
    gc.fillStyle = "blue";
    for(var i = 0; i < path.points.length; i++){
        var p = path.points[i];
        drawCircle(p);
    }
    gc.fill();
    gc.closePath();
    
    gc.beginPath();
    gc.fillStyle="purple";
    drawCircle(pathPos.currentPoint);
    gc.fill();
    gc.closePath();

    gc.beginPath();
    gc.fillStyle="red";
    drawCircle(path.targetForward);
    gc.fill();
    gc.closePath();

    gc.beginPath();
    gc.fillStyle="black";
    drawCircle(path.targetBehind);
    gc.fill();
    gc.closePath();
}

function mainLoop(){
    move();
    draw();
}

// calls 10 times a second
setInterval(mainLoop, 1000 / 10);