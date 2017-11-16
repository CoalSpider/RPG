
class Track {
    constructor(parts = []) {
        this.parts = parts;
        this.current = parts[0];

        this.transitionPoint = this.current.linkForward;
        this.scrolling = false;
    }

    moveTrack(isForward) {
        var newIndx = this.parts.indexOf(this.current);
        newIndx += (isForward) ? 1 : -1;

        if (newIndx < this.parts.length && newIndx >= 0) {
            this.current = this.parts[newIndx];
            console.log("moved track");
            this.transitionPoint = this.current.linkForward;
        }
    }

    hitTransition() {
        return distSqrd(this.current.currentPoint, this.transitionPoint) < 1;
    }

    forward() {
        for (var i = 0; i < this.current.events.length; i++) {
            if (this.current.events[i].ended == true) {
                this.current.events.splice(i, 1);
                i--;
            }
        }
        if (this.current.events.length > 0) {
            if (this.current.events[0].started == false) {
                this.current.events[0].start();
            }
            var pnts = this.current.points;
            var mid = pnts[0].add(pnts[pnts.length - 1].sub(pnts[0]).multLocal(0.5));
            // if were in the middle of the current track
            if (distSqrd(this.current.currentPoint, mid) < 1) {
                console.log("scrolling");
               this.scrolling = true;
            } else {
                this.current.forward();
            }
        } else {
            this.scrolling = false;
            this.current.forward();
            if (this.transitionPoint != undefined && this.hitTransition()) {
                this.moveTrack(true);
            }
        }
        /*
        this.current.forward();
        if (this.transitionPoint != undefined && this.hitTransition()) {
            this.moveTrack(true);
        }*/
    }

    backward() {
        this.current.backward();
        if (this.transitionPoint != undefined && this.hitTransition()) {
            this.moveTrack(false);
        }
    }
}
class TrackPart {
    constructor(points = [], interpolationMethod, isWrapping = false) {
        if (isWrapping) {
            if (points.length < 4) {
                throw new Error("wrapping Track must be at least 4 points");
            }
        } else {
            if (points.length < 2) {
                throw new Error("non wrapping Track must be at least 2 points");
            }
        }
        this.circularList = new CircularList(points);
        this.points = this.circularList.elements;
        this.interpolationMethod = interpolationMethod;

        this.percentBetweenTargets = 0;

        this.isWrapping = isWrapping;

        // if theres no objective the Track does not wrap from start to end
        if (this.isWrapping) {
            // we want the target forward to be indx 0
            this.circularList.pointer = this.circularList.len() - 2;

            this.splineHelperBehind = this.circularList.next();
            this.targetBehind = this.circularList.next();
            this.targetForward = this.circularList.next();
            this.splineHelperForward = this.circularList.next();
        } else {
            // add duplicate points so the player can appear at the end of
            // the Track but interpolation still works
            // shift end points a little so we can debug
            this.circularList.unshift(this.circularList.get(0).sub(new Vec2(0, 0)));
            this.circularList.push(this.circularList.get(this.circularList.len() - 1).add(new Vec2(0, 0)));

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
        this.percentBetweenTargets += 0.04;
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
        this.percentBetweenTargets -= 0.04;
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

/** TODO: calc from base then shift as tracks link together */
function calcImgPosCatmull(points){
    var result = [];
    for(var i = 0; i < points.length; i++){
        var p1 = points[(i + 0) % points.length];
        var p2 = points[(i + 1) % points.length];
        var p3 = points[(i + 2) % points.length];
        var p4 = points[(i + 3) % points.length];
        var step = 0.2;
        for (var j = 0.1; j < 1; j += step) {
            var ip1 = Interpolator.catmullRom(p1, p2, p3, p4, j-0.1);
            var ip2 = Interpolator.catmullRom(p1, p2, p3, p4, j);
            var rad = angleBetween(ip1, ip2);
            var pos = new Vec2(ip1.x, ip1.y);
            result.push({position:pos,angleRad:rad});
        }
    }
    return result;
}

function calcImgPosLinear(points){
    var result = [];
    for(var i = 0; i < points.length-1; i++){
        var p1 = points[i];
        var p2 = points[i + 1];
        var step = 0.2;
        for (var j = 0.1; j < 1; j += step) {
            var ip1 = Interpolator.linear(p1, p2, j-0.1);
            var ip2 = Interpolator.linear(p1, p2, j);
            var rad = angleBetween(ip1, ip2);
            var pos = new Vec2(ip1.x, ip1.y);
            result.push({position:pos,angleRad:rad});
        }
    }
    return result;
}

function circlePoints() {
    var points = [];
    for (var i = 0; i < 360; i += 30) {
        var rad = toRad(i + 180);
        var radius = 200;
        var nX = (canvas.width / 2) + (radius * Math.cos(rad));
        var nY = (canvas.height / 2) + (radius * Math.sin(rad));
        points.push(new Vec2(nX, nY));
    }
    return points;
}

function linePoints() {
    var points = [];
    points.push(new Vec2(-100, 0));
    for (var i = 0; i < 10; i++) {
        points.push(points[points.length - 1].add(new Vec2(100, 0)));
    }
    return points;
}

function eqTrianglePoints(halfHeight = 1) {
    var points = [
        Vec2.rotateLocalV(new Vec2(halfHeight, 0), toRad(0)),
        Vec2.rotateLocalV(new Vec2(halfHeight, 0), toRad(120)),
        Vec2.rotateLocalV(new Vec2(halfHeight, 0), toRad(240)),
    ];
    return points;
}

function rectanglePoints(halfWidth = 1, halfHeight = 1) {
    // clockwise
    var points = [
        new Vec2(-halfWidth, -halfHeight),
        new Vec2(-halfWidth, halfHeight),
        new Vec2(halfWidth, halfHeight),
        new Vec2(halfWidth, -halfHeight),
    ]
    return points;
}

class LinkingTrackPart extends TrackPart {
    constructor(points, interpolationMethod, isWrapping, linkBehind, linkForward) {
        super(points, interpolationMethod, isWrapping);
        this.linkBehind = linkBehind;
        this.linkForward = linkForward;
        this.events = [];
    }
}

class TrackBuilder {
    static buildCircle() {
        var points = circlePoints();
        var linkBehind = points[0];
        var linkForward = points[3];
        return new LinkingTrackPart(points, Interpolator.catmullRom, true, linkBehind, linkForward);
    }

    static shiftTrack(trackpart = LinkingTrackPart, shift = Vec2) {
        for (var i = 0; i < trackpart.points.length; i++) {
            trackpart.points[i].addLocal(shift);
        }

        // rest interpolation points
        trackpart.forward();
        trackpart.backward();

        return trackpart;
    }

    static buildHoizontalLine() {
        var points = linePoints();
        var linkBehind = points[0];
        var linkForward = points[points.length - 1];
        return new LinkingTrackPart(points, Interpolator.linear, false, linkBehind, linkForward);
    }

    static linkBToA(linkingTrackB = LinkingTrackPart, linkingTrackA = LinkingTrackPart) {
        // tracks are built onto origin so we need to move them
        var dX = linkingTrackA.linkForward.x - linkingTrackB.linkBehind.x;
        var dY = linkingTrackA.linkForward.y - linkingTrackB.linkBehind.y;
        var delta = new Vec2(dX, dY);
        for (var i = 0; i < linkingTrackB.points.length; i++) {
            linkingTrackB.points[i].addLocal(delta);
        }
        // attach!
        linkingTrackB.linkBehind = linkingTrackA.linkForward;

        // rest interpolation points
        linkingTrackB.forward();
        linkingTrackB.backward();
    }

    static linkTracks(trackParts = []) {
        for (var i = 1; i < trackParts.length; i++) {
            TrackBuilder.linkBToA(trackParts[i], trackParts[i - 1]);
        }
    }
}
/* TEST CODE DO NOT DELETE */
/*
var canvas = document.getElementById("canvas");
var gc = canvas.getContext("2d");
var keyboard = new Keyboard();
keyboard.listenForEvents();
var camera = new Vec2(-canvas.width / 2, -canvas.height / 2);

var track = new Track([
    TrackBuilder.shiftTrack(TrackBuilder.buildHoizontalLine(), new Vec2(50, canvas.height / 2)),
    TrackBuilder.buildHoizontalLine(),
    TrackBuilder.buildHoizontalLine(),
    TrackBuilder.buildCircle(),
    TrackBuilder.buildHoizontalLine(),
    TrackBuilder.buildHoizontalLine(),
    TrackBuilder.buildCircle(),
    TrackBuilder.buildHoizontalLine(),
    TrackBuilder.buildHoizontalLine(),
    TrackBuilder.buildCircle(),
]);

TrackBuilder.linkTracks(track.parts);

camera = new Vec2(0, 0);

function mainLoop() {
    if (keyboard.isDown(KeyCode.UP_ARROW)) {
        track.forward();
    } else if (keyboard.isDown(KeyCode.DOWN_ARROW)) {
        track.backward();
    }

    camera = new Vec2(-canvas.width / 2, -canvas.height / 2).addLocal(track.current.currentPoint);

    clearScreen();
    for (var i = 0; i < track.parts.length; i++) {
        if (track.parts[i].isWrapping) {
            drawWrappingTrack(track.parts[i]);
        } else {
            drawRegTrack(track.parts[i]);
        }
    }
}











function clearScreen() {
    gc.strokeStyle = "black";
    gc.fillStyle = "black";
    gc.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCircle(point, radius) {
    gc.arc(point.x - camera.x, point.y - camera.y, radius, 0, Math.PI * 2, false);
}

function drawPoint(point, color) {
    gc.fillStyle = color;
    gc.beginPath();
    drawCircle(point, 5);
    gc.fill();
    gc.closePath();
}

function drawTrack(points, color) {
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

function drawWrappingTrack(track) {
    drawTrack(track.circularList.elements, "purple");
    // drawLinearInterpolation(track.circularList.elements, "yellow");
    // drawCatmullRomInterpolation(track.circularList.elements, "orange");

    // draw points of intrest
    drawPoint(track.splineHelperForward, "pink");
    drawPoint(track.targetForward, "blue");
    drawPoint(track.targetBehind, "green");
    drawPoint(track.splineHelperBehind, "red");
    drawPoint(track.currentPoint, "white");
}

function drawRegTrack(track) {
    drawTrack(track.points, "white");
    // drawLinearInterpolation(Track.points,"yellow");
    // drawCatmullRomInterpolation(Track.points,"orange");

    // draw points of intrest
    drawPoint(track.splineHelperBehind, "red");
    drawPoint(track.targetBehind, "green");
    drawPoint(track.targetForward, "blue");
    drawPoint(track.splineHelperForward, "pink");
    drawPoint(track.currentPoint, "white");
}

setInterval(mainLoop, 1000 / 60); */