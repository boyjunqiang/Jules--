import * as THREE from 'three';
import { generateTextures } from './Textures.js';

export class GameMap {
    constructor(scene) {
        this.scene = scene;
        this.walls = [];
        this.floor = null;
        this.obstacles = [];

        const texData = generateTextures();
        this.wallTex = new THREE.CanvasTexture(texData.wall);
        this.floorTex = new THREE.CanvasTexture(texData.floor);
        this.boxTex = new THREE.CanvasTexture(texData.box);

        this.wallTex.wrapS = THREE.RepeatWrapping;
        this.wallTex.wrapT = THREE.RepeatWrapping;
        this.floorTex.wrapS = THREE.RepeatWrapping;
        this.floorTex.wrapT = THREE.RepeatWrapping;

        this.wallMat = new THREE.MeshLambertMaterial({ map: this.wallTex });
        this.floorMat = new THREE.MeshLambertMaterial({ map: this.floorTex });
        this.boxMat = new THREE.MeshLambertMaterial({ map: this.boxTex });

        this.init();
    }

    init() {
        // Floor
        const floorGeo = new THREE.PlaneGeometry(1000, 1000, 10, 10);
        this.floorTex.repeat.set(20, 20);
        const floor = new THREE.Mesh(floorGeo, this.floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.floor = floor;

        // Lights
        const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444, 0.6 );
        hemiLight.position.set( 0, 200, 0 );
        this.scene.add( hemiLight );

        const dirLight = new THREE.DirectionalLight( 0xffffff, 1.0 ); // Sunlight
        dirLight.position.set( 50, 200, 100 );
        dirLight.position.multiplyScalar( 1.3 );
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        const d = 300;
        dirLight.shadow.camera.left = - d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = - d;
        this.scene.add( dirLight );

        // Map Layout (Dust 2 Inspired - Simplified)
        // Walls: x, z, width, height, rotation(y)
        const wallsData = [
            // Outer walls
            { x: 0, z: -200, w: 400, h: 40, r: 0 },
            { x: 0, z: 200, w: 400, h: 40, r: 0 },
            { x: -200, z: 0, w: 400, h: 40, r: Math.PI/2 },
            { x: 200, z: 0, w: 400, h: 40, r: Math.PI/2 },

            // Mid structure / Tunnel
            { x: -50, z: 0, w: 10, h: 40, r: 0 },
            { x: 50, z: 0, w: 10, h: 40, r: 0 },

            // Long A area walls
            { x: 100, z: -100, w: 100, h: 40, r: 0 },
        ];

        wallsData.forEach(w => this.createWall(w.x, w.z, w.w, w.h, w.r));

        // Crates
        this.createBox(50, 10, -50, 20);
        this.createBox(60, 10, -50, 20); // stacked? no, side by side
        this.createBox(55, 30, -50, 20); // stacked

        this.createBox(-100, 10, 100, 20);
        this.createBox(-120, 10, 80, 20);
    }

    createWall(x, z, width, height, rot) {
        const geo = new THREE.BoxGeometry(width, height, 5);
        const mesh = new THREE.Mesh(geo, this.wallMat);
        mesh.position.set(x, height/2, z);
        mesh.rotation.y = rot;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.walls.push(mesh);
        this.obstacles.push(mesh);
    }

    createBox(x, y, z, size) {
        const geo = new THREE.BoxGeometry(size, size, size);
        const mesh = new THREE.Mesh(geo, this.boxMat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.obstacles.push(mesh);
    }

    getObstacles() {
        return this.obstacles;
    }
}
