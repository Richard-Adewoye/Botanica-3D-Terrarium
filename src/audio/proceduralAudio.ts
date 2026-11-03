/**
 * Advanced Procedural Web Audio Engine for 3D Terrarium Ambience
 * 100% synthesized in real time — zero external audio files.
 *
 * Capabilities:
 * - Dynamic Gentle & Storm Rain with glass patter and low thunder rumbles
 * - Daytime Insects: Summer cicada trills, meadow grasshoppers & gentle bee hum
 * - Nocturnal Field Crickets: Rhythmic staccato stridulations and katydid pulses
 * - Organic Flora Rustling: Leaf brushing against glass/soil in the breeze
 * - Micro-Fauna Movement: Insect skitters, shell sliding, and twig clicks
 * - Hydration & Water Droplet chimes
 */

class ProceduralTerrariumAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;

  // Sound layer gains
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private dayInsectsGain: GainNode | null = null;
  private nightCricketsGain: GainNode | null = null;
  private rustleGain: GainNode | null = null;
  private beeGain: GainNode | null = null;

  // Continuous sound sources & nodes
  private rainSource: AudioBufferSourceNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private cicadaOsc: OscillatorNode | null = null;
  private cicadaMod: OscillatorNode | null = null;
  private beeOsc: OscillatorNode | null = null;

  // Timers for episodic sounds
  private dropletTimer: number | null = null;
  private nightCricketTimer: number | null = null;
  private dayInsectTimer: number | null = null;
  private rustleTimer: number | null = null;
  private thunderTimer: number | null = null;

  private currentVolume: number = 0.5;
  private lastWeather: string = 'clear';
  private lastTimeHours: number = 12.0;

  private initContext() {
    if (this.ctx) return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. Rain Layer
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.rainGain.connect(this.masterGain);

    // 2. Wind Layer
    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    this.windGain.connect(this.masterGain);

    // 3. Daytime Insects Layer (Cicadas & Meadow bugs)
    this.dayInsectsGain = this.ctx.createGain();
    this.dayInsectsGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.dayInsectsGain.connect(this.masterGain);

    // 4. Night Crickets Layer
    this.nightCricketsGain = this.ctx.createGain();
    this.nightCricketsGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.nightCricketsGain.connect(this.masterGain);

    // 5. Flora Rustle & Fauna Movement Layer
    this.rustleGain = this.ctx.createGain();
    this.rustleGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.rustleGain.connect(this.masterGain);

    // 6. Bee / Fly gentle drone
    this.beeGain = this.ctx.createGain();
    this.beeGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.beeGain.connect(this.masterGain);

    this.startContinuousSynthesizers();
    this.startEpisodicAudioLoops();
  }

  /**
   * Generates a 3-second seamless loop of organic pink noise
   */
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
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startContinuousSynthesizers() {
    if (!this.ctx || !this.rainGain || !this.windGain || !this.dayInsectsGain || !this.beeGain) return;

    const noiseBuffer = this.createPinkNoiseBuffer();
    if (!noiseBuffer) return;

    // 1. Rain Synthesizer (dual band filter)
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1600, this.ctx.currentTime);

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = noiseBuffer;
    this.rainSource.loop = true;
    this.rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainSource.start();

    // 2. Wind Synthesizer (sweeping resonant bandpass)
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(340, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(2.8, this.ctx.currentTime);

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;
    this.windSource.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windSource.start();

    // 3. Daytime Cicada continuous trill (FM synthesis)
    this.cicadaOsc = this.ctx.createOscillator();
    this.cicadaMod = this.ctx.createOscillator();
    const cicadaModGain = this.ctx.createGain();

    this.cicadaOsc.type = 'sawtooth';
    this.cicadaOsc.frequency.setValueAtTime(5600, this.ctx.currentTime);

    // Tremolo LFO (12 Hz flutter)
    this.cicadaMod.type = 'sine';
    this.cicadaMod.frequency.setValueAtTime(12.5, this.ctx.currentTime);
    cicadaModGain.gain.setValueAtTime(180, this.ctx.currentTime);

    this.cicadaMod.connect(cicadaModGain);
    cicadaModGain.connect(this.cicadaOsc.frequency);

    const cicadaBandpass = this.ctx.createBiquadFilter();
    cicadaBandpass.type = 'bandpass';
    cicadaBandpass.frequency.setValueAtTime(5600, this.ctx.currentTime);
    cicadaBandpass.Q.setValueAtTime(6.0, this.ctx.currentTime);

    this.cicadaOsc.connect(cicadaBandpass);
    cicadaBandpass.connect(this.dayInsectsGain);

    this.cicadaOsc.start();
    this.cicadaMod.start();

    // 4. Subtle Garden Hoverfly / Bee Hum (soft triangular warmth)
    this.beeOsc = this.ctx.createOscillator();
    const beeLfo = this.ctx.createOscillator();
    const beeLfoGain = this.ctx.createGain();

    this.beeOsc.type = 'triangle';
    this.beeOsc.frequency.setValueAtTime(175, this.ctx.currentTime);

    beeLfo.type = 'sine';
    beeLfo.frequency.setValueAtTime(6, this.ctx.currentTime);
    beeLfoGain.gain.setValueAtTime(15, this.ctx.currentTime);

    beeLfo.connect(beeLfoGain);
    beeLfoGain.connect(this.beeOsc.frequency);

    const beeFilter = this.ctx.createBiquadFilter();
    beeFilter.type = 'lowpass';
    beeFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.beeOsc.connect(beeFilter);
    beeFilter.connect(this.beeGain);

    this.beeOsc.start();
    beeLfo.start();
  }

  // --- Episodic procedural sound generators ---

  /**
   * Water droplet tap on glass or soil
   */
  public playWaterDroplet() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 800 + Math.random() * 700;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.6, now + 0.03);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.35, now + 0.14);

    gain.gain.setValueAtTime(0.07 * this.currentVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  /**
   * Night cricket multi-pulse chirp (chirp... chirp... chirp)
   */
  public playCricketStridulation() {
    if (!this.ctx || this.isMuted || !this.nightCricketsGain) return;
    const now = this.ctx.currentTime;

    const baseFreq = 4400 + Math.random() * 300;
    const pulses = 3;

    for (let i = 0; i < pulses; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq + (i % 2) * 50, now + i * 0.065);

      const pStart = now + i * 0.065;
      const pDur = 0.045;

      gain.gain.setValueAtTime(0.0001, pStart);
      gain.gain.linearRampToValueAtTime(0.045 * this.currentVolume, pStart + 0.01);
      gain.gain.linearRampToValueAtTime(0.0001, pStart + pDur);

      osc.connect(gain);
      gain.connect(this.nightCricketsGain);

      osc.start(pStart);
      osc.stop(pStart + pDur + 0.01);
    }
  }

  /**
   * Daytime meadow insect / grasshopper quick snap-chirp
   */
  public playDayGrasshopperChirp() {
    if (!this.ctx || this.isMuted || !this.dayInsectsGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const freq = 6200 + Math.random() * 800;
    osc.frequency.setValueAtTime(freq, now);

    // Two rapid clicks
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.03 * this.currentVolume, now + 0.015);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.03);
    gain.gain.linearRampToValueAtTime(0.035 * this.currentVolume, now + 0.045);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.075);

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(freq, now);
    bp.Q.setValueAtTime(5.0, now);

    osc.connect(bp);
    bp.connect(gain);
    gain.connect(this.dayInsectsGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Subtle flora foliage rustle (leaves brushing against each other / glass)
   */
  public playFloraRustle(intensity = 1.0) {
    if (!this.ctx || this.isMuted || !this.rustleGain) return;
    const now = this.ctx.currentTime;

    const noiseBuffer = this.createPinkNoiseBuffer();
    if (!noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const centerFreq = 1600 + Math.random() * 800;
    filter.frequency.setValueAtTime(centerFreq, now);
    filter.frequency.exponentialRampToValueAtTime(centerFreq * 0.7, now + 0.35);
    filter.Q.setValueAtTime(2.2, now);

    const gain = this.ctx.createGain();
    const dur = 0.28 + Math.random() * 0.15;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.05 * intensity * this.currentVolume, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.rustleGain);

    source.start(now);
    source.stop(now + dur + 0.02);
  }

  /**
   * Micro-fauna movement (insect / snail crawl on bark & moss)
   */
  public playCreatureMovement(creatureType: 'beetle' | 'snail' = 'beetle') {
    if (!this.ctx || this.isMuted || !this.rustleGain) return;
    const now = this.ctx.currentTime;

    if (creatureType === 'beetle') {
      // 3 quick delicate leg scuffs on bark
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const f = 2800 + Math.random() * 1200;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.05);

        const tStart = now + i * 0.05;
        gain.gain.setValueAtTime(0.0001, tStart);
        gain.gain.linearRampToValueAtTime(0.02 * this.currentVolume, tStart + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, tStart + 0.035);

        osc.connect(gain);
        gain.connect(this.rustleGain);

        osc.start(tStart);
        osc.stop(tStart + 0.04);
      }
    } else {
      // Snail moist gliding rustle (soft lowpass friction)
      const noiseBuffer = this.createPinkNoiseBuffer();
      if (!noiseBuffer) return;

      const source = this.ctx.createBufferSource();
      source.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(850, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.025 * this.currentVolume, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.rustleGain);

      source.start(now);
      source.stop(now + 0.48);
    }
  }

  /**
   * Distant low rolling thunder rumble during storms
   */
  public playThunderRumble() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const noiseBuffer = this.createPinkNoiseBuffer();
    if (!noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(95, now);
    subFilter.frequency.exponentialRampToValueAtTime(45, now + 2.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12 * this.currentVolume, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    source.connect(subFilter);
    subFilter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
    source.stop(now + 2.6);
  }

  /**
   * Interactive musical feedback on hydration / crystal selection
   */
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

    // Pair with subtle foliage rustle & droplet
    this.playFloraRustle(0.8);
  }

  /**
   * Procedural camera shutter click on snapshot capture
   */
  public playShutterSound() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Mechanical shutter click
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(3400, now);
    osc1.frequency.exponentialRampToValueAtTime(900, now + 0.025);
    gain1.gain.setValueAtTime(0.09 * this.currentVolume, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.04);

    // Aperture release click
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1600, now + 0.045);
    osc2.frequency.exponentialRampToValueAtTime(450, now + 0.08);
    gain2.gain.setValueAtTime(0.07 * this.currentVolume, now + 0.045);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.045);
    osc2.stop(now + 0.095);
  }

  /**
   * Schedules naturally occurring episodic ambient sounds
   */
  private startEpisodicAudioLoops() {
    // 1. Water droplets (frequent during rain/mist)
    const scheduleDroplet = () => {
      if (this.dropletTimer) window.clearTimeout(this.dropletTimer);
      const isRaining = this.lastWeather === 'rain' || this.lastWeather === 'storm';
      const delay = isRaining ? 500 + Math.random() * 1400 : 2500 + Math.random() * 5500;

      this.dropletTimer = window.setTimeout(() => {
        if (!this.isMuted && (isRaining || this.lastWeather === 'mist')) {
          this.playWaterDroplet();
        }
        scheduleDroplet();
      }, delay);
    };
    scheduleDroplet();

    // 2. Night crickets (active when dark)
    const scheduleNightCrickets = () => {
      if (this.nightCricketTimer) window.clearTimeout(this.nightCricketTimer);
      const delay = 1200 + Math.random() * 2800;
      this.nightCricketTimer = window.setTimeout(() => {
        const isNight = this.lastTimeHours > 19.5 || this.lastTimeHours < 5.5;
        if (!this.isMuted && isNight && this.lastWeather !== 'storm') {
          this.playCricketStridulation();
        }
        scheduleNightCrickets();
      }, delay);
    };
    scheduleNightCrickets();

    // 3. Daytime insects (active during day)
    const scheduleDayInsects = () => {
      if (this.dayInsectTimer) window.clearTimeout(this.dayInsectTimer);
      const delay = 1800 + Math.random() * 4000;
      this.dayInsectTimer = window.setTimeout(() => {
        const isDay = this.lastTimeHours >= 6.5 && this.lastTimeHours <= 19.0;
        if (!this.isMuted && isDay && this.lastWeather !== 'storm') {
          this.playDayGrasshopperChirp();
        }
        scheduleDayInsects();
      }, delay);
    };
    scheduleDayInsects();

    // 4. Subtle flora rustles & micro-fauna crawl
    const scheduleRustles = () => {
      if (this.rustleTimer) window.clearTimeout(this.rustleTimer);
      const delay = 3500 + Math.random() * 6000;
      this.rustleTimer = window.setTimeout(() => {
        if (!this.isMuted) {
          if (Math.random() > 0.45) {
            this.playFloraRustle(0.6 + Math.random() * 0.4);
          } else {
            this.playCreatureMovement(Math.random() > 0.5 ? 'beetle' : 'snail');
          }
        }
        scheduleRustles();
      }, delay);
    };
    scheduleRustles();

    // 5. Periodic distant thunder in storms
    const scheduleThunder = () => {
      if (this.thunderTimer) window.clearTimeout(this.thunderTimer);
      const delay = 7000 + Math.random() * 11000;
      this.thunderTimer = window.setTimeout(() => {
        if (!this.isMuted && this.lastWeather === 'storm') {
          this.playThunderRumble();
        }
        scheduleThunder();
      }, delay);
    };
    scheduleThunder();
  }

  // --- Dynamic Weather & Time Mixer ---

  public updateAmbience(weather: string, timeHours: number, humidity: number) {
    this.lastWeather = weather;
    this.lastTimeHours = timeHours;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Time calculations
    const isDay = timeHours >= 6.5 && timeHours <= 19.0;
    // Midday peak warmth around 12:00-14:00
    const middayFactor = Math.max(0, 1 - Math.abs(timeHours - 13.0) / 5.5);
    const isNight = timeHours > 19.5 || timeHours < 5.5;

    // 1. Rain intensity
    let targetRain = 0;
    if (weather === 'rain') targetRain = 0.22;
    else if (weather === 'storm') targetRain = 0.45;
    else if (weather === 'mist') targetRain = 0.05;

    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(targetRain, now, 0.4);
    }

    // 2. Wind intensity
    let targetWind = 0.04;
    if (weather === 'storm') targetWind = 0.22;
    else if (weather === 'spores') targetWind = 0.09;
    else if (weather === 'mist') targetWind = 0.06;

    if (this.windGain) {
      this.windGain.gain.setTargetAtTime(targetWind, now, 0.4);
    }

    // 3. Daytime insects (Cicadas & Bees)
    // Silenced during heavy rain or storms, highest during clear/spores warm sunny day
    let targetDayInsects = 0;
    let targetBee = 0;
    if (isDay && weather !== 'storm' && weather !== 'rain') {
      const weatherMult = weather === 'mist' ? 0.4 : 1.0;
      targetDayInsects = (0.04 + middayFactor * 0.08) * weatherMult;
      targetBee = (0.01 + middayFactor * 0.03) * weatherMult;
    }

    if (this.dayInsectsGain) {
      this.dayInsectsGain.gain.setTargetAtTime(targetDayInsects, now, 0.8);
    }
    if (this.beeGain) {
      this.beeGain.gain.setTargetAtTime(targetBee, now, 1.2);
    }

    // 4. Night Crickets
    let targetCrickets = 0;
    if (isNight && weather !== 'storm') {
      const weatherMult = weather === 'rain' ? 0.3 : 1.0;
      targetCrickets = 0.08 * weatherMult;
    }

    if (this.nightCricketsGain) {
      this.nightCricketsGain.gain.setTargetAtTime(targetCrickets, now, 0.8);
    }
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

      // Trigger initial welcoming leaf rustle & gentle chime
      if (enabled) {
        setTimeout(() => {
          this.playFloraRustle(0.7);
        }, 150);
      }
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
  }

  public dispose() {
    if (this.dropletTimer) window.clearTimeout(this.dropletTimer);
    if (this.nightCricketTimer) window.clearTimeout(this.nightCricketTimer);
    if (this.dayInsectTimer) window.clearTimeout(this.dayInsectTimer);
    if (this.rustleTimer) window.clearTimeout(this.rustleTimer);
    if (this.thunderTimer) window.clearTimeout(this.thunderTimer);

    if (this.cicadaOsc) {
      try { this.cicadaOsc.stop(); } catch { /* ignore */ }
    }
    if (this.cicadaMod) {
      try { this.cicadaMod.stop(); } catch { /* ignore */ }
    }
    if (this.beeOsc) {
      try { this.beeOsc.stop(); } catch { /* ignore */ }
    }
    if (this.rainSource) {
      try { this.rainSource.stop(); } catch { /* ignore */ }
    }
    if (this.windSource) {
      try { this.windSource.stop(); } catch { /* ignore */ }
    }

    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const terrariumAudio = new ProceduralTerrariumAudio();
