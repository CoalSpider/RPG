//var canvas = document.getElementById("canvas");
//var gc = canvas.getContext("2d");

// set up keyboard
//var keyBoard = new Keyboard();
//keyBoard.listenForEvents();

/** Movement path, a duplicate start and end point are added to allow for non linear interpolation**/
class Path {
    /** TODO: set interpolation method */
    constructor(points, interpolation, wrapping) {
        if (points.length < 2) {
            throw Error("path size must be >= 2");
        }
        this.points = points;
        if (this.wrapping == false) {
            // add duplicate start point for spline
            this.points.unshift(this.points[0]);
            // add duplicate end points for spline
            this.points.push(this.points[this.points.length - 1]);
        } else {
            // we wrap start end end
        }
        var midIndx = Math.floor(points.length / 2);
        this.splineHelperBehind = points[midIndx - 2];
        this.targetBehind = points[midIndx - 1];
        this.targetForward = points[midIndx];
        this.splineHelperForward = points[midIndx + 1];
        this.percentBetweenTargets = 0;

        this.interpolation = interpolation;
        this.wrapping = wrapping;
        this.setCurrentPoint();
    }

    setCurrentPoint() {
        if (this.interpolation == Interpolator.linear) {
            this.currentPoint = this.interpolation(
                this.targetBehind,
                this.targetForward,
                this.percentBetweenTargets
            );
        } else if (this.interpolation == Interpolator.hermite) {
            this.currentPoint = this.interpolation(
                this.splineHelperBehind,
                this.targetBehind,
                this.targetForward,
                this.splineHelperForward,
                this.percentBetweenTargets,
                0, // bias
                0 // tolerance
            );
        } else {
            this.currentPoint = this.interpolation(
                this.splineHelperBehind,
                this.targetBehind,
                this.targetForward,
                this.splineHelperForward,
                this.percentBetweenTargets
            );
        }
    }

    wrap(indx, min, max) {
        var result = indx;
        if (result < 0) {
            result += max;
        } else if (result > max - 1) {
            result -= max;
        }
        return result;
    }

    forward() {
        this.percentBetweenTargets += 0.02;
        // if were on or past the next point
        if (this.percentBetweenTargets >= 1) {
            var indx = this.points.indexOf(this.targetForward);
            if (this.wrapping) {
                var p1 = this.wrap(indx - 1, 0, this.points.length);
                var p2 = this.wrap(indx, 0, this.points.length);
                var p3 = this.wrap(indx + 1, 0, this.points.length);
                var p4 = this.wrap(indx + 2, 0, this.points.length);
                this.splineHelperBehind = this.points[p1];
                this.targetBehind = this.points[p2];
                this.targetForward = this.points[p3];
                this.splineHelperForward = this.points[p4];
                this.percentBetweenTargets -= 1;
            } else {
                // if not at the end of the path moving forward
                if (indx < this.points.length - 2) {
                    this.splineHelperBehind = this.points[indx - 1];
                    this.targetBehind = this.points[indx];
                    this.targetForward = this.points[indx + 1];
                    this.splineHelperForward = this.points[indx + 2];
                    this.percentBetweenTargets -= 1;
                } else {
                    // stop at end of path
                    this.percentBetweenTargets = 1;
                }
            }
        }
        this.setCurrentPoint();
    }

    backward() {
        this.percentBetweenTargets -= 0.02;
        // if were on or past the next point
        if (this.percentBetweenTargets < 0) {
            var indx = this.points.indexOf(this.targetBehind);
            if (this.wrapping) {
                var p1 = this.wrap(indx - 2, 0, this.points.length);
                var p2 = this.wrap(indx - 1, 0, this.points.length);
                var p3 = this.wrap(indx, 0, this.points.length);
                var p4 = this.wrap(indx + 1, 0, this.points.length);
                this.splineHelperBehind = this.points[p1];
                this.targetBehind = this.points[p2];
                this.targetForward = this.points[p3];
                this.splineHelperForward = this.points[p4];
                this.percentBetweenTargets += 1;
            } else {
                // if not at the end of the path moving backwards
                if (indx > 1) {
                    this.splineHelperBehind = this.points[indx - 2];
                    this.targetBehind = this.points[indx - 1];
                    this.targetForward = this.points[indx];
                    this.splineHelperForward = this.points[indx + 1];
                    this.percentBetweenTargets += 1;
                } else {
                    // stop at end of path
                    this.percentBetweenTargets = 0;
                }
            }
        }
        this.setCurrentPoint();
    }
}

