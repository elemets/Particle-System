

class Particle {
    constructor(parameters) {
            this._position = new THREE.Vector3(
                (Math.random() -0.5) * .4,
                0.25,
                (Math.random() -0.5) * .4);
            this._size = 0.0065;
            this._colour= new THREE.Color(1, 0, 0);
            this._alpha= 1.0;
            this._lifetime= 5.0;
            this._maxlife= 5.0;
            this._rotation= Math.PI;
            this._velocity= new THREE.Vector3(0, 10, 0);
    }
}