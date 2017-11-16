var ComponentID = {
    PHYSICAL: 0,
    HEALTH: 1,
    COLLISION: 2,
    AI: 3,
    RENDER: 4,
    SPAWN: 5,
    SHOOTER: 6,
}


var EntityID = {
    BULLET: -1,
    PLAYER: 0,
    RUNNER: 1,
    CHASER: 2,
    DARTER: 3,
    SPAWNER: 10,
    AMALGAMATE: 100,
}

var RatioTable = {
    runner: 0,
    chaser: 0,
    darter: 0,
}

var ids = [EntityID.RUNNER, EntityID.CHASER, EntityID.DARTER];

class Component {
    constructor(entity = ComponentEntity, id = Number) {
        this.entity = entity;
        this.id = id;
    }
}

class PhysicalComponent extends Component {
    constructor(entity = ComponentEntity, position = Vec2, rotationRadians = 0, velocity = Vec2, speed = 0) {
        super(entity, ComponentID.PHYSICAL);
        this.position = position;
        this.rotationRadians = rotationRadians;
        this.speed = speed;
        this.velocity = velocity;
        if (this.velocity.lenSqrd() != 0) {
            this.velocity = this.velocity.normalize().multLocal(speed);
        }
    }

    setVelocity(velocity = Vec2) {
        if (this.velocity.lenSqrd != 0) {
            this.velocity = velocity.normalize().multLocal(this.speed);
        } else {
            this.velocity = velocity;
        }
    }

    move() {
        this.position.addLocal(this.velocity);
    }

    rotate(rotationRadians = 0) {
        this.rotationRadians += rotationRadians;
    }
}

class HealthComponent extends Component {
    constructor(entity = ComponentEntity, maxHealth = Number) {
        super(entity, ComponentID.HEALTH);
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }
}

class CollisionComponent extends Component {
    constructor(entity = ComponentEntity, bounds = CollisionBounds) {
        super(entity, ComponentID.COLLISION);
        this.bounds = bounds;
    }
}

class AIComponent extends Component {
    constructor(entity = ComponentEntity) {
        super(entity, ComponentID.AI);
    }

    update() {
        // empty
    }
}

class RenderableComponent extends Component {
    constructor(entity = ComponentEntity) {
        super(entity, ComponentID.RENDER);
    }
}

class SpawningComponent extends Component {
    constructor(entity = ComponentEntity, spawnMax = 1, delay = 1000, ratioTable = RatioTable) {
        super(entity, ComponentID.SPAWN);
        this.spawnMax = spawnMax;
        this.spawnCount = 0;
        this.delay = delay;
        this.weights = [
            ratioTable.runner,
            ratioTable.chaser,
            ratioTable.darter,
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
                var position = this.entity.getComponent(ComponentID.PHYSICAL).position;
                return EntityFactory.build(ids[i], position.copy(), player);
            }
        }
        throw new Error("not mob found");
    }

    spawnEnemy() {
        if (this.spawnCount < this.spawnMax && Date.now() - this.oldTime > this.delay) {
            this.oldTime = Date.now();
            entityManager.registerEntity(this.getRandomEnemy());
            this.spawnCount += 1;
            console.log('spawn enemy = ' + this.spawnCount);
        }
    }
}

class ShootingComponent extends Component {
    constructor(entity = ComponentEntity, fireDelay = 100) {
        super(entity, ComponentID.SHOOTER);
        this.fireDelay = fireDelay;
        this.fireTime = Date.now();
    }

    getFireLocation() {
        var physical = this.entity.getComponent(ComponentID.PHYSICAL);
        var rotation = physical.rotationRadians;
        var position = physical.position;
        var collision = this.entity.getComponent(ComponentID.COLLISION);
        var sin = Math.sin(rotation);
        var cos = Math.cos(rotation);
        var nX = collision.bounds.halfWidth * cos;
        var nY = collision.bounds.halfWidth * sin;
        // shift 10 pixels out
        nX += position.x + cos * 10;
        nY += position.y + sin * 10;
        return new Vec2(nX, nY);
    }

    fire() {
        if(Date.now() - this.fireTime >= this.fireDelay){
            this.fireTime = Date.now();
            var physical = this.entity.getComponent(ComponentID.PHYSICAL);
            var rotation = physical.rotationRadians;
            var fireLoc = this.getFireLocation();
            var velocity = new Vec2(Math.cos(rotation), Math.sin(rotation));
            return EntityFactory.buildBullet(fireLoc, velocity, rotation);
        }
        return null;
    }
}

