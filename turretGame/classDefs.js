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
    CHASER: { value: 2, name: "Chaser" },
    DARTER: { value: 3, name: "Darter" },
    BROWNIAN: { value: 4, name: "Brownian" },
    SPINNER: { value: 5, name: "Spinner" },
    FATTY: { value: 6, name: "Fatty" },
    MAGE: { value: 7, name: "Mage" },
    PRIEST: { value: 8, name: "Priest" },
    AMALGAMATE: { value: 100, name: "Amalgamate" },
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
        if (this.velocity == undefined || this.velocity == 0) {
            // do nothing
        } else {
            // add velocity to position
            this.position.addLocal(this.velocity);
        }
    }
}

class Amalgamate extends Entity {
    constructor(data = EntityData, target = Entity) {
        super(data);
        this.target = target;
        // core is surrounded by multiple layers
        this.parts = [];
        var innerParts = this.buildInner();
        for (var i = 0, j = innerParts.length; i < j; i++) {
            this.parts.push(innerParts[i]);
        }
        var middleParts = this.buildMidle();
        for (var i = 0, j = middleParts.length; i < j; i++) {
            this.parts.push(middleParts[i]);
        }
        //  var outerParts = this.buildOuter();
        //  for (var i = 0, j = outerParts.length; i < j; i++) {
        //       this.parts.push(outerParts[i]);
        //   }
        this.detonationTimer = Date.now();
        this.fireTimer = Date.now();
        this.rotationSpeed = 1;
    }

    buildInner() {
        var radius = 12;
        var distFromCenter = this.bounds.radius + radius;
        var innerParts = [];
        var count = 8;
        for (var i = 0; i < count; i++) {
            var data = {
                id: -1,
                position:
                Vec2
                    .rotateLocalV(new Vec2(distFromCenter, 0), toRad(360 / count * i))
                    .addLocal(this.position),
                bounds: new CircleBounds(radius),
                velocity: new Vec2(0, 0),
                maxHP: 15,
                hp: 15,
            }
            innerParts.push(new Entity(data));
        }
        return innerParts;
    }

    buildMidle() {
        var radius = 10;
        var distFromCenter = this.bounds.radius + 24 + radius;
        var middleParts = [];
        var count = 16;
        for (var i = 0; i < count; i++) {
            var data = {
                id: -2,
                position:
                Vec2
                    .rotateLocalV(new Vec2(distFromCenter, 0), toRad(360 / count * i))
                    .addLocal(this.position),
                bounds: new CircleBounds(radius),
                velocity: new Vec2(0, 0),
                maxHP: 5,
                hp: 5,
            }
            middleParts.push(new Entity(data));
        }
        return middleParts;
    }

    buildOuter() {
        var radius = 5;
        var distFromCenter = this.bounds.radius + radius;
        var outerParts = [];
        var count = 32;
        for (var i = 0; i < count; i++) {
            var data = {
                id: -3,
                position:
                Vec2
                    .rotateLocalV(new Vec2(distFromCenter, 0), toRad(360 / count * i))
                    .addLocal(this.position),
                bounds: new CircleBounds(radius),
                velocity: new Vec2(0, 0),
                maxHP: 2,
                hp: 2,
            }
            outerParts.push(new Entity(data));
        }
        return outerParts;
    }

    update() {
        super.update();
        for (var i = 0; i < this.parts.length; i++) {
            this.parts[i].update();
        }
        if (this.hp / this.maxHP < 0.75) {
            if(Date.now() - this.detonationTimer >= 5000){
                this.detonate();
                this.detonationTimer = Date.now();
            }
        }
        if(Date.now() - this.fireTimer >= 2000){
            this.shootAtPlayer();
            this.fireTimer = Date.now();
        }
    }

    // shoots outer layer projectiles outward
    detonate() {
        var outerParts = this.buildOuter();
        for (var i = 0, j = outerParts.length; i < j; i++) {
            this.parts.push(outerParts[i]);
        }
        for (var i = 0; i < this.parts.length; i++) {
            var p = this.parts[i];
            if (p.id == -3) {
                p.velocity = p
                    .position
                    .sub(this.position)
                    .normalizeLocal()
                    .multLocal(10);

            }
        }
    }

    shootAtPlayer(){
        enemies.push(EntityBuilder.buildDarter(this.position.copy(),this.target));
    }
}

class EntityBuilder {
    static build(id, position, target) {
        switch (id) {
            case 0: return EntityBuilder.buildPlayer(position);
            case 1: return EntityBuilder.buildRunner(position);
            case 2: return EntityBuilder.buildChaser(position, target);
            case 3: return EntityBuilder.buildDarter(position, target);
            case 4: return EntityBuilder.buildBrownian(position);
            case 5: return EntityBuilder.buildSpinner(position);
            case 6: return EntityBuilder.buildFatty(position);
            case 7: return EntityBuilder.buildMage(position);
            case 8: return EntityBuilder.buildPriest(position);
            case 100: return EntityBuilder.buildAmalgamate(position, target);
            default: throw new Error("unknown id");
        }
    }
    static buildPlayer(position) {
        return null;
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

    static buildChaser(position, target) {
        // chases target
        var data = {
            id: ENTITY_ID.CHASER.value,
            position: position,
            bounds: new CircleBounds(10),
            velocity: new Vec2(target.position.x - position.x, target.position.y - position.y).normalizeLocal().multLocal(1.5),
            maxHP: 5,
            hp: 5,
        }
        var chaser = new Entity(data);
        chaser.target = target;
        // redefine update to chase the target
        var oldUpdate = chaser.update;
        chaser.update = function () {
            var dx = this.target.position.x - this.position.x;
            var dy = this.target.position.y - this.position.y;
            this.velocity = new Vec2(dx, dy).normalizeLocal().multLocal(1.5);
            oldUpdate.apply(this, arguments);
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
            velocity: new Vec2(target.position.x - position.x, target.position.y - position.y).normalizeLocal().multLocal(3),
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
    static buildSpinner(position, target) {
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

    static buildAmalgamate(position, target) {
        // first boss
        var data = {
            id: ENTITY_ID.AMALGAMATE.value,
            position: position,
            bounds: new CircleBounds(20),
            velocity: new Vec2(0, 0),
            maxHP: 50,
            hp: 50,
        }
        return new Amalgamate(data, target);
    }

    static buildDestroyEventBody(position){
        // destroyEvent
        var data = {
            id: -999,
            position: position,
            bounds: new CircleBounds(50),
            velocity: new Vec2(0,0),
            maxHP: 100,
            hp: 100,
        }
        return new Entity(data);
    }
}
var RatioTable = {
    runner: 0,
    chaser: 0,
    darter: 0,
    brownian: 0,
    spinner: 0,
    fatty: 0,
    mage: 0,
    priest: 0,
    amalgamate: 0,
}
var ids = [1, 2, 3, 4, 5, 6, 7, 8, 100];

class Spawner {
    constructor(position = Vec2, spawnMax = 1, delay = 1000, ratioTable = RatioTable) {
        this.position = position;
        this.spawnMax = spawnMax;
        this.delay = delay;
        this.ratioTable = ratioTable;
        this.spawnCount = 0;
        this.weights = [
            this.ratioTable.runner,
            this.ratioTable.chaser,
            this.ratioTable.darter,
            this.ratioTable.brownian,
            this.ratioTable.spinner,
            this.ratioTable.fatty,
            this.ratioTable.mage,
            this.ratioTable.priest,
            this.ratioTable.amalgamate,
        ]
        this.weightedSum = 0;
        for (var i = 0, j = this.weights.length; i < j; i++) {
            var num = this.weights[i];
            this.weightedSum += (num == undefined) ? 0 : this.weights[i];
        }
        this.oldTime = Date.now();
    }

    randomize(min, max) {
        return Math.random() * (max - min) + min;
    }

    getRandomEnemy() {
        var roll = this.randomize(0, this.weightedSum);
        var sum = 0;
        for (var i = 0, j = this.weights.length; i < j; i++) {
            sum += (this.weights[i] == undefined) ? 0 : this.weights[i];
            if (roll <= sum) {
                return EntityBuilder.build(ids[i], this.position.copy(), player);
            }
        }
        throw new Error("not mob found");
    }

    spawnEnemy() {
        if (this.spawnCount < this.spawnMax && Date.now() - this.oldTime > this.delay) {
            this.oldTime = Date.now();
            enemies.push(this.getRandomEnemy());
            this.spawnCount += 1;
        }
    }
}

class TurretBase extends Entity {
    constructor(position) {
        super({
            id: ENTITY_ID.PLAYER.value,
            position: position,
            bounds: new RectBounds(16, 16, 0),
            maxHP: 100,
            hp: 100,
        });
        this.barrel = new Barrel(this);
        this.fireTime = Date.now();
    }

    update(track) {
        if (keyBoard.isDown(KeyCode.LEFT_ARROW)) {
            this.bounds.angleRad -= 0.05;
        }
        if (keyBoard.isDown(KeyCode.RIGHT_ARROW)) {
            this.bounds.angleRad += 0.05;
        }
        if (keyBoard.isDown(KeyCode.UP_ARROW)) {
            track.forward();
        }
        if (keyBoard.isDown(KeyCode.DOWN_ARROW)) {
            track.backward();
        }
        if (keyBoard.isDown(KeyCode.W)) {
            if (Date.now() - this.fireTime > 100) {
                this.barrel.fire();
                this.fireTime = Date.now();
            }
        }
        this.position = track.current.currentPoint;

        this.barrel.update();
    }
}

class Barrel extends Entity {
    constructor(turretBase = TurretBase) {
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
        var bullet = new Bullet(barrelEnd, new Vec2(dx, dy));
        bullet.angle = this.bounds.angleRad;
        bullets.push(bullet);
    }

    update() {
        super.update();
        this.position = this.turretBase.position;
        this.bounds.angleRad = this.turretBase.bounds.angleRad;
    }
}

class Bullet extends Entity {
    constructor(position, velocity) {
        super({
            position: position,
            velocity: velocity,
            bounds: new CircleBounds(7),
        });
    }
}