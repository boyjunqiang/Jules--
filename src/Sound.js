export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playShoot() {
        const t = this.ctx.currentTime;

        // Gunshot noise
        const noise = this.createNoiseBuffer();
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = noise;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 1000;

        const noiseEnv = this.ctx.createGain();
        noiseEnv.gain.setValueAtTime(1, t);
        noiseEnv.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseEnv);
        noiseEnv.connect(this.ctx.destination);
        noiseSrc.start();

        // Mechanical click
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);

        const clickEnv = this.ctx.createGain();
        clickEnv.gain.setValueAtTime(0.5, t);
        clickEnv.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

        osc.connect(clickEnv);
        clickEnv.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.1);
    }

    playHit() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);

        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0.5, t);
        env.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(env);
        env.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.1);
    }

    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 0.1; // 0.1 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }
}