// marker class
class CollisionBounds { }

class Circle extends CollisionBounds {
    constructor(radius = 1) {
        super();
        this.radius = radius;
    }
}

class Rectangle extends CollisionBounds {
    constructor(halfWidth = 1, halfHeight = 1) {
        super();
        this.halfWidth = halfWidth;
        this.halfHeight = halfHeight;
        this.basePoints = [
            new Vec2(-this.halfWidth, -this.halfHeight),
            new Vec2(-this.halfWidth, +this.halfHeight),
            new Vec2(+this.halfWidth, +this.halfHeight),
            new Vec2(+this.halfWidth, -this.halfHeight),
        ];
    }

    getPoints(translation = Vec2, rotationRad = 0) {
        /* counter-clock-wise order */
        var newPoints = [];
        if (rotationRad == 0) {
            for (var i = 0; i < this.basePoints.length; i++) {
                newPoints.push(this.basePoints[i].add(translation));
            }
        } else {
            var sin = Math.sin(rotationRad);
            var cos = Math.cos(rotationRad);
            for (var i = 0; i < this.basePoints.length; i++) {
                /* points centered around origin */
                var p = this.basePoints[i];
                /* rotate */
                var nX = (p.x * cos) - (p.y * sin);
                var nY = (p.x * sin) + (p.y * cos);
                /* translate */
                nX += translation.x;
                nY += translation.y;
                /* add to new points */
                newPoints.push(new Vec2(nX, nY));
            }
        }
        return newPoints;
    }
}

class ComponentEntity {
    constructor(id = Number) {
        this.id = id;
        this.components = [];
    }

    indexOf(componentId = Number) {
        for (var i = 0; i < this.components.length; i++) {
            if (this.components[i].id == componentId) {
                return i;
            }
        }
        return -1;
    }
/* TODO: component check requirements
    checkComponentAttachment(componentID=Number){
        switch(componentID){
            case ComponentID.PHYSICAL:
            case 1:
            case 2:
            case 3:
            case 
        }
    } */

    attachComponent(component = Component) {
        if (this.indexOf(component.id) != -1) {
            throw new Error("component type already attached");
        } else {
            this.components.push(component);
        }
    }

    detachComponent(component = Component) {
        if (!this.indexOf(component.id) == -1) {
            throw new Error("entity does not have the given component type attached");
        } else {
            this.components.push(component);
        }
    }

    getComponent(componentId = Number) {
        var indx = this.indexOf(componentId);
        if (indx == -1) {
            throw new Error("entity doesnt have given component type");
        } else {
            return this.components[indx];
        }
    }

    hasComponent(componentId = Number) {
        var indx = this.indexOf(componentId);
        return indx != -1;
    }
}

class EntityFactory {
    static build(id = Number, position = Vec2, target = ComponentEntity) {
        switch (id) {
            case EntityID.PLAYER: return EntityFactory.buildPlayer(position);
            case EntityID.RUNNER: return EntityFactory.buildRunner(position);
            case EntityID.CHASER: return EntityFactory.buildChaser(position, target);
            case EntityID.DARTER: return EntityFactory.buildDarter(position, target);
            case EntityID.AMALGAMATE: return EntityFactory.buildAmalgamate(position, target);
            default: throw new Error("unknown id");
        }
    }

    static buildPlayer(position = Vec2) {
        var entity = new ComponentEntity(EntityID.PLAYER);
        entity.attachComponent(new PhysicalComponent(entity, position, 0, new Vec2(0, 0), 1));
        entity.attachComponent(new ShootingComponent(entity, 100));
        entity.attachComponent(new CollisionComponent(entity, new Rectangle(24, 16)));
        entity.attachComponent(new HealthComponent(entity, 100));
        entity.attachComponent(new RenderableComponent(entity));
        return entity;
    }

