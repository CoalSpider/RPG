class Vec2{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }

    /* returns a new vector containing the result */
    add(vec2=Vec2){
        return new Vec2(this.x+vec2.x,this.y+vec2.y);
    }
    /* modifies the origional vector */
    addLocal(vec2=Vec2){
        this.x+=vec2.x;
        this.y+=vec2.y;
        return this;
    }

    /* returns a new vector containing the result */
    sub(vec2=Vec2){
        return new Vec2(this.x-vec2.x,this.y-vec2.y);
    }
    
    /* modifies the origional vector */
    subLocal(vec2=Vec2){
        this.x-=vec2.x;
        this.y-=vec2.y;
        return this;
    }

    dot(vec2=Vec2){
        return this.x*vec2.x + this.y*vec2.y;
    }

    /* returns a new vector containing the result */
    negate(){
        return mult(-1);
    }

    /* modifies the origional vector */
    negateLocal(){
        return multLocal(-1);
    }

    /* returns a new vector containing the result */
    mult(scalar=Number){
        return new Vec2(this.x*scalar,this.y*scalar);
    }

    /* modifies the origional vector */
    multLocal(scalar=Number){
        this.x*=scalar;
        this.y*=scalar;
        return this;
    }
    /* returns the length/magnitude squared of this */
    lenSqrd(){
        return this.x*this.x + this.y*this.y;
    }

    /* returns the length/magnitude of this */
    len(){
        var l2 = this.lenSqrd();
        if(l2 == 0) return 0;
        return Math.sqrt(l2);
    }

    /* returns a new vector containing the result */
    normalize(){
        var l = this.len();
        return new Vec2(this.x/l,this.y/l);
    }

    /* modifies the origional vector */
    normalizeLocal(){
        var l = this.len();
        this.x /= l;
        this.y /= l;
        return this;
    }

    /* modifies the origional vector */
    scalarProj(vec2=Vec2){
        return this.dot(vec2)/vec2.lenSqrd();
    }

    /* returns a new vector containing the result */
    vectProj(vec2=Vec2){
        return vec2.mult(scalarProj(vec2));
    }

    copy(){
        return new Vec2(this.x,this.y);
    }

    /* STATIC METHODS */

    /* returns a new vector containing the result */
    static addVV(a=Vec2,b=Vec2){
        return a.add(b);
    }
    
    /* modifies vector a */
    static addLocalVV(a=Vec2,b=Vec2){
        return a.addLocal(b);
    }
    
    /* returns a new vector containing the result */
    static subVV(a=Vec2,b=Vec2){
        return a.sub(b);
    }
    
    /* modifies vector a */
    static subLocalVV(a=Vec2,b=Vec2){
        return a.subLocal(b);
    }
    
    static dotVV(a=Vec2,b=Vec2){
        return a.dot(b);
    }
    
    /* returns a new vector containing the result */
    static negateV(vec2=Vec2){
        return vec2.negate();
    }
    
    /* modifies vector a */
    static negateLocalV(vec2=Vec2){
        return vec2.negateLocal();
    }
    
    /* returns a new vector containing the result */
    static multVS(vec2=Vec2,scalar=Number){
        return vec2.mult(scalar);
    }
    
    /* modifies vector a */
    static multLocalVS(vec2=Vec2,scalar=Number){
        return vec2.multLocal(scalar);
    }
    
    static lenSqrdV(vec2=Vec2){
        return vec2.lenSqrd();
    }
    
    static lenV(vec2=Vec2){
        return vec2.len();
    }

    /* returns a new vector containing the result */
    static normalizeV(vec2=Vec2){
        var l = vec2.len();
        return new Vec2(vec2.x/l,vec2.y/l);
    }

    /* modifies the origional vector */
    static normalizeLocalV(vec2=Vec2){
        var l = vec2.len();
        vec2.x /= l;
        vec2.y /= l;
    }
    
    static scalarProjVV(a=Vec2,b=Vec2){
        return a.dot(b) / b.lenSqrd();
    }
    
    /* returns a new vector containing the result */
    static vectProjVV(a=Vec2,b=Vec2){
        return a.mult(a.scalarProj(b));
    }

    /* projection of point p onto line a b */
    static segmentScalarProj(p=Vec2,a=Vec2,b=Vec2){
        var ab = b.sub(a);
        var l2 = ab.lenSqrd();
        // handle case where a == b
        if(l2==0){
            return 0;
        }
        // vAP -> vector p to a
        var ap = p.sub(a);
        // vAB -> vector b to a
        // var ab = b.sub(a);
        // project vAB onto vAB
        var projection = ap.dot(ab) /l2;
        // then clamp between zero and one so we stay on the segment
        return clamp(0,1,projection);
    }

    static segmentVecProj(p=Vec2,a=Vec2,b=Vec2){
        var ab = b.sub(a);
        return a.add(ab.multLocal(Vec2.segmentScalarProj(p,a,b)));
    }

    /* assumes rotation around origin
    returns a new vector containing the result */
    static rotateV(p=Vec2,rotationRad=0){
        var cos = Math.cos(rotationRad);
        var sin = Math.sin(rotationRad);
        var xNew = p.x*cos + p.y*sin;
        var yNew = p.x*sin - p.y*cos;
        return new Vec2(xNew,yNew);
    }

    /* assumes rotation around origin
    modifies the given vector */
    static rotateLocalV(p=Vec2,rotationRad=0){
        var cos = Math.cos(rotationRad);
        var sin = Math.sin(rotationRad);
        var xNew = p.x*cos + p.y*sin;
        var yNew = p.x*sin - p.y*cos;
        p.x = xNew;
        p.y = yNew;
        return p;
    }
}