/*function fillPathDiag() {
    var points = [];
    var len = Math.min(canvas.height, canvas.width);
    for (var i = 40; i <= len - 40; i += len / 5) {
        points.push(new Vec2(i, i));
    }
    return points;
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

function eqTrianglePath(halfHeight = 1, centerPoint = Vec2) {
    var points = [
        Vec2.rotateLocalV(new Vec2(halfHeight, 0), toRad(0)).addLocal(centerPoint),
        Vec2.rotateLocalV(new Vec2(halfHeight, 0), toRad(120)).addLocal(centerPoint),
        Vec2.rotateLocalV(new Vec2(halfHeight, 0), toRad(240)).addLocal(centerPoint),
    ];
    return points;
}

function rectanglePath(halfWidth = 1, halfHeight = 1, centerPoint = Vec2) {
    // clockwise
    var points = [
        new Vec2(-halfWidth, -halfHeight).addLocal(centerPoint),
        new Vec2(-halfWidth, halfHeight).addLocal(centerPoint),
        new Vec2(halfWidth, halfHeight).addLocal(centerPoint),
        new Vec2(halfWidth, -halfHeight).addLocal(centerPoint),
    ]
    return points;
} */
class Path {
    constructor(pathSegments = []) {
        this.pathSegments = pathSegments;
        this.currentPath = pathSegments[0];

       this.transitionPoint = this.currentPath.attachmentPoint;
    }
    addTrack(track){
        this.pathSegments.push(track);
        this.transitionPoint = track.attachmentPoint;
    }

    movePath(isForward){
        var newIndx = this.pathSegments.indexOf(this.currentPath);
        newIndx += (isForward) ? 1 : -1;
        if (newIndx >= this.pathSegments.length || newIndx < 0) {
            // do nothing
        } else {
            this.currentPath = this.pathSegments[newIndx];
            if (this.pathSegments.length > 1) {
                this.pathSegments.splice(0, 1);
            }
        }
    }

    forward() {
        this.currentPath.track.forward();
        // no valid point so just return
        if (this.transitionPoint == undefined) return;
        // essentially we check if we collide with the transition point
        if (distSqrd(this.currentPath.track.currentPoint, this.transitionPoint) < 1) {
            this.movePath(true);
        }
    }

    backward() {
        this.currentPath.track.backward();
        // no valid point so just return
        if (this.transitionPoint == undefined) return;
        // essentially we check if we collide with the transition point
        if (distSqrd(this.currentPath.track.currentPoint, this.transitionPoint) < 1) {
            this.movePath(false);
        }
    }
}
class TrackPart {
    constructor(points = [], interpolationMethod, isWrapping = false) {
        if (isWrapping) {
            if (points.length < 4) {
                throw new Error("wrapping path must be at least 4 points");
            }
        } else {
            if (points.length < 2) {
                throw new Error("non wrapping path must be at least 2 points");
            }
        }
        this.circularList = new CircularList(points);
        this.points = this.circularList.elements;
        this.interpolationMethod = interpolationMethod;

        this.percentBetweenTargets = 0;

        this.isWrapping = isWrapping;

        // if theres no objective the path does not wrap from start to end
        if (this.isWrapping) {
            // we want the target forward to be indx 0
            this.circularList.pointer = this.circularList.len() - 2;

            this.splineHelperBehind = this.circularList.next();
            this.targetBehind = this.circularList.next();
            this.targetForward = this.circularList.next();
            this.splineHelperForward = this.circularList.next();
        } else {
            // add duplicate points so the player can appear at the end of
            // the path but interpolation still works
            // shift end points a little so we can debug
            this.circularList.unshift(this.circularList.get(0).sub(new Vec2(5, 5)));
            this.circularList.push(this.circularList.get(this.circularList.len() - 1).add(new Vec2(5, 5)));

            this.splineHelperBehind = this.circularList.get(0);
            this.targetBehind = this.circularList.get(1);
            this.targetForward = this.circularList.get(2);
            this.splineHelperForward = this.circularList.get(3);
        }

        this.setCurrentPoint();
    }

    setCurrentPoint() {
        if (this.interpolationMethod == Interpolator.linear) {
            this.currentPoint = this.interpolationMethod(
                this.targetBehind,
                this.targetForward,
                this.percentBetweenTargets
            );
        } else if (this.interpolationMethod == Interpolator.hermite) {
            this.currentPoint = this.interpolationMethod(
                this.splineHelperBehind,
                this.targetBehind,
                this.targetForward,
                this.splineHelperForward,
                this.percentBetweenTargets,
                0, // bias
                0 // tolerance
            );
        } else {
            this.currentPoint = this.interpolationMethod(
                this.splineHelperBehind,
                this.targetBehind,
                this.targetForward,
                this.splineHelperForward,
                this.percentBetweenTargets
            );
        }
    }

    forward() {
        this.percentBetweenTargets += 0.02;
        if (this.percentBetweenTargets >= 1) {
            if (this.isWrapping) {
                this.circularList.pointer = this.circularList.indexOf(this.splineHelperBehind);

                this.splineHelperBehind = this.circularList.next();
                this.targetBehind = this.circularList.next();
                this.targetForward = this.circularList.next();
                this.splineHelperForward = this.circularList.next();

                this.percentBetweenTargets -= 1;
            } else {
                var indx = this.circularList.indexOf(this.splineHelperForward) + 1;
                if (indx > this.circularList.len() - 1) {
                    this.percentBetweenTargets = 1;
                } else {
                    this.circularList.pointer = indx + 1;

                    this.splineHelperForward = this.circularList.previous();
                    this.targetForward = this.circularList.previous();
                    this.targetBehind = this.circularList.previous();
                    this.splineHelperBehind = this.circularList.previous();

                    this.percentBetweenTargets -= 1;
                }
            }
        }

        this.setCurrentPoint();
    }

    backward() {
        this.percentBetweenTargets -= 0.02;
        if (this.percentBetweenTargets < 0) {
            if (this.isWrapping) {
                this.circularList.pointer = this.circularList.indexOf(this.splineHelperForward);

                this.splineHelperForward = this.circularList.previous();
                this.targetForward = this.circularList.previous();
                this.targetBehind = this.circularList.previous();
                this.splineHelperBehind = this.circularList.previous();

                this.percentBetweenTargets += 1;
            } else {
                var indx = this.circularList.indexOf(this.splineHelperBehind) - 1;
                if (indx < 0) {
                    this.percentBetweenTargets = 0;
                } else {
                    this.circularList.pointer = indx - 1;

                    this.splineHelperBehind = this.circularList.next();
                    this.targetBehind = this.circularList.next();
                    this.targetForward = this.circularList.next();
                    this.splineHelperForward = this.circularList.next();

                    this.percentBetweenTargets += 1;
                }
            }
        }
        this.setCurrentPoint();
    }
}

function circlePoints(){
    var points = [];
    for (var i = 0; i < 360; i += 60) {
        var rad = toRad(i + 180);
        var radius = 150;
        var nX = (canvas.width / 2) + (radius * Math.cos(rad));
        var nY = (canvas.height / 2) + (radius * Math.sin(rad));
        points.push(new Vec2(nX, nY));
    }
    return points;
}

function linePoints(){
    var points = [];
    points.push(new Vec2(0,0));
    for (var i = 0; i < 5; i++) {
        points.push(points[points.length - 1].add(new Vec2(25, 0)));
    }
    return points;
}

class CircleTrack{
    constructor(attachmentPoint){
        var points = circlePoints();
        var circleAttach = points[0];
        var dX = attachmentPoint.x - circleAttach.x;
        var dY = attachmentPoint.y - circleAttach.y;
        var delta = new Vec2(dX,dY);
        // shift to match attachment point
        for(var i = 0; i < points.length; i++){
            points[i].addLocal(delta);
        }
        this.track = new TrackPart(points,Interpolator.catmullRom,true);
        this.attachmentPoint = attachmentPoint;
        this.anchorPoint = points[3];
    }
}

class LineTrack{
    constructor(attachmentPoint){
        var points = linePoints();
        var lineAttach = points[0];
        var dX = attachmentPoint.x - lineAttach.x;
        var dY = attachmentPoint.y - lineAttach.y;
        var delta = new Vec2(dX,dY);
        // shift to match attachment point
        for(var i = 0; i < points.length; i++){
            points[i].addLocal(delta);
        }
        this.track = new TrackPart(points,Interpolator.linear,false);
        this.attachmentPoint = attachmentPoint;
        this.anchorPoint = points[points.length-2];
    }
}

var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");
var keyboard = new Keyboard();
keyboard.listenForEvents();

var path = new Path([
    new LineTrack(new Vec2(50,canvas.height/2))
]);

function drawCircle(point, radius) {
    gc.arc(point.x, point.y, radius, 0, Math.PI * 2, false);
}

function drawPoint(point, color) {
    gc.fillStyle = color;
    gc.beginPath();
    drawCircle(point, 5);
    gc.fill();
    gc.closePath();
}

function drawPath(points, color) {
    gc.strokeStyle = color;
    gc.beginPath();
    for (var i = 0; i < points.length; i++) {
        drawCircle(points[i], 5);
    }
    gc.stroke();
    gc.closePath();
}

function drawLinearInterpolation(points, color) {
    gc.beginPath();
    gc.strokeStyle = color;
    var mod = points.length;
    for (var i = 0; i < points.length; i++) {
        var curr = points[i % mod];
        var next = points[(i + 1) % mod];
        for (var j = 0; j <= 1; j += 0.1) {
            var pnt = Interpolator.linear(curr, next, j);
            drawCircle(pnt, 2);
        }
    }
    gc.closePath();
    gc.stroke();
}

function drawCatmullRomInterpolation(points, color) {
    gc.beginPath();
    gc.strokeStyle = color;
    var mod = points.length;
    for (var i = 0; i < points.length; i++) {
        var p1 = points[i % mod];
        var p2 = points[(i + 1) % mod];
        var p3 = points[(i + 2) % mod];
        var p4 = points[(i + 3) % mod];
        for (var j = 0; j <= 1; j += 0.1) {
            var pnt = Interpolator.catmullRom(p1, p2, p3, p4, j);
            drawCircle(pnt, 2);
        }
    }
    gc.closePath();
    gc.stroke();
}

function drawWrappingPath(path) {
    drawPath(path.circularList.elements, "purple");
    drawLinearInterpolation(path.circularList.elements, "yellow");
    drawCatmullRomInterpolation(path.circularList.elements, "orange");

    // draw points of intrest
    drawPoint(path.splineHelperForward, "pink");
    drawPoint(path.targetForward, "blue");
    drawPoint(path.targetBehind, "green");
    drawPoint(path.splineHelperBehind, "red");
    drawPoint(path.currentPoint, "white");
}

function drawRegPath(path) {
    drawPath(path.points, "white");
    // drawLinearInterpolation(path.points,"yellow");
    // drawCatmullRomInterpolation(path.points,"orange");

    // draw points of intrest
    drawPoint(path.splineHelperBehind, "red");
    drawPoint(path.targetBehind, "green");
    drawPoint(path.targetForward, "blue");
    drawPoint(path.splineHelperForward, "pink");
    drawPoint(path.currentPoint, "white");
}
var next = false;

function mainLoop() {
    gc.strokeStyle = "black";
    gc.fillStyle = "black";
    gc.fillRect(0, 0, canvas.width, canvas.height);
    if (keyboard.isDown(KeyCode.UP_ARROW)) {
        path.forward();
    } else if (keyboard.isDown(KeyCode.DOWN_ARROW)) {
        path.backward();
    }
    if (keyboard.isDown(KeyCode.P)) {
        if (path.pathSegments.length < 2) {
            console.log("added");
            if (next) {
                path.addTrack(new LineTrack(path.pathSegments[path.pathSegments.length-1].anchorPoint));
            } else {
                path.addTrack(new CircleTrack(path.pathSegments[path.pathSegments.length-1].anchorPoint));
                next = true;
            }
        }
    }

    //  drawWrappingPath();

    // drawRegPath(pathBefore);

    //  drawRegPath(pathAfter);

    console.log("pathsNum = " + path.pathSegments.length);
    for (var i = 0; i < path.pathSegments.length; i++) {
        if (path.pathSegments[i].track.isWrapping) {
            drawWrappingPath(path.pathSegments[i].track);
        } else {
            drawRegPath(path.pathSegments[i].track);
        }
    }
}

setInterval(mainLoop, 1000 / 60);