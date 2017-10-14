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
        // set start point as midpoint
        var midIdx = Math.floor(points.length/2);
        this.currentPoint = points[midIdx];
        this.previousPoint = points[midIdx-1];
        this.nextPoint = points[midIdx+1];
    }
}

function lerp(p1,p2,percent){
    var nX = (p1.x*(1-percent) + (p2.x*percent));
    var nY = (p1.y*(1-percent) + (p2.y*percent));
    return new Point(nX,nY);
}

function fillPathDiag(){
    var points = [];
    for(var i = 0; i <= Math.min(canvas.height, canvas.width); i+=Math.floor(canvas.height/4)){
        points.push(new Point(i, i));
    }
    return points;
}
var points = fillPathDiag();
var path = new Path(points);

var targetBehind = path.currentPoint;
var targetForward = path.nextPoint;
var percentBetween = 0.0;
var playerPoint = lerp(targetBehind,targetForward,percentBetween);

function progressForward(){
    var indxCurr = path.points.indexOf(path.currentPoint);
    var newIndx = indxCurr+1;
    if(newIndx >=  path.points.length - 1){
        return;
    }
    path.previousPoint = path.points[newIndx-1];
    path.currentPoint = path.points[newIndx];
    path.nextPoint = path.points[newIndx+1];
}

function progressBackwards(){
    var indxCurr = path.points.indexOf(path.currentPoint);
    var newIndx = indxCurr-1;
    if(newIndx <= 0){
        return;
    }
    path.previousPoint = path.points[newIndx-1];
    path.currentPoint = path.points[newIndx];
    path.nextPoint = path.points[newIndx+1];
}


function move(){
    if(keyBoard.isDown(KeyCode.UP_ARROW)){
     //   progressForward();
        percentBetween += 0.02;
        if(percentBetween >= 1){
            percentBetween -= 1;
            var indx = path.points.indexOf(targetForward);
            if(indx < path.points.length-1){
                targetForward = path.points[indx+1];
                targetBehind = path.points[indx];
            }
        }

    }
    if(keyBoard.isDown(KeyCode.DOWN_ARROW)){
    //    progressBackwards();
        percentBetween -= 0.02;
        if(percentBetween < 0){
            percentBetween = 0;
            var indx = path.points.indexOf(targetBehind);
            if(indx > 0){
                targetBehind = path.points[indx-1];
                targetForward = path.points[indx];
                percentBetween = 1;
            }
        }
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
    /*
    // draw current point
    gc.beginPath();
    gc.fillStyle = "red";
    var curr = path.currentPoint;
    drawCircle(curr);
    gc.fill();
    gc.closePath();

    // draw previous and next points
    gc.beginPath();
    gc.fillStyle = "green";
    var prev = path.previousPoint;
    drawCircle(prev);
    var nxt = path.nextPoint;
    drawCircle(nxt);
    gc.fill();
    gc.closePath(); */

    /*
    // draw interpolation between current and next
    gc.beginPath();
    gc.fillStyle = "purple";
    for(var i = 0; i < 1; i+=0.1){
        var lerpedP = lerp(path.currentPoint,path.nextPoint,i);
        drawCircleSmall(lerpedP);
    }
    gc.fill();
    gc.closePath();

    // draw interpolation between current and previous
    gc.beginPath();
    gc.fillStyle = "pink";
    for(var i = 0; i < 1; i+=0.1){
        var lerpedP = lerp(path.currentPoint,path.previousPoint,i);
        drawCircleSmall(lerpedP);
    }
    gc.fill();
    gc.closePath(); */
    playerPoint = lerp(targetBehind,targetForward,percentBetween);
    gc.beginPath();
    gc.fillStyle="purple";
    drawCircle(playerPoint);
    gc.fill();
    gc.closePath();

    gc.beginPath();
    gc.fillStyle="red";
    drawCircle(targetForward);
    gc.fill();
    gc.closePath();

    gc.beginPath();
    gc.fillStyle="black";
    drawCircle(targetBehind);
    gc.fill();
    gc.closePath();
}

function mainLoop(){
    move();
    draw();
}

// calls 10 times a second
setInterval(mainLoop, 1000 / 10);