function fillPathDiag() {
    var points = [];
    var len = Math.min(canvas.height, canvas.width);
    for (var i = 40; i <= len - 40; i += len / 5) {
        points.push(new Vec2(i, i));
    }
    return points;
}

function toRad(degs) {
    return degs * (Math.PI / 180);
}

function fillPathCircle() {
    var points = [];
    for (var i = 0; i < 360; i += 60) {
        var rad = toRad(i);
        var radius = 200;
        var nX = (canvas.width / 2) + (radius * Math.cos(rad));
        var nY = (canvas.height / 2) + (radius * Math.sin(rad));
        points.push(new Vec2(nX, nY));
    }
    return points;
}

function eqTrianglePath(halfHeight=1,centerPoint=Vec2){
    var points = [
        Vec2.rotateLocalV(new Vec2(halfHeight,0),toRad(0)).addLocal(centerPoint),
        Vec2.rotateLocalV(new Vec2(halfHeight,0),toRad(120)).addLocal(centerPoint),
        Vec2.rotateLocalV(new Vec2(halfHeight,0),toRad(240)).addLocal(centerPoint),
    ];
    return points;
}

function rectanglePath(halfWidth=1,halfHeight=1,centerPoint=Vec2){
    // clockwise
    var points = [
        new Vec2(-halfWidth,-halfHeight).addLocal(centerPoint),
        new Vec2(-halfWidth,halfHeight).addLocal(centerPoint),
        new Vec2(halfWidth,halfHeight).addLocal(centerPoint),
        new Vec2(halfWidth,-halfHeight).addLocal(centerPoint),
    ]
    return points;
}
// TEST CODE: DO NOT REMOVE
/*
var points = fillPathCircle();
var path = new Path(points, Interpolator.linear, true);

function move() {
    if (keyBoard.isDown(KeyCode.UP_ARROW)) {
        path.forward();
    }
    if (keyBoard.isDown(KeyCode.DOWN_ARROW)) {
        path.backward();
    }
}

function drawCircle(p) {
    gc.arc(p.x, p.y, 5, 0, Math.PI * 2, false);
}
function drawCircleSmall(p) {
    gc.arc(p.x, p.y, 2, 0, Math.PI * 2, false);
}

function draw() {
    gc.clearRect(0, 0, canvas.width, canvas.height);
    // draw all points
    gc.beginPath();
    gc.strokeStyle = "black";
    for (var i = 0; i < path.points.length; i++) {
        drawCircle(path.points[i]);
    }
    gc.closePath();
    gc.stroke();
    // draw spline helper behind
    gc.beginPath();
    gc.fillStyle = "red";
    drawCircle(path.splineHelperBehind);
    gc.fill();
    gc.closePath();
    // draw target behind
    gc.beginPath();
    gc.fillStyle = "green";
    drawCircle(path.targetBehind);
    gc.fill();
    gc.closePath();
    // draw current position
    gc.beginPath();
    gc.fillStyle = "blue";
    drawCircle(path.currentPoint);
    gc.fill();
    gc.closePath();
    // draw target forward
    gc.beginPath();
    gc.fillStyle = "green";
    drawCircle(path.targetForward);
    gc.fill();
    gc.closePath();
    // draw spline helper forward
    gc.beginPath();
    gc.fillStyle = "red";
    drawCircle(path.splineHelperForward);
    gc.fill();
    gc.closePath();
}

function drawSpline() {
    gc.clearRect(0, 0, canvas.width, canvas.height);
    
        //draw path
        gc.beginPath();
        gc.strokeStyle = "blue";
        for (var i = 0; i < path.points.length; i++) {
            var p = path.points[i];
            drawCircle(p);
        }
        gc.stroke();
        gc.closePath(); 

    gc.beginPath();
    gc.strokeStyle = "red";
    for (var i = 1; i < path.points.length - 2; i++) {
        p1 = path.points[i - 1];
        p2 = path.points[i];
        p3 = path.points[i + 1];
        p4 = path.points[i + 2];
        for (var j = 0; j < 1; j += 0.1) {
            var pnt = Interpolator.catmullRom(p1, p2, p3, p4, j);
            drawCircleSmall(pnt);
        }
    }
    gc.stroke();
    gc.closePath();
}

function mainLoop() {
    move();
    draw();
    //drawSpline();
}

// calls 10 times a second
setInterval(mainLoop, 1000 / 60); */