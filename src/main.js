import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GameMap } from './Map.js';
import { Weapon } from './Weapon.js';
import { Enemy } from './Enemy.js';
import { SoundManager } from './Sound.js';
import { ParticleSystem } from './Particles.js';

// Game State
let camera, scene, renderer, controls;
let raycaster;
let map, weapon, sound, particles;

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
let enemies = [];
const obstacles = []; // For collision

init();
animate();

function init() {
    // 1. Setup Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 0, 750);

    // 2. Setup Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10;

    // 3. Setup Systems
    map = new GameMap(scene);
    map.getObstacles().forEach(o => obstacles.push(o));

    sound = new SoundManager();
    particles = new ParticleSystem(scene);

    // 4. Setup Controls
    controls = new PointerLockControls(camera, document.body);

    const instructions = document.getElementById('instructions');
    instructions.addEventListener('click', function () {
        controls.lock();
    });

    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        if(sound.ctx.state === 'suspended') sound.ctx.resume();
    });

    controls.addEventListener('unlock', function () {
        instructions.style.display = 'block';
    });

    scene.add(controls.getObject());

    // Weapon
    weapon = new Weapon(camera);

    // Enemies
    for(let i=0; i<5; i++) {
        const x = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;
        const enemy = new Enemy(scene, x, z);
        enemies.push(enemy);
        obstacles.push(enemy.mesh); // Add for collision/shooting
    }


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
                if (canJump === true) velocity.y += 150;
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
    document.addEventListener('mouseup', onMouseUp);

    // 6. Raycaster (Shooting)
    raycaster = new THREE.Raycaster();

    // 8. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
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

    if (event.button === 0) { // Left Click
        if (ammo > 0) {
            shoot();
        } else {
            console.log("Out of ammo");
        }
    } else if (event.button === 2) { // Right Click
        weapon.setAim(true);
    }
}

function onMouseUp(event) {
    if (event.button === 2) {
        weapon.setAim(false);
    }
}

function shoot() {
    weapon.shoot();
    sound.playShoot();
    ammo--;
    updateHUD();

    // Raycast from center of screen
    raycaster.setFromCamera( new THREE.Vector2(0, 0), camera );

    // Check intersections with map obstacles and enemies
    // Note: Enemy meshes are groups, need to intersect recursively
    const intersects = raycaster.intersectObjects(obstacles, true);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const point = hit.point;
        const normal = hit.face.normal;

        // Find root object
        let obj = hit.object;
        while(obj.parent && obj.parent.type !== 'Scene') {
            if (obj.userData.isEnemy) break;
            obj = obj.parent;
        }

        if (obj.userData.isEnemy) {
            particles.createBlood(point);
            sound.playHit();
            const killed = obj.userData.parent.takeDamage(20); // 20 dmg
            if (killed) {
                // Remove form obstacles list logic if needed
            }
        } else {
            // Hit wall/box
            particles.createSparks(point, normal);
        }
    }
}

function updateHUD() {
    document.getElementById('ammo').innerText = `Ammo: ${ammo} / 90`;
    document.getElementById('health').innerText = `Health: ${health}`;
}

function checkCollision() {
    const playerPos = controls.getObject().position;
    const playerRadius = 3;

    // Simple box collision
    const playerBox = new THREE.Box3();
    playerBox.min.set(playerPos.x - playerRadius, playerPos.y - 10, playerPos.z - playerRadius);
    playerBox.max.set(playerPos.x + playerRadius, playerPos.y + 2, playerPos.z + playerRadius);

    // Obstacles collision
    for(const obj of obstacles) {
        if (obj.userData.isEnemy && obj.userData.parent.isDead) continue; // Skip dead enemies

        const box = new THREE.Box3().setFromObject(obj);
        if (box.intersectsBox(playerBox)) return true;
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

        // X Movement
        controls.moveRight(-velocity.x * delta);
        if (checkCollision()) {
             controls.moveRight(velocity.x * delta);
             velocity.x = 0;
        }

        // Z Movement
        controls.moveForward(-velocity.z * delta);
        if (checkCollision()) {
             controls.moveForward(velocity.z * delta);
             velocity.z = 0;
        }

        controls.getObject().position.y += (velocity.y * delta);

        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
            canJump = true;
        }

        // Update entities
        weapon.update();
        enemies.forEach(e => e.update(delta, controls.getObject().position));
        particles.update(delta);
    }

    prevTime = time;

    renderer.render(scene, camera);
}
