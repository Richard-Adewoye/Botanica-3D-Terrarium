/**
 * Procedural Web Audio Engine for Terrarium Ambience
 * 100% synthesized in real time — zero external audio files.
 */

class ProceduralTerrariumAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;

  // Sound layer gains
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private cricketsGain: GainNode | null = null;
  private toneGain: GainNode | null = null;

  // Active nodes / intervals
  private rainSource: AudioBufferSourceNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private cricketTimer: number | null = null;
  private dropletTimer: number | null = null;

  private currentVolume: number = 0.5;

  private initContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Rain noise layer
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.rainGain.connect(this.masterGain);

    // Wind noise layer
    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    this.windGain.connect(this.masterGain);

    // Crickets layer
    this.cricketsGain = this.ctx.createGain();
    this.cricketsGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.cricketsGain.connect(this.masterGain);

    // Gentle tone resonance
    this.toneGain = this.ctx.createGain();
    this.toneGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    this.toneGain.connect(this.masterGain);

    this.startNoiseGenerators();
    this.startRandomDroplets();
  }

  private createPinkNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startNoiseGenerators() {
    if (!this.ctx || !this.rainGain || !this.windGain) return;

    const noiseBuffer = this.createPinkNoiseBuffer();
    if (!noiseBuffer) return;

    // Rain filter chain
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = noiseBuffer;
    this.rainSource.loop = true;
    this.rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainSource.start();

    // Wind filter chain (sweeping gentle resonance)
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;
    this.windSource.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windSource.start();
  }

  private playWaterDroplet() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 850 + Math.random() * 600;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.6, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.4, now + 0.12);

    gain.gain.setValueAtTime(0.06 * this.currentVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  private playCricketChirp() {
    if (!this.ctx || this.isMuted || !this.cricketsGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(4600 + Math.random() * 400, now);

    // Staccato chirps
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.03 * this.currentVolume, now + 0.02);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.03 * this.currentVolume, now + 0.08);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.cricketsGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  private startRandomDroplets() {
    const scheduleNext = () => {
      if (this.dropletTimer) window.clearTimeout(this.dropletTimer);
      const delay = 1800 + Math.random() * 4500;
      this.dropletTimer = window.setTimeout(() => {
        if (!this.isMuted && this.rainGain) {
          this.playWaterDroplet();
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    const scheduleCrickets = () => {
      if (this.cricketTimer) window.clearTimeout(this.cricketTimer);
      const delay = 800 + Math.random() * 2200;
      this.cricketTimer = window.setTimeout(() => {
        if (!this.isMuted) {
          this.playCricketChirp();
        }
        scheduleCrickets();
      }, delay);
    };
    scheduleCrickets();
  }

  public setSoundEnabled(enabled: boolean) {
    this.isMuted = !enabled;
    if (enabled && !this.ctx) {
      this.initContext();
    }
    if (this.ctx && this.masterGain) {
      if (this.ctx.state === 'suspended' && enabled) {
        this.ctx.resume();
      }
      const targetGain = this.isMuted ? 0 : this.currentVolume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
  }

  public updateAmbience(weather: string, timeHours: number, humidity: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Rain intensity
    let rainLevel = 0;
    if (weather === 'rain') rainLevel = 0.15;
    else if (weather === 'storm') rainLevel = 0.35;
    else if (weather === 'mist') rainLevel = 0.03;

    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(rainLevel, now, 0.5);
    }

    // Wind intensity
    let windLevel = 0.04;
    if (weather === 'storm') windLevel = 0.18;
    else if (weather === 'spores') windLevel = 0.08;

    if (this.windGain) {
      this.windGain.gain.setTargetAtTime(windLevel, now, 0.5);
    }

    // Night crickets (active between 20h and 5h)
    const isNight = timeHours > 19.5 || timeHours < 5.5;
    const cricketLevel = (isNight && weather !== 'storm' && weather !== 'rain') ? 0.07 : 0.0;
    if (this.cricketsGain) {
      this.cricketsGain.gain.setTargetAtTime(cricketLevel, now, 1.0);
    }
  }

  public playInteractionTone(freq = 520) {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.08);

    gain.gain.setValueAtTime(0.08 * this.currentVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  public dispose() {
    if (this.cricketTimer) window.clearTimeout(this.cricketTimer);
    if (this.dropletTimer) window.clearTimeout(this.dropletTimer);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const terrariumAudio = new ProceduralTerrariumAudio();
