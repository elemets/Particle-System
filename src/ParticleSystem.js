import * as THREE from 'three/build/three.module';

import { GUI } from 'three/examples/jsm/libs/dat.gui.module';


/// Vertex Shader
const _VertexShader = `
uniform float pointMultiplier;

attribute float size;
attribute float angle;
attribute vec4 colour;

varying vec4 vColour;
varying vec2 vAngle;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size * pointMultiplier / gl_Position.w;

    vAngle = vec2(cos(angle), sin(angle));
    vColour = colour;
}
`;

// Fragment Shader
const _FragmentShader = `
uniform sampler2D diffuseTexture;
varying vec4 vColour;

varying vec2 vAngle;

void main() {
    vec2 coords  = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
    gl_FragColor = texture2D(diffuseTexture, coords) *vColour;
}
`;

class ParticleSystem {
    constructor(parameters) {
        const uniforms = {
            diffuseTexture: {
                value: new THREE.TextureLoader().load('./fire1.png')
            },
            pointMultiplier: {
                value: window.innerHeight / (0.2 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))
            }
        };
    
        // Material properties
    this._material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: _VertexShader,
        fragmentShader: _FragmentShader,
        blending: THREE.NormalBlending,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        vertexColors: true
    });

    this._camera = parameters.camera;
    this._particles = [];

    // Setting up buffer geometry
    // This tells three js how many variables each property is going to need
    this._geometry = new THREE.BufferGeometry();
    this._geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    this._geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
    this._geometry.setAttribute('colour', new THREE.Float32BufferAttribute([], 4));
    this._geometry.setAttribute('angle', new THREE.Float32BufferAttribute([], 1));

    this._points = new THREE.Points(this._geometry, this._material);

    parameters.parent.add(this._points);


    // SPLINES
    // These help to simulate physics and make for an easy way to create 
    // changing variables over time
    this._alphaSpline = new THREE.SplineCurve ( [
        new THREE.Vector2( 0.0, 1.0),
        new THREE.Vector2( 1.0, 0.7),
        new THREE.Vector2( 2.0, 0.4 ),
	    new THREE.Vector2( 3.0, 0.1 ),
    ]);

    this._sizeSpline = new THREE.SplineCurve( [
        new THREE.Vector2(1, 10.0),
        new THREE.Vector2(2, 8),
        new THREE.Vector2(3, 5),
        new THREE.Vector2(4, 3),
        new THREE.Vector2(5, 1),
        new THREE.Vector2(6, 0.2),
        new THREE.Vector2(7, 0.12),
        new THREE.Vector2(8, 0.1),
    ])

    // The X velocity curve
    this._velocityXSpline = new THREE.SplineCurve( [
        new THREE.Vector2(0, 15),
        new THREE.Vector2(0, -10),
        new THREE.Vector2(0, 1),
        new THREE.Vector2(0, -1),
        new THREE.Vector2(0, 0.1),
        new THREE.Vector2(0, -0.1),
    ])



    
    this._colourSpline = new THREE.SplineCurve([
        new THREE.Vector4(0.0, 1.0, 0.0, 0.0),
        new THREE.Vector4(1.0, 1.0, 1.0, 1.0)
    ])

    // The y velocity curve
    this._velocityYSpline = new THREE.SplineCurve( [
        new THREE.Vector2(0, 10),
        new THREE.Vector2(0.1, 8),
        new THREE.Vector2(0.2, 7),
        new THREE.Vector2(0.3, 6),
        new THREE.Vector2(0.4, 5),
        new THREE.Vector2(0.6, 4),
        new THREE.Vector2(0.7, 3),
        new THREE.Vector2(0.8, 2),
        new THREE.Vector2(0.9, 1),


    ])


    const gui = new GUI();

    const elements = {
        rubidium: false,
        copper: false,
        potassium: false,
        calcium: false
    }

    this.wind_speed = 2

    const metalToBurn = gui.addFolder("Choose an element to burn")
    this._rub = metalToBurn.add(elements, 'rubidium')
    this._cop = metalToBurn.add(elements, 'copper')
    this._pot = metalToBurn.add(elements, 'potassium')
    this._cal = metalToBurn.add(elements, 'calcium')



    this._adjustableParticleProps = {
        size : 0.0065,
        colour: new THREE.Color(1, 0, 0),
        lifetime: 5.0,
        alpha: 1.0,
        maxlife: 5.0,
        rotation: Math.PI,
        velocity: new THREE.Vector3(0, 10, 0),
        numberOfParticles: 2,
        color: new THREE.Color(0, 0, 0)
    }
    const particleProperties = gui.addFolder("Particles")

    particleProperties.add(this._adjustableParticleProps, "size", 0, 0.01)
    particleProperties.add(this._adjustableParticleProps, "rotation", -Math.PI, Math.PI)
    particleProperties.add(this._adjustableParticleProps, "lifetime", 0, 5)
    particleProperties.add(this._adjustableParticleProps, "numberOfParticles", 0, 20, 1)
    particleProperties.add(this, "wind_speed", -10, 10)

}
    

    _Emitter(timeElapsed) {



        this._rub.listen().onChange( () => this._adjustableParticleProps.colour = new THREE.Color(0.498, 0, 1))
        this._cop.listen().onChange( () => this._adjustableParticleProps.colour = new THREE.Color(0, 0.95, 1))
        this._pot.listen().onChange( () => this._adjustableParticleProps.colour = new THREE.Color(1, 0, 0.7569))
        this._cal.listen().onChange( () => this._adjustableParticleProps.colour = new THREE.Color(1, 0.94, 0))
        

        // console.log(this._adjustableParticleProps.colour)
        for (let i = 0; i < this._adjustableParticleProps.numberOfParticles; i++){
            this._particles.push({
                position: new THREE.Vector3(
                (Math.random() -0.5) * .4,
                0.25,
                (Math.random() -0.5) * .3),
                size: this._adjustableParticleProps.size,
                colour: this._adjustableParticleProps.colour,
                alpha: this._adjustableParticleProps.alpha,
                lifetime: this._adjustableParticleProps.lifetime,
                maxlife: this._adjustableParticleProps.maxlife,
                rotation: this._adjustableParticleProps.rotation,
                velocity: new THREE.Vector3(this._adjustableParticleProps.velocity.x,
                    this._adjustableParticleProps.velocity.y,
                    this._adjustableParticleProps.velocity.z
                    )})
    

        }


    }


    _UpdateParticles(timeElapsed) {

            // console.log(timeElapsed)
            for (let p of this._particles) {
                p.lifetime -= timeElapsed / 100;
            }


            // This gets rid of any particles which are past their lifetime
            this._particles = this._particles.filter(p => {
                return p.lifetime > 0.0;
                
            })
            for (let p of this._particles) {

                const time = 1.0 - p.lifetime / p.maxlife ;


                p.alpha = this._alphaSpline.getPointAt(time).y;


                // changing the size time using the size spline 
                p.currentSize = p.size * this._sizeSpline.getPointAt(time).y;


                // changing the colour from red to white over time 
                p.colour = p.colour.lerpColors(p.colour, new THREE.Color(1, 1, 1), 0.00005)

                // this is what causes the swirling looping motion

                // second part
                if (p.lifetime < 3.5) {
                    p.position.z = this._velocityXSpline.getPointAt(time).y * 0.00985 * time * time * this.wind_speed
                }
                // choosing only a few particles to fly up
                if (Math.random() > 0.995) {
                    
                    // making particles black to simulate smoke
                    if (Math.random() > 0.5) {p.colour =  new THREE.Color('black')}
                    
                    // changing the y position over time to make it look like sparks flying up

                    p.position.y =  0.5 * (this._velocityYSpline.getPointAt(time).y) * time * Math.random(0.9, 1);
                }

                // third part this adjusts the y value causing particles to float upwards
                if (p.lifetime > 3.0 & Math.random() > 0.985) {
                    p.alpha = this._alphaSpline.getPointAt(time).y 
                    p.position.z = this._velocityXSpline.getPointAt(time).y * time * Math.random(-0.1, 0.2) * 0.01 * 1 
                } else if (p.lifetime > 2.0 & Math.random() > 0.995){
                    p.position.y =  0.5 * (this._velocityYSpline.getPointAt(time).y) * time * Math.random(0.6, 0.8);
                    p.alpha = this._alphaSpline.getPointAt(time).y 

                    if (Math.random()> 0.999){
                    p.position.z = this._velocityXSpline.getPointAt(time).y * time * Math.random(-0.1, 0.2) * 0.01 * -1
                    }

                }

            }
          



        this._particles.sort((a, b) => {
            const distance_1 = this._camera.position.distanceTo(a.position);
            const distance_2 = this._camera.position.distanceTo(b.position);
        
            if (distance_1 > distance_2) {
                return -1;
            }

            if (distance_1 < distance_2) {
                return 1;
            }

            return 0;
        
        });

        


    }

    _UpdateGeometry() {
        const positions = [];
        const sizes = [];
        const colours = [];
        const angles = [];
        const velocities = [];



        for (let p of this._particles) {
            positions.push(p.position.x, p.position.y, p.position.z);
            sizes.push(p.currentSize);
            colours.push(p.colour.r, p.colour.g, p.colour.b, p.alpha);
            angles.push(p.rotation);
        }

        this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        this._geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        this._geometry.setAttribute('colour', new THREE.Float32BufferAttribute(colours, 4));
        this._geometry.setAttribute('angle', new THREE.Float32BufferAttribute(angles, 1));

        this._geometry.attributes.position.needsUpdate = true; 
        
        // this._geometry.attributes.angle.needsUpdate = true;
        this._geometry.attributes.size.needsUpdate = true;

    }

    Step(timeElapsed){
        this._Emitter(timeElapsed);
        this._UpdateParticles(timeElapsed);
        this._UpdateGeometry();
    }
    
}


export default ParticleSystem;