    /* create a base enemy with....
    phsyicalComponent : position=given position, rotation=0, velocity=0,0, speed=1
    healthComponent : health=10
    collisionComponent: circle : radius=10
    AIComponent: calls physicalComponent.move() == position += velocity
    RenderableComponent: marker for rendering does nothing on its own 
    */
    static buildEnemy(position = Vec2, id = Number,hp=Number) {
       // console.log("build enemy " + id + " at " + position.x + "," + position.y);
        var entity = new ComponentEntity(id);
        var physicalComponent = new PhysicalComponent(entity, position, 0, new Vec2(0, 0), 1);
        var aiComponent = new AIComponent(entity);
        aiComponent.update = function () {
            // add velocity to position
            physicalComponent.move();
        }
        entity.attachComponent(physicalComponent);
        entity.attachComponent(aiComponent);
        entity.attachComponent(new CollisionComponent(entity, new Circle(10)));
        entity.attachComponent(new HealthComponent(entity, hp));
        entity.attachComponent(new RenderableComponent(entity));
        return entity;
    }

    static buildRunner(position = Vec2) {
     //   console.log("build runner " + EntityID.RUNNER + " at " + position.x + "," + position.y);
        var entity = EntityFactory.buildEnemy(position, EntityID.RUNNER,1);
        var phsyicalComponent = entity.getComponent(ComponentID.PHYSICAL);
        phsyicalComponent.speed = 0.5;
        var randX = (Math.random() > 0.5) ? -Math.random() : Math.random();
        var randY = (Math.random() > 0.5) ? -Math.random() : Math.random();
        phsyicalComponent.setVelocity(new Vec2(randX, randY));
        return entity;
    }

    static buildChaser(position = Vec2, target = ComponentEntity) {
     //   console.log("build chaser " + EntityID.CHASER + " at " + position.x + "," + position.y);
        var entity = EntityFactory.buildEnemy(position, EntityID.CHASER,5);
        var phsyicalComponent = entity.getComponent(ComponentID.PHYSICAL);
        phsyicalComponent.speed = 0.75;
        var aiComponent = entity.getComponent(ComponentID.AI);
        var AIUpdateBase = aiComponent.update;
        entity.target = target;
        aiComponent.update = function () {
            var tPos = entity.target.getComponent(ComponentID.PHYSICAL).position;
            var velocity = tPos.sub(phsyicalComponent.position);
            if(isNaN(velocity.x)) throw new Error("velocity is nan");
            phsyicalComponent.setVelocity(velocity);
            AIUpdateBase.apply(this, arguments);
        }
        return entity;
    }

    static buildDarter(position = Vec2, target = ComponentEntity) {
      //  console.log("build darter " + EntityID.DARTER + " at " + position);
        var entity = EntityFactory.buildEnemy(position, EntityID.DARTER,5);
        var velocity = target.getComponent(ComponentID.PHYSICAL).position.sub(position);
        entity.getComponent(ComponentID.PHYSICAL).setVelocity(velocity);
        return entity;
    }

    static buildBullet(position = Vec2, velocity = Vec2, rotation = Number) {
        var entity = new ComponentEntity(EntityID.BULLET);
        var physicalComponent = new PhysicalComponent(entity, position, rotation, velocity, 10);
        var aiComponent = new AIComponent(entity);
        aiComponent.update = function () {
            physicalComponent.move();
        }
        entity.attachComponent(physicalComponent);
        entity.attachComponent(new CollisionComponent(entity, new Circle(7)));
        entity.attachComponent(aiComponent);
        entity.attachComponent(new RenderableComponent(entity));
        return entity;
    }

    static buildDestroyEventBody(position = Vec2) {
        // destoryEvent
        var entity = new ComponentEntity(-999);
        entity.attachComponent(new PhysicalComponent(entity, position, 0, new Vec2(0, 0), 0));
        entity.attachComponent(new HealthComponent(entity, 100));
        entity.attachComponent(new CollisionComponent(entity, new Circle(50)));
        entity.attachComponent(new RenderableComponent(entity));
        return entity;
    }

    static buildAmalgamate(position = Vec2, target = ComponentEntity) {
        var entity = new ComponentEntity(EntityID.AMALGAMATE);
        var physicalComponent = new PhysicalComponent(entity, position, 0, new Vec2(0, 0), 0);
        var aiComponent = new AIComponent(entity);
        aiComponent.update = function () {

        }
        entity.attachComponent(physicalComponent);
        entity.attachComponent(new CollisionComponent(entity, new Circle(20)));
        entity.attachComponent(new HealthComponent(entity, 50));
        entity.attachComponent(new RenderableComponent(entity));
        /** TODO: replicate collection of points that old code has */
        return entity;
    }

    static buildSpawner(position=Vec2,spawnMax=1,delay=1000,ratioTable=RatioTable,target){
        var entity = new ComponentEntity(EntityID.SPAWNER);
        var physicalComponent = new PhysicalComponent(entity,position,0,new Vec2(0,0),0);
        var spawnerComponent = new SpawningComponent(entity,spawnMax,delay,ratioTable);
        var aiComponent = new AIComponent(entity);
        aiComponent.update = function(){
            var targetPos = target.getComponent(ComponentID.PHYSICAL).position;
            var dist = distSqrd(targetPos,physicalComponent.position);
            if(dist < 750*750){
                spawnerComponent.spawnEnemy();
            }
        }
        entity.attachComponent(physicalComponent);
        entity.attachComponent(spawnerComponent);
        entity.attachComponent(aiComponent);
        return entity;
    }
}

class EntityManager {
    constructor() {
        this.entities = [];
        this.entityLists = new Map();
        this.removalList = [];
    }

    registerEntity(entity = ComponentEntity) {
        this.entities.push(entity);
        for (var i = 0; i < entity.components.length; i++) {
            var component = entity.components[i];
            if (this.entityLists.has(component.id)) {
                this.entityLists.get(component.id).push(entity);
            } else {
                this.entityLists.set(component.id, [entity,]);
            }
        }
    }

    getEntitiesWithComponentID(componentId = Number) {
        return this.entityLists.get(componentId);
    }

    markForRemoval(entity = ComponentEntity) {
        this.removalList.push(entity);
    }

    removeMarkedEntities() {
        for (var i = 0; i < this.removalList.length; i++) {
            var e = this.removalList[i];
            this.entities.splice(this.entities.indexOf(e), 1);
            var mapIter = this.entityLists.keys();
            while(true){
                var next = mapIter.next();
                if(next.done){
                    break;
                }
                var key = next.value;
                var list = this.entityLists.get(key);
                var indx = list.indexOf(e);
                if (indx != -1) {
                    list.splice(indx, 1);
                }
            }
        }
        this.removalList.splice(0, this.removalList.length);
    }

    clearManager() {
        console.log("clear");
        this.entities.splice(0, this.entities.length);
        this.removalList.splice(0, this.removalList.length);
    }

    isEntityRegistered(entity=ComponentEntity){
        return this.entities.indexOf(entity) != -1;
    }

    outOfBounds(entity = ComponentEntity) {
        var playerPos = player.getComponent(ComponentID.PHYSICAL).position;
        var entityPos = entity.getComponent(ComponentID.PHYSICAL).position;
        if (isNaN(entityPos.x)) {
            throw new Error("entity " + entity.id + " pos is nan");
        }
        if (isNaN(playerPos.x)) {
            throw new Error("player pos is nan");
        }
        var delta = entityPos.sub(playerPos);
        var distSqrd = delta.x * delta.x + delta.y * delta.y;
        return distSqrd > 750 * 750;
    }

    markOutOfBounds(){
        var positionals = this.getEntitiesWithComponentID(ComponentID.PHYSICAL);
        if(positionals==undefined) return;
        for (var i = 0; i < positionals.length; i++) {
            if (positionals[i].id == EntityID.PLAYER || positionals[i].id==EntityID.SPAWNER) continue;
            if (this.outOfBounds(positionals[i])) {
                this.markForRemoval(positionals[i]);
            }
        }
    }

    markDead(){
        var killables = this.getEntitiesWithComponentID(ComponentID.HEALTH);
        if(killables==undefined) return;
        for(var i = 0; i < killables.length; i++){
            if(killables[i].getComponent(ComponentID.HEALTH).currentHealth <= 0){
                this.markForRemoval(killables[i]);
            }
        }
    }

    markEmptySpawners(){
        var spawners = this.getEntitiesWithComponentID(ComponentID.SPAWN);
        if(spawners==undefined) return;
        for(var i = 0; i < spawners.length; i++){
            var spawn = spawners[i].getComponent(ComponentID.SPAWN);
            if(spawn.spawnCount >= spawn.spawnMax){
                this.markForRemoval(spawners[i]);
            }
        }
    }

    getEntitiesByID(EntityID=Number){
        var entitiesOfID = [];
        for(var i = 0; i < this.entities.length; i++){
            if(this.entities[i].id==EntityID){
                entitiesOfID.push(this.entities[i]);
            }
        }
        return entitiesOfID;
    }
}