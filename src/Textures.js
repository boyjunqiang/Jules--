export function generateTextures() {
    return {
        wall: createWallTexture(),
        floor: createFloorTexture(),
        box: createBoxTexture()
    };
}

function createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base color
    ctx.fillStyle = '#b0a090'; // Sandstone color
    ctx.fillRect(0, 0, 512, 512);

    // Bricks
    ctx.fillStyle = '#a09080';
    const brickH = 64;
    const brickW = 128;
    for (let y = 0; y < 512; y += brickH) {
        const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2;
        for (let x = -offset; x < 512; x += brickW) {
            ctx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);
        }
    }

    // Noise
    addNoise(ctx);

    return canvas;
}

function createFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Concrete/Dust
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    // Tiles
    ctx.strokeStyle = '#707070';
    ctx.lineWidth = 2;
    const tileS = 128;
    for (let y = 0; y < 512; y += tileS) {
        for (let x = 0; x < 512; x += tileS) {
            ctx.strokeRect(x, y, tileS, tileS);
            // Random dirt
            if (Math.random() > 0.5) {
                ctx.fillStyle = 'rgba(100, 90, 80, 0.1)';
                ctx.fillRect(x + 10, y + 10, tileS - 20, tileS - 20);
            }
        }
    }

    addNoise(ctx);
    return canvas;
}

function createBoxTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Wood base
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, 0, 256, 256);

    // Frame
    ctx.strokeStyle = '#6b4226';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 246, 246);

    // Cross
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(256, 256);
    ctx.moveTo(256, 0);
    ctx.lineTo(0, 256);
    ctx.stroke();

    addNoise(ctx);
    return canvas;
}

function addNoise(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const idata = ctx.getImageData(0, 0, w, h);
    const buffer32 = new Uint32Array(idata.data.buffer);

    for (let i = 0; i < buffer32.length; i++) {
        if (Math.random() < 0.1) {
            // Darken slightly
            const val = buffer32[i];
            // Simple manipulation logic for noise would go here,
            // but for simplicity/performance in canvas API, we skip per-pixel complex logic
            // just drawing random small rects is faster
        }
    }
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    for(let i=0; i<500; i++) {
        ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
    }
}
