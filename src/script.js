import * as THREE from 'three/build/three.module';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gui, GUI } from 'three/examples/jsm/libs/dat.gui.module';
import ParticleSystem  from './ParticleSystem.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


class BasicWorld {
    constructor() {
        this._Initialise();
    }


_Initialise() {

    // initialising three js window size parameters
    this._threejs = new THREE.WebGLRenderer();
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
        this._OnWindowResize();
    }, false);

    // loading in the firepit model

    // initialising the camera properties
    const fov = 60;
    const aspect = 1920/1080;
    const near = .001;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(75, 20, -100);

    this._scene = new THREE.Scene();

    // initialising light properties
    // Directional light is required here in order for the model we load in later
    // to show up, if just using ambient light the model won't appear
    let light = new THREE.DirectionalLight(0xFFFFFF);
    light.position.set(100, 100, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.01;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;

    // initialising the gltf loader which loads in the model
    const logLoader = new GLTFLoader();
    // initialising the GUI and adding a folder for the fire place x, y and z
    const gui = new GUI();
    const firefolder = gui.addFolder("Fire Place Position");

    
    this._scene.add(light);
    light = new THREE.AmbientLight(0x404040)
    this._scene.add(light);
    
    // Setting up orbit controls this allows us to move around the scene
    const controls = new OrbitControls(
        this._camera, this._threejs.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    controls.zoomSpeed = 0.3
    controls.panSpeed = 0.3

    this._camera_parameters = {
        cam_x: 1.8754,
        cam_y: 1.69,
        cam_z: -2.4
    }

    this._camera.position.set(this._camera_parameters.cam_x, this._camera_parameters.cam_y, this._camera_parameters.cam_z);

    const camera_controls = gui.addFolder("Camera Position: WARNING (can be weird)")

    this._camera_x = camera_controls.add(this._camera.position, "x", -2, 4)
    this._camera_y = camera_controls.add(this._camera.position, "y", -2, 4)
    this._camera_z = camera_controls.add(this._camera.position, "z", -2, 4)
    // setting up camera location and target so that the fire and particles don't spin around us
    // by setting the target and location of camera we can have a more fixed location in the scene
    // creating a more realistic and grounded look
    controls.update()
    controls.target.set(2, 1.69, -2.4);
    controls.update()


    // Adding a choice between two locations in the GUI
    this.choose_skybox = { 
        Forest: true,
        Yokohama: false
    }

    
    const locationFolder = gui.addFolder("Choose your location")
    this._Forest = locationFolder.add(this.choose_skybox, "Forest")
    this._Yokohama = locationFolder.add(this.choose_skybox, "Yokohama")
    
    // These two load in the Sky box textures
    const loader = new THREE.CubeTextureLoader();
    this.forest_texture = loader.load([
        './ForestSkyBox/posx.jpg',
        './ForestSkyBox/negx.jpg',
        './ForestSkyBox/posy.jpg',
        './ForestSkyBox/negy.jpg',
        './ForestSkyBox/posz.jpg',
        './ForestSkyBox/negz.jpg'
    ])

    this.yoko_texture = loader.load([
        './Yokohama/posx.jpg',
        './Yokohama/negx.jpg',
        './Yokohama/posy.jpg',
        './Yokohama/negy.jpg',
        './Yokohama/posz.jpg',
        './Yokohama/negz.jpg'
    ])
    
    this._scene.background = this.forest_texture;
    


        
    
    // allowing our loader to access "this"
    let world = this;
    // using the loader to add a fire pit model into the scene
    logLoader.load( '/models/scene.gltf', function (gltf) {
        console.log(gltf);
        const root = gltf.scene;
        world._scene.add(root);
        root.scale.set = (20, 20, 20)
        
        firefolder.add(gltf.scene.position, "x", 0, 10)
        firefolder.add(gltf.scene.position, "y", 0, 10)
        firefolder.add(gltf.scene.position, "z", -10, 10)
        
    }, function(xhr) {
        console.log((xhr.loaded /xhr.total * 100) + "% loaded")
    }, function (error) {
        console.error(error);
    });

    const directLight = new THREE.DirectionalLight(0xffffff, 1);
    directLight.position.set(20, 2, 5);


    this._particles = new ParticleSystem ({
        parent: this._scene,
        camera: this._camera
    });

    this._previousRAF = null;

    this._RAF();

}

_OnWindowResize(){
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
}

// request animation frame function
_RAF() {
    this._Forest.listen().onChange( () => this._scene.background = this.forest_texture)
    this._Yokohama.listen().onChange( () => this._scene.background = this.yoko_texture)


    requestAnimationFrame((time) => {

        if (this._previousRAF === null) {
            this._previousRAF = time;
        }

        this._threejs.render(this._scene, this._camera);
        this._threejs.sortObjects = false
        this._RAF();


        this._Step(time - (this._previousRAF) );
        this._previousRAF = time;

    });
    }

_Step(timeElapsed) {

    this._particles.Step(timeElapsed);
    }

}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new BasicWorld();
}); 