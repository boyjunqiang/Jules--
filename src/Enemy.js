import * as THREE from 'three';

export class Enemy {
    constructor(scene, x, z) {
        this.scene = scene;
        this.mesh = null;
        this.hp = 100;
        this.speed = 15; // units per second
        this.isDead = false;

        this.createModel(x, z);
    }

    createModel(x, z) {
        const group = new THREE.Group();

        const skinMat = new THREE.MeshLambertMaterial({ color: 0xffccaa });
        const clothesMat = new THREE.MeshLambertMaterial({ color: 0x334455 }); // Dark blue uniform

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), skinMat);
        head.position.y = 16;
        group.add(head);

        // Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(6, 10, 3), clothesMat);
        torso.position.y = 9;
        group.add(torso);

        // Arms
        const armGeo = new THREE.BoxGeometry(2, 8, 2);
        const leftArm = new THREE.Mesh(armGeo, clothesMat);
        leftArm.position.set(-4, 9, 0);
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, clothesMat);
        rightArm.position.set(4, 9, 0);

        // Weapon in hand
        const gunGeo = new THREE.BoxGeometry(1, 1, 8);
        const gunMat = new THREE.MeshLambertMaterial({color: 0x111111});
        const gun = new THREE.Mesh(gunGeo, gunMat);
        gun.position.set(0, -3, 2);
        rightArm.add(gun);
        group.add(rightArm);


        // Legs
        const legGeo = new THREE.BoxGeometry(2.5, 10, 2.5);
        const leftLeg = new THREE.Mesh(legGeo, clothesMat);
        leftLeg.position.set(-2, 0, 0); // Center at 5, but pivot is center, so box goes -5 to 5.
        // Need to offset y so feet are at 0
        leftLeg.position.y = -1; // Torso at 9, torso height 10 (4 to 14). Legs should be below 4.
        // Wait, pivot is center. Torso y=9 h=10 -> bottom is 4.
        // Leg h=10 -> center should be -1.

        // Let's adjust heights. Player height is 10 (camera).
        // Standard height ~1.8m. In our scale, player eye is at y=10.
        // Let's say 1 unit = 0.15m approx? 10 units = 1.5m?
        // Let's stick to unit scale roughly consistent with map.
        // Map walls are 40 high. Player eye at 10.

        // Re-adjusting for cleaner math:
        // Eye level = 10. Total height ~12.

        // Head: size 2.5. Pos: 10 + 1.25 = 11.25
        head.geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        head.position.y = 11.5;

        // Torso: size 4x5x2. Pos: 11.5 - 1.25 - 2.5 = 7.75
        torso.geometry = new THREE.BoxGeometry(4, 5, 2);
        torso.position.y = 7.75;

        // Legs: size 1.5x7.75x1.5. Pos: 3.875
        const lGeo = new THREE.BoxGeometry(1.5, 7.75, 1.5);
        const lLeg = new THREE.Mesh(lGeo, clothesMat);
        lLeg.position.set(-1.1, 3.875, 0);
        group.add(lLeg);

        const rLeg = new THREE.Mesh(lGeo, clothesMat);
        rLeg.position.set(1.1, 3.875, 0);
        group.add(rLeg);

        // Arms: size 1.2x5x1.2
        const aGeo = new THREE.BoxGeometry(1.2, 5, 1.2);
        const lArm = new THREE.Mesh(aGeo, clothesMat);
        lArm.position.set(-2.8, 8, 0);
        group.add(lArm);

        const rArm = new THREE.Mesh(aGeo, clothesMat);
        rArm.position.set(2.8, 8, 0);

        // Gun
        gun.scale.set(1, 1, 1);
        gun.position.set(0, -2, 2);
        rArm.add(gun);
        group.add(rArm);

        group.position.set(x, 0, z);
        group.castShadow = true;

        group.userData = { isEnemy: true, parent: this }; // Link back to class

        this.mesh = group;
        this.scene.add(group);

        // Animations state
        this.limbs = [lLeg, rLeg, lArm, rArm];
        this.animTime = 0;
    }

    takeDamage(amount) {
        this.hp -= amount;

        // Visual feedback (Flash)
        this.mesh.children.forEach(c => c.material.emissive = new THREE.Color(0xff0000));
        setTimeout(() => {
            if(this.mesh) this.mesh.children.forEach(c => c.material.emissive = new THREE.Color(0x000000));
        }, 100);

        if (this.hp <= 0 && !this.isDead) {
            this.die();
            return true; // Killed
        }
        return false;
    }

    die() {
        this.isDead = true;
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 1;
        // Could fade out or stay as ragdoll
    }

    update(dt, playerPos, obstacles) {
        if (this.isDead) return;

        // Simple AI: Move towards player
        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
        dir.y = 0;
        const dist = dir.length();

        if (dist < 200 && dist > 5) { // Aggro range
            dir.normalize();

            // Raycast check for walls could go here for LOS

            this.mesh.position.addScaledVector(dir, this.speed * dt);
            this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);

            // Walk cycle
            this.animTime += dt * 10;
            this.limbs[0].rotation.x = Math.sin(this.animTime) * 0.5;
            this.limbs[1].rotation.x = Math.sin(this.animTime + Math.PI) * 0.5;
            this.limbs[2].rotation.x = Math.sin(this.animTime + Math.PI) * 0.5;
            this.limbs[3].rotation.x = Math.sin(this.animTime) * 0.5; // Gun arm moves too
        } else {
            // Idle
            this.limbs.forEach(l => l.rotation.x = THREE.MathUtils.lerp(l.rotation.x, 0, 0.1));
        }
    }
}
