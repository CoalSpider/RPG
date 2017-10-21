"use strict";
/** KeyCode enum mapping a keys name to the corresponding event.getKeyCode*/
var KeyCode = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    PAUSE: 19,
    BREAK: 19,
    CAPS_LOCK: 20,
    ESCAPE: 27,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    INSERT: 45,
    DELETE: 46,
    ZERO: 48,
    ONE: 49,
    TWO: 50,
    THREE: 51,
    FOUR: 52,
    FIVE: 53,
    SIX: 54,
    SEVEN: 55,
    EIGHT: 56,
    NINE: 57,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    LEFT_WINDOW_KEY: 91,
    RIGHT_WINDOW_KEY: 92,
    SELECT_KEY: 93,
    NUMPAD_0: 96,
    NUMPAD_1: 97,
    NUMPAD_2: 98,
    NUMPAD_3: 99,
    NUMPAD_4: 100,
    NUMPAD_5: 101,
    NUMPAD_6: 102,
    NUMPAD_7: 103,
    NUMPAD_8: 104,
    NUMPAD_9: 105,
    MULTIPLY: 106,
    ADD: 107,
    SUBTRACT: 109,
    DECIMAL_POINT: 110,
    DIVIDE: 111,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    NUM_LOCK: 144,
    SCROLL_LOCK: 145,
    SEMI_COLON: 186,
    EQUAL_SIGN: 187,
    COMMA: 188,
    DASH: 189,
    PERIOD: 190,
    FORWARD_SLASH: 191,
    GRAVE_ACCENT: 192,
    OPEN_BRACKET: 219,
    BACK_SLASH: 220,
    CLOSE_BRACKET: 221,
    SINGLE_QUOTE: 222,
}
/* PREVENT OBJECT MODIFICATION */
Object.freeze(KeyCode);

class Keyboard {
    constructor() {
        this.keysDown = [];
    }

    listenForEvents() {
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    };

    onKeyDown(event) {
        var keyCode = event.keyCode;
        if (this.isDown(keyCode) == false) {
            this.keysDown.push(keyCode);
        }
    }

    onKeyUp(event) {
        var keyCode = event.keyCode;
        var index = this.keysDown.indexOf(keyCode);
        if (index != -1) {
            this.keysDown.splice(index, 1);
        }
    }

    isDown(keyCode) {
        return this.keysDown.indexOf(keyCode) != -1;
    }
}

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
        return new Vec2(nX, nY);
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
        return new Vec2(nX, nY);
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
        return new Vec2(nX, nY);
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
        return new Vec2(nX, nY);
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
        return new Vec2(nX, nY);
    }

}

function rgb(r, g, b) {
    return ("rgb(" + r + "," + g + "," + b + ")");
}

function rgba(r, g, b, a) {
    return ("rgb(" + r + "," + g + "," + b + "," + a + ")");
}

/* clamps the given value between min and max */
function clamp(min,max,val){
    return Math.max(min,Math.min(val,max));
}

/* args == two xy pairs */
function distSqrd(p0, p1) {
    var dx = p1.x - p0.x;
    var dy = p1.y - p0.y;
    return dx * dx + dy * dy;
}

/* args == two xy pairs */
function dist(p0, p1) {
    return Math.sqrt(distSqrd(p0, p1));
}

function distSqrdPointLine(p,a,b){
    return distSqrd(p,Vec2.segmentVecProj(p,a,b));
}

function distPointLine(p,a,b){
    return Math.sqrt(distSqrdPointLine(p,a,b));
}

/* args == two circles defined by a point and a radius*/
function circleCircleCollision(p0, r0, p1, r1) {
    var ds = distSqrd(p0, p1);
    var minLen = r0 * r0 + r1 * r1;
    return ds < minLen;
}

/* args == circle defined by a point+radius and a rectangle defined by a rectBounds and point*/
function circleBoxCollision(p0, r0, p1, rectBounds) {
    var pnts = rectBounds.getPoints(p1);
    var r1 = pnts[0];
    var r2 = pnts[1];
    var r3 = pnts[2];
    var r4 = pnts[3];
    var minDistSqrd = r0 * r0;
    if (distSqrdPointLine(p0, r1, r2) < minDistSqrd) {
        return true;
    }
    if (distSqrdPointLine(p0, r2, r3) < minDistSqrd) {
        return true;
    }
    if (distSqrdPointLine(p0, r3, r4) < minDistSqrd) {
        return true;
    }
    if (distSqrdPointLine(p0, r4, r1) < minDistSqrd) {
        return true;
    }
    return false;
}