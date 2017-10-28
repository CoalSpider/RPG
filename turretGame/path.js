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

        this.setTransitionPoint(true);
    }

    setTransitionPoint(isForward) {
        var newIndx = this.pathSegments.indexOf(this.currentPath);
        newIndx += (isForward) ? 1 : -1;
        if (newIndx >= this.pathSegments.length || newIndx < 0) {
            // do nothing
        } else {
            var currPoints = this.currentPath.points;
            var nextPoints = this.pathSegments[newIndx].points;
            for (var i = 0; i < nextPoints.length; i++) {
                var indx = currPoints.indexOf(nextPoints[i]);
                if (indx != -1) {
                    this.transitionPoint = currPoints[indx];
                    break;
                }
            }
        }
    }

    movePath(isForward) {
        var newIndx = this.pathSegments.indexOf(this.currentPath);
        newIndx += (isForward) ? 1 : -1;
        if (newIndx >= this.pathSegments.length || newIndx < 0) {
            // do nothing
        } else {
            this.currentPath = this.pathSegments[newIndx];
            this.setTransitionPoint(isForward);
            if(this.currentPath instanceof WrappingSegment && this.pathSegments.length==3){
               /* TODO: modular path building */
                this.pathSegments.splice(0,1);
                this.pathSegments.splice(1,1);
            }
        }
    }

    forward() {
        this.setTransitionPoint(true);
        this.currentPath.forward();
        // essentially we check if we collide with the transition point
        if (distSqrd(this.currentPath.currentPoint, this.transitionPoint) < 1) {
            this.movePath(true);
        }
    }

    backward() {
        this.setTransitionPoint(false);
        this.currentPath.backward();
        // essentially we check if we collide with the transition point
        if (distSqrd(this.currentPath.currentPoint, this.transitionPoint) < 1) {
            this.movePath(false);
        }
    }
}

/* paths are made of segments **/
class WrappingSegment {
    constructor(circularList, interpolationMethod) {
        this.circularList = circularList;
        this.points = circularList.elements;
        if (this.circularList.len() < 4) {
            throw new Error("list must be given at least 4 points");
        }

        this.interpolationMethod = interpolationMethod;
        this.circularList.pointer = this.circularList.len() - 2;

        this.splineHelperBehind = this.circularList.next();
        this.targetBehind = this.circularList.next();
        this.targetForward = this.circularList.next();
        this.splineHelperForward = this.circularList.next();
        this.percentBetweenTargets = 0;

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
            this.circularList.pointer = this.circularList.indexOf(this.splineHelperBehind);
            this.splineHelperBehind = this.circularList.next();
            this.targetBehind = this.circularList.next();
            this.targetForward = this.circularList.next();
            this.splineHelperForward = this.circularList.next();

            this.percentBetweenTargets -= 1;
        }

        this.setCurrentPoint();
    }

    backward() {
        this.percentBetweenTargets -= 0.02;
        if (this.percentBetweenTargets < 0) {
            this.circularList.pointer = this.circularList.indexOf(this.splineHelperForward);
            this.splineHelperForward = this.circularList.previous();
            this.targetForward = this.circularList.previous();
            this.targetBehind = this.circularList.previous();
            this.splineHelperBehind = this.circularList.previous();

            this.percentBetweenTargets += 1;
        }

        this.setCurrentPoint();
    }
}

class Segment {
    constructor(points, interpolationMethod) {
        this.points = points;
        if (this.points.length < 2) {
            throw new Error("list must be given at least 2 points");
        }

        // add duplicate point to start/end for non linear interpolation
        this.points.unshift(this.points[0].sub(new Vec2(5, 5)));
        this.points.push(this.points[this.points.length - 1].add(new Vec2(5, 5)));

        this.interpolationMethod = interpolationMethod;

        this.splineHelperBehind = this.points[0];
        this.targetBehind = this.points[1];
        this.targetForward = this.points[2];
        this.splineHelperForward = this.points[3];
        this.percentBetweenTargets = 0;

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
            var indx = this.points.indexOf(this.splineHelperForward) + 1;
            if (indx > this.points.length - 1) {
                this.percentBetweenTargets = 1;
            } else {
                this.splineHelperBehind = this.points[indx - 3];
                this.targetBehind = this.points[indx - 2];
                this.targetForward = this.points[indx - 1];
                this.splineHelperForward = this.points[indx];
                this.percentBetweenTargets -= 1;
            }
        }

        this.setCurrentPoint();
    }

    backward() {
        this.percentBetweenTargets -= 0.02;
        if (this.percentBetweenTargets < 0) {
            var indx = this.points.indexOf(this.splineHelperBehind) - 1;
            if (indx < 0) {
                this.percentBetweenTargets = 0;
            } else {
                this.splineHelperBehind = this.points[indx];
                this.targetBehind = this.points[indx + 1];
                this.targetForward = this.points[indx + 2];
                this.splineHelperForward = this.points[indx + 3];
                this.percentBetweenTargets += 1;
            }
        }

        this.setCurrentPoint();
    }
}
var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");
var keyboard = new Keyboard();
keyboard.listenForEvents();

function fillPathCircle() {
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

function pathBefore(hookPoint) {
    var points = [];
    points.push(new Vec2(25, canvas.height / 2));
    points.push(points[0].add(new Vec2(25, 0)));
    points.push(points[1].add(new Vec2(25, 0)));
    points.push(points[2].add(new Vec2(25, 0)));
    points.push(points[3].add(new Vec2(25, 0)));
    points.push(points[4].add(new Vec2(25, 0)));
    points.push(hookPoint);
    return points;
}

function pathAfter(hookPoint) {
    var points = [];
    points.push(hookPoint);
    points.push(points[0].add(new Vec2(25, 0)));
    points.push(points[1].add(new Vec2(25, 0)));
    points.push(points[2].add(new Vec2(25, 0)));
    points.push(points[3].add(new Vec2(25, 0)));
    points.push(points[4].add(new Vec2(25, 0)));
    points.push(points[5].add(new Vec2(25, 0)));
    return points;
}

var pathSeg = new WrappingSegment(new CircularList(fillPathCircle()), Interpolator.catmullRom);
var pathBefore = new Segment(pathBefore(pathSeg.circularList.get(0)), Interpolator.linear);
var pathAfter = new Segment(pathAfter(pathSeg.circularList.get(3)), Interpolator.linear);
var path = new Path([pathBefore, pathSeg, pathAfter]);

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

function drawWrappingPath() {
    drawPath(pathSeg.circularList.elements, "purple");
    drawLinearInterpolation(pathSeg.circularList.elements, "yellow");
    drawCatmullRomInterpolation(pathSeg.circularList.elements, "orange");

    // draw points of intrest
    drawPoint(pathSeg.splineHelperForward, "pink");
    drawPoint(pathSeg.targetForward, "blue");
    drawPoint(pathSeg.targetBehind, "green");
    drawPoint(pathSeg.splineHelperBehind, "red");
    drawPoint(pathSeg.currentPoint, "white");
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

function mainLoop() {
    gc.strokeStyle = "black";
    gc.fillStyle = "black";
    gc.fillRect(0, 0, canvas.width, canvas.height);
    if (keyboard.isDown(KeyCode.UP_ARROW)) {
        path.forward();
    } else if (keyboard.isDown(KeyCode.DOWN_ARROW)) {
        path.backward();
    }

    drawWrappingPath();

    drawRegPath(pathBefore);

    drawRegPath(pathAfter);
}

setInterval(mainLoop, 1000 / 60);