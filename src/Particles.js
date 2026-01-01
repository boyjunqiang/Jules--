import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];

        const geo = new THREE.BufferGeometry();
        const mat = new THREE.PointsMaterial({
            size: 0.5,
            color: 0xffaa00,
            transparent: true,
            opacity: 1
        });

        // Pre-allocate pool? No, for simplicity we create small systems or managing mesh
        // Actually, simple mesh based particles are easier for varied types (blood, sparks)
    }

    createSparks(pos, normal) {
        const count = 10;
        const geo = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];

        for(let i=0; i<count; i++) {
            positions.push(pos.x, pos.y, pos.z);
            const v = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
            v.add(normal).normalize().multiplyScalar(Math.random() * 20 + 10);
            velocities.push(v);
        }

        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color: 0xffff00, size: 0.5, transparent: true });
        const points = new THREE.Points(geo, mat);
        this.scene.add(points);

        this.particles.push({ mesh: points, velocities, age: 0, maxAge: 0.5, type: 'sparks' });
    }

    createBlood(pos) {
        const count = 15;
        const geo = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];

        for(let i=0; i<count; i++) {
            positions.push(pos.x, pos.y, pos.z);
            const v = new THREE.Vector3(Math.random()-0.5, Math.random(), Math.random()-0.5).multiplyScalar(10);
            velocities.push(v);
        }

        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color: 0xaa0000, size: 0.8, transparent: true });
        const points = new THREE.Points(geo, mat);
        this.scene.add(points);

        this.particles.push({ mesh: points, velocities, age: 0, maxAge: 1.0, type: 'blood' });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.age += dt;

            if (p.age >= p.maxAge) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            const positions = p.mesh.geometry.attributes.position.array;

            for(let j=0; j<p.velocities.length; j++) {
                // Gravity
                p.velocities[j].y -= 50 * dt;

                positions[j*3] += p.velocities[j].x * dt;
                positions[j*3+1] += p.velocities[j].y * dt;
                positions[j*3+2] += p.velocities[j].z * dt;
            }

            p.mesh.geometry.attributes.position.needsUpdate = true;
            p.mesh.material.opacity = 1 - (p.age / p.maxAge);
        }
    }
}
