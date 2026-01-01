import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Game State
let camera, scene, renderer, controls;
const objects = [];
let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Ammo & Health
let ammo = 30;
let health = 100;
let targets = [];

init();
animate();

function init() {
    // 1. Setup Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0xffffff, 0, 750);

    // 2. Setup Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10;

    // 3. Setup Lights
    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    // 4. Setup Controls
    controls = new PointerLockControls(camera, document.body);

    const instructions = document.getElementById('instructions');
    instructions.addEventListener('click', function () {
        controls.lock();
    });

    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
    });

    controls.addEventListener('unlock', function () {
        instructions.style.display = 'block';
    });

    scene.add(controls.getObject());

    // 5. Input Handling
    const onKeyDown = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;
            case 'Space':
                if (canJump === true) velocity.y += 350;
                canJump = false;
                break;
        }
    };

    const onKeyUp = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);

    // 6. Raycaster (Shooting)
    raycaster = new THREE.Raycaster();

    // 7. World Generation
    // Floor
    let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(-Math.PI / 2);

    // Simple texture pattern for floor
    const vertexColors = [];
    const positionAttribute = floorGeometry.attributes.position;
    for ( let i = 0, l = positionAttribute.count; i < l; i ++ ) {
        const x = positionAttribute.getX(i);
        const z = positionAttribute.getZ(i);
        if ((Math.floor(x / 20) % 2 == 0) ^ (Math.floor(z / 20) % 2 == 0)) {
           vertexColors.push(0.8, 0.8, 0.8);
        } else {
           vertexColors.push(0.4, 0.4, 0.4);
        }
    }
    floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));

    const floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    scene.add(floor);

    // Boxes (Crates)
    const boxGeometry = new THREE.BoxGeometry(20, 20, 20);
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown

    for (let i = 0; i < 20; i++) {
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.x = Math.floor(Math.random() * 20 - 10) * 20;
        box.position.y = 10;
        box.position.z = Math.floor(Math.random() * 20 - 10) * 20;
        scene.add(box);
        objects.push(box);
    }

    // Enemies (Red cubes)
    const targetGeometry = new THREE.BoxGeometry(10, 20, 10);
    const targetMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });

    for (let i = 0; i < 5; i++) {
        const target = new THREE.Mesh(targetGeometry, targetMaterial);
        target.position.x = Math.floor(Math.random() * 20 - 10) * 30;
        target.position.y = 10;
        target.position.z = Math.floor(Math.random() * 20 - 10) * 30;
        target.userData = { isEnemy: true, hp: 3 };
        scene.add(target);
        targets.push(target);
        objects.push(target); // Add to objects for collision/shooting
    }


    // 8. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseDown(event) {
    if (!controls.isLocked) return;

    if (ammo > 0) {
        shoot();
        ammo--;
        updateHUD();
    } else {
        // Click sound for empty?
        console.log("Out of ammo");
    }
}

function shoot() {
    // Raycast from center of screen
    raycaster.setFromCamera( new THREE.Vector2(0, 0), camera );

    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;

        // Simple visual feedback: Flash color
        const originalColor = hitObject.material.color.getHex();
        hitObject.material.color.setHex(0xffff00); // Yellow flash
        setTimeout(() => {
            if (hitObject.parent) // check if still in scene
                hitObject.material.color.setHex(originalColor);
        }, 100);

        if (hitObject.userData.isEnemy) {
            hitObject.userData.hp--;
            if (hitObject.userData.hp <= 0) {
                scene.remove(hitObject);
                // Remove from arrays
                const index = targets.indexOf(hitObject);
                if (index > -1) targets.splice(index, 1);
                const objIndex = objects.indexOf(hitObject);
                if (objIndex > -1) objects.splice(objIndex, 1);
            }
        }
    }
}

function updateHUD() {
    document.getElementById('ammo').innerText = `Ammo: ${ammo} / 90`;
    document.getElementById('health').innerText = `Health: ${health}`;
}

function checkCollision() {
    const playerPos = controls.getObject().position;
    const playerRadius = 3; // Approx radius

    // Create a sphere or box for player
    // For simplicity, check distance to center of objects or use Bounding Box

    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];

        // Calculate Bounding Box of the object
        // We should ideally cache this, but for now we compute it
        // Note: box.setFromObject might be slow in loop, but acceptable for < 100 objects
        const box = new THREE.Box3().setFromObject(obj);

        // Expand box by player radius (Minkowski sum approximation)
        box.min.subScalar(playerRadius);
        box.max.addScalar(playerRadius);

        if (box.containsPoint(playerPos)) {
            return true;
        }
    }
    return false;
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();

    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        // Collision detection:
        // Move X, check, undo if collision.
        // Move Z, check, undo if collision.

        controls.moveRight(-velocity.x * delta);
        if (checkCollision()) {
             controls.moveRight(velocity.x * delta); // undo
             velocity.x = 0;
        }

        controls.moveForward(-velocity.z * delta);
        if (checkCollision()) {
             controls.moveForward(velocity.z * delta); // undo
             velocity.z = 0;
        }

        controls.getObject().position.y += (velocity.y * delta); // up/down

        // Floor collision
        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
            canJump = true;
        }
    }

    prevTime = time;

    renderer.render(scene, camera);
}
