class AxisRectBounds {
    constructor(halfWidth, halfHeight) {
        this.halfWidth = halfWidth;
        this.halfHeight = halfHeight;
        /* centered on origin, counter-clock-wise, ordering */
        this.basePoints = [
            new Vec2(-this.halfWidth, -this.halfHeight),
            new Vec2(-this.halfWidth, +this.halfHeight),
            new Vec2(+this.halfWidth, +this.halfHeight),
            new Vec2(+this.halfWidth, -this.halfHeight),
        ];
    }

    getPoints(translation) {
        var newPoints = [];
        var len = this.basePoints.length;
        for (var i = 0; i < len; i++) {
            var p = basePoints[i];
            newPoints.push(
                new Vec2(p.x + translation.x, p.y + translation.y)
            );
        }
        return newPoints;
    }
}
class RectBounds extends AxisRectBounds {
    constructor(halfWidth, halfHeight, angleRad, shift) {
        super(halfWidth, halfHeight);
        this.angleRad = angleRad;
        if (shift != undefined) {
            for (var i = 0, j = this.basePoints.length; i < j; i++) {
                this.basePoints[i].x += shift.x;
                this.basePoints[i].y += shift.y;
            }
        }
    }

    getPoints(translation) {
        var sin = Math.sin(this.angleRad);
        var cos = Math.cos(this.angleRad);
        /* counter-clock-wise order */
        var newPoints = [];
        for (var i = 0; i < this.basePoints.length; i++) {
            /* points centered around origin */
            var p = this.basePoints[i];
            /* rotate */
            var nX = (p.x * cos) - (p.y * sin);
            var nY = (p.x * sin) + (p.y * cos);
            /* translate */
            nX += translation.x;
            nY += translation.y;
            /* add to new points arr */
            newPoints.push(new Vec2(nX, nY));
        }
        return newPoints;
    }
}

class CircleBounds {
    constructor(radius) {
        this.radius = radius;
    }
}
/* ENTITY ID Enum */
var ENTITY_ID = {
    PLAYER: { value: 0, name: "Player" },
    RUNNER: { value: 1, name: "Runner" },
    CHASER: { value : 2, name: "Chaser"},
    DARTER: { value: 3, name: "Darter" },
    BROWNIAN: { value: 4, name: "Brownian" },
    SPINNER: { value: 5, name: "Spinner" },
    FATTY: { value: 6, name: "Fatty" },
    MAGE: { value: 7, name: "Mage" },
    PRIEST: { value: 8, name: "Priest" },
}
Object.freeze(ENTITY_ID);

var EntityData = {
    id: undefined,
    position: undefined,
    bounds: undefined,
    velocity: undefined,
    maxHP: undefined,
    hp: undefined,
}

class Entity {
    constructor(data = EntityData) {
        this.id = data.id;
        this.position = data.position;
        this.bounds = data.bounds;
        this.velocity = data.velocity;
        this.maxHP = data.maxHP;
        this.hp = data.hp;
    }

    update() {
        this.move();
    }

    move() {
        if (this.velocity == undefined) {
            // do nothing
        } else {
            // add velocity to position
            this.position.addLocal(this.velocity);
        }
    }
}

class EntityBuilder {
    static build(ENTITY_ID, position, target) {
        switch (ENTITY_ID) {
            case 0: return EntityBuilder.buildPlayer(position);
            case 1: return EntityBuilder.buildRunner(position);
            case 2: return EntityBuilder.buildChaser(position,target);
            case 3: return EntityBuilder.buildDarter(position,target);
            case 4: return EntityBuilder.buildBrownian(position);
            case 5: return EntityBuilder.buildSpinner(position);
            case 6: return EntityBuilder.buildFatty(position);
            case 7: return EntityBuilder.buildMage(position);
            case 8: return EntityBuilder.buildPriest(position);
            default: throw new Error("unknown id");
        }
    }
    static buildPlayer(position) {

    }
    static buildRunner(position) {
        // runs in random direction
        var rX = Math.random() * ((Math.random() < 0.5) ? -1 : 1);
        var rY = Math.random() * ((Math.random() < 0.5) ? -1 : 1);
        var data = {
            id: ENTITY_ID.RUNNER.value,
            position: position,
            bounds: new CircleBounds(10),
            velocity: new Vec2(rX, rY).normalizeLocal().multLocal(0.25),
            maxHP: 1,
            hp: 1,
        }
        return new Entity(data);
    }

    static buildChaser(position,target){
        // chases target
        var data = {
            id: ENTITY_ID.CHASER.value,
            position: position,
            bounds: new CircleBounds(10),
            velocity: new Vec2(target.position.x - position.x, target.position.y - position.y).normalizeLocal().multLocal(1.5),
            maxHP:5,
            hp: 5,
        }
        var chaser = new Entity(data);
        chaser.target = target;
        // redefine update to chase the target
        var oldUpdate = chaser.update;
        chaser.update = function(){
            var dx = this.target.position.x - this.position.x;
            var dy = this.target.position.y - this.position.y;
            this.velocity = new Vec2(dx, dy).normalizeLocal().multLocal(1.5),
            oldUpdate.apply(this,arguments);
        }
        return chaser;
    }
    static buildDarter(position, target) {
        // darts at target
        // runs in random direction
        var data = {
            id: ENTITY_ID.DARTER.value,
            position: position,
            bounds: new CircleBounds(10),
            velocity:  new Vec2(target.position.x - position.x, target.position.y - position.y).normalizeLocal().multLocal(3),
            maxHP: 10,
            hp: 10,
        }
        var darter = new Entity(data);
        darter.target = target;
        return darter;
    }
    static buildBrownian(position) {
        // random movement
    }
    static buildSpinner(position,target) {
        // spins around target
    }
    static buildFatty(position) {
        // sits on track
    }
    static buildMage(position) {
        // stationary, casts spells, can teleport behind player
        // can turn any entity with health into any other entity with health
    }
    static buildPriest(position) {
        // stationary, heals nearby
    }
}

class TurretBase extends Entity{
    constructor(path=Path,position){
        super({
            id:ENTITY_ID.PLAYER.value,
            position: position,
            bounds: new RectBounds(16, 16, 0),
            maxHP:100,
            hp: 100,
        });
        this.path = path;
        this.barrel = new Barrel(this);
        this.fireTime = Date.now();
    }

    update() {
        if (keyBoard.isDown(KeyCode.LEFT_ARROW)) {
            this.bounds.angleRad -= 0.025;
        }
        if (keyBoard.isDown(KeyCode.RIGHT_ARROW)) {
            this.bounds.angleRad += 0.025;
        }
        if (keyBoard.isDown(KeyCode.DOWN_ARROW)) {
            this.path.backward();
        }
        if (keyBoard.isDown(KeyCode.UP_ARROW)) {
            this.path.forward();
        }
        if (keyBoard.isDown(KeyCode.W)) {
            if (Date.now() - this.fireTime > 100) {
                this.barrel.fire();
                this.fireTime = Date.now();
            }
        }
        this.position = this.path.currentPoint;

        this.barrel.update();
    }
}

class Barrel extends Entity{
    constructor(turretBase=TurretBase){
        super({
            position: turretBase.position,
            bounds: new RectBounds(24, 4, 0, 
                new Vec2(turretBase.bounds.halfWidth, 0)),
        });
        this.turretBase = turretBase;
    }

    getBarrelEnd() {
        var sin = Math.sin(this.bounds.angleRad);
        var cos = Math.cos(this.bounds.angleRad);
        var nX = this.bounds.halfWidth * cos;
        var nY = this.bounds.halfWidth * sin;
        // shift 10 pixels out
        nX += this.position.x + cos * 10;
        nY += this.position.y + sin * 10;
        return new Vec2(nX, nY);
    }

    fire() {
        var dx = Math.cos(this.bounds.angleRad) * 10;
        var dy = Math.sin(this.bounds.angleRad) * 10;
        var barrelEnd = this.getBarrelEnd();
        bullets.push(new Bullet(barrelEnd, new Vec2(dx, dy)));
    }

    update() {
        super.update();
        this.position = this.turretBase.position;
        this.bounds.angleRad = this.turretBase.bounds.angleRad;
    }
}

class Bullet extends Entity{
    constructor(position,velocity){
        super({
            position: position,
            velocity: velocity,
            bounds: new CircleBounds(4),
        });
    }
}