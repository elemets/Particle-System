import * as THREE from 'three/build/three.module';


class ParticleSystem {
    constructor(parameters) {
        const uniforms = {
            diffuseTexture: {
                value: new THREE.TextureLoader().load('./fire1.png')
            },
            pointMultiplier: {
                value: window.innerHeight / (2.0 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))
            }
        };
    
    this._material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: _VS,
        fragmentShader: _FS,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        vertexColors: true
    });

    this._camera = parameters.camera;
    this._particles = [];

    this._geometry = new THREE.BufferGeometry();
    this._geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));

    this._points = new THREE.Points(this._geometry, this._material);

    parameters.parent.add(this._points);

    this._AddParticles();
    this._UpdateGeometry();
    
    }

    _AddParticles() {
        for (let i = 0; i < 10; i++) {
            this._particles.push({
                position: new THREE.Vector3(
                    (Math.random() * 2 - 1) * 1.0,
                    (Math.random() * 2 - 1) * 1.0,
                    (Math.random() * 2 - 1) * 1.0),
            });
        } 
    }

    _UpdateGeometry() {
        const positions = [];

        for (let p of this._particles) {
            positions.push(p.position.x, p.position.y, p.position.z);
        }

        this._geometry.setAttribute(
            'position', new THREE.Float32BufferAttribute(positions, 3)
        );

        this._geometry.attributes.position.needsUpdate = true; 
    }
    
}