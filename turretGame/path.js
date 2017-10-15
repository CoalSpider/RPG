var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");

// set up keyboard
var keyBoard = new Keyboard();
keyBoard.listenForEvents();
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Interpolator {
    constructor() { }

    /** 
     * mu = percent;
     * result = p1 + mu*(p2 - p1)
     * or
     * result = p1*(1-mu) + p2*mu;
     */
    static linear(p1, p2, percent) {
        var nX = p1.x + percent * (p2.x - p1.x);
        var nY = p1.y + percent * (p2.y - p1.y);
        return new Point(nX, nY);
    }

    static normalizedLinear(p1, p2, percent) {
        var lerp = linear(p1, p2, percent);
        var len = Math.sqrt(lerp.x * lerp.x + lerp.y * lerp.y);
        lerp.x /= len;
        lerp.y /= len;
        return lerp;
    }

    static sphericalLinear(p1, p2, percent) {
        var dot = p1.x * p2.x + p1.y * p2.y;
        // clamp between -1 and 1
        dot = Math.min(1.0, Math.max(-1.0, dot));
        // get angle between start and end
        var theta = Math.acos(dot) * percent;
        // relative vector
        var rX = p2.x - p1.x * dot;
        var rY = p2.y - p1.y * dot;
        // normalize relative vector
        var len = Math.sqrt(rX * rX + rY * rY);
        rX /= len;
        rY /= len;
        // result
        var nX = p1.x * Math.cos(theta) + rX * Math.sin(theta);
        var nY = p1.y * Math.cos(theta) + rY * Math.sin(theta);
        return new Point(nX, nY);
    }

    /** same as linear except the percent is calculated as:
     * (1 - cos(percent*PI)) / 2.0
     */
    static cosine(p1, p2, percent) {
        var newPercent = (1 - Math.cos(percent * Math.PI)) / 2.0;
        return Interpolator.linear(p1, p2, newPercent);
    }

    /** 
     * mu = percent;
     * mu2 = percent*percent
     * a0 = p3 - p2 - p0 + p1;
     * a1 = p0 - p1 - a0;
     * a2 = p2 - p0;
     * a3 = p1;
     * result = a0*mu*mu2 + a1*mu2 + a2*mu + a3;
     */
    static cubic(p0, p1, p2, p3, percent) {
        var mu2 = percent * percent;
        var a0x = p3.x - p2.x - p0.x + p1.x;
        var a0y = p3.y - p2.y - p0.y + p1.y;
        var a1x = p0.x - p1.x - a0x;
        var a1y = p0.y - p1.y - a0y;
        var a2x = p2.x - p0.x;
        var a2y = p2.y - p0.y;
        var a3x = p1.x;
        var a3y = p1.y;
        var nX = a0x * percent * mu2 + a1x * mu2 + a2x * percent + a3x;
        var nY = a0y * percent * mu2 + a1y * mu2 + a2y * percent + a3y;
        return new Point(nX, nY);
    }

    /**
     * mu = percent;
     * mu2 = percent*percent;
     * a0 = -0.5*p0 + 1.5*p1 - 1.5*p2 + 0.5*p3;
     * a1 =      p0 - 2.5*p1 + 2.0*p2 - 0.5*p3;
     * a2 = -0.5*p0          + 0.5*p2;
     * a1 =               p1
     * result = a0*mu*mu2 + a1*mu2 + a2*mu + a3;
     */
    static catmullRom(p0, p1, p2, p3, percent) {
        var mu2 = percent * percent;
        var a0x = -0.5 * p0.x + 1.5 * p1.x - 1.5 * p2.x + 0.5 * p3.x;
        var a0y = -0.5 * p0.y + 1.5 * p1.y - 1.5 * p2.y + 0.5 * p3.y;
        var a1x = p0.x - 2.5 * p1.x + 2 * p2.x - 0.5 * p3.x;
        var a1y = p0.y - 2.5 * p1.y + 2 * p2.y - 0.5 * p3.y;
        var a2x = -0.5 * p0.x + 0.5 * p2.x;
        var a2y = -0.5 * p0.y + 0.5 * p2.y;
        var a3x = p1.x;
        var a3y = p1.y;
        var nX = a0x * percent * mu2 + a1x * mu2 + a2x * percent + a3x;
        var nY = a0y * percent * mu2 + a1y * mu2 + a2y * percent + a3y;
        return new Point(nX, nY);
    }

    /** 
     * mu = percent;
     * mu2 = mu*mu;
     * mu3 = mu2*mu;
     * m0  = (p1-p0) * (1+bias) * (1-tension)/2;
     * m0 += (p2-p1) * (1-bias) * (1-tension)/2;
     * m1  = (p2-p1) * (1+bias) * (1-tension)/2;
     * m1 += (p3-p2) * (1-bias) * (1-tension)/2;
     * a0 =  2*mu3 - 3*mu2 + 1;
     * a1 =    mu3 - 2*mu2 + mu;
     * a2 =    mu3 -   mu2;
     * a3 = -2*mu3 + 3*mu2;
     * 
     * result = a0*p1 + a1*m0 + a2*m1 + a3*p2;
     */
    static hermite(p0, p1, p2, p3, percent, tension, bias) {
        var m0x, m0y, m1x, m1y, mu2, mu3;
        var a0, a1, a2, a3;
        var nX, nY;

        var t0 = (1 - tension) / 2
        var t1 = (1 + bias) * t0;
        var t2 = (1 - bias) * t0;

        mu2 = percent * percent;
        mu3 = mu2 * percent;

        m0x = (p1.x - p0.x) * t1;
        m0y = (p1.y - p0.y) * t1;
        m0x += (p2.x - p1.x) * t2;
        m0y += (p2.y - p1.y) * t2;
        m1x = (p2.x - p1.x) * t1;
        m1y = (p2.y - p1.y) * t1;
        m1x += (p3.x - p2.x) * t2;
        m1y += (p3.y - p2.y) * t2;

        a0 = 2 * mu3 - 3 * mu2 + 1;
        a1 = mu3 - 2 * mu2 + percent;
        a2 = mu3 - mu2;
        a3 = -2 * mu3 + 3 * mu2;

        var nX = a0 * p1.x + a1 * m0x + a2 * m1x + a3 * p2.x;
        var nY = a0 * p1.y + a1 * m0y + a2 * m1y + a3 * p2.y;
        return new Point(nX, nY);
    }

}
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

    /** TODO: fix modulus wrapping */
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
        points.push(new Point(i, i));
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
        points.push(new Point(nX, nY));
    }
    return points;
}/*
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