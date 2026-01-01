import * as THREE from 'three';

export class Weapon {
    constructor(camera) {
        this.camera = camera;
        this.mesh = null;
        this.isAiming = false;
        this.recoil = 0;
        this.muzzleFlash = null;
        this.flashDuration = 0;

        this.createModel();
    }

    createModel() {
        const group = new THREE.Group();

        // AK-47 Body (approximated)
        const bodyGeo = new THREE.BoxGeometry(0.1, 0.15, 0.6);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x333333 }); // Dark metal
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, -0.05, 0);
        group.add(body);

        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6);
        const barrel = new THREE.Mesh(barrelGeo, bodyMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.5);
        group.add(barrel);

        // Stock (Wood)
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.3);
        const stock = new THREE.Mesh(stockGeo, woodMat);
        stock.position.set(0, -0.05, 0.4);
        group.add(stock);

        // Magazine
        const magGeo = new THREE.BoxGeometry(0.08, 0.3, 0.1);
        magGeo.rotateX(0.2); // Curved look
        const mag = new THREE.Mesh(magGeo, bodyMat);
        mag.position.set(0, -0.2, 0.1);
        group.add(mag);

        // Handguard
        const handGeo = new THREE.BoxGeometry(0.09, 0.08, 0.3);
        const hand = new THREE.Mesh(handGeo, woodMat);
        hand.position.set(0, 0, -0.35);
        group.add(hand);

        // Muzzle Flash
        const flashGeo = new THREE.PlaneGeometry(0.3, 0.3);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        this.muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
        this.muzzleFlash.position.set(0, 0.02, -0.85); // Tip of barrel
        this.muzzleFlash.rotation.z = Math.random() * Math.PI;
        group.add(this.muzzleFlash);

        // Positioning relative to camera
        group.position.set(0.3, -0.3, -0.5);

        this.mesh = group;
        this.camera.add(this.mesh);
    }

    shoot() {
        this.recoil += 0.1;
        this.flashDuration = 3; // frames
        this.muzzleFlash.rotation.z = Math.random() * Math.PI;
        this.muzzleFlash.material.opacity = 1;
    }

    update() {
        // Recoil recovery
        this.recoil = Math.max(0, this.recoil - 0.01);

        // Muzzle Flash fade
        if (this.flashDuration > 0) {
            this.flashDuration--;
        } else {
            this.muzzleFlash.material.opacity = 0;
        }

        // Apply visual recoil and sway
        const targetZ = this.recoil * 0.2;
        const targetRot = this.recoil * 0.1;

        // Idle sway
        const time = Date.now() * 0.002;
        const swayX = Math.sin(time) * 0.005;
        const swayY = Math.cos(time * 0.5) * 0.005;

        // ADS vs Hip position
        const basePos = this.isAiming ? new THREE.Vector3(0, -0.19, -0.4) : new THREE.Vector3(0.3, -0.3, -0.5);

        this.mesh.position.lerp(new THREE.Vector3(
            basePos.x + swayX,
            basePos.y + swayY,
            basePos.z + targetZ
        ), 0.1);

        this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, targetRot, 0.2);
    }

    setAim(isAiming) {
        this.isAiming = isAiming;
    }
}
