export type SoundEventType =
  | 'combat:swing'
  | 'combat:hit'
  | 'combat:crit'
  | 'combat:block'
  | 'combat:hurt'
  | 'combat:low_hp'
  | 'world:chest_open'
  | 'world:door_open'
  | 'world:shrine_activate'
  | 'world:teleport'
  | 'spell:fireball'
  | 'spell:heal'
  | 'study:discover'
  | 'ui:level_up'
  | 'ui:trade_coin'
  | 'ui:achievement'
  | 'ui:craft';

export interface SoundPlayOptions {
  volume?: number;
  pitch?: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private eventCooldowns: Partial<Record<SoundEventType, number>> = {};

  public muted = false;
  public masterVolume = 0.85;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const length = ctx.sampleRate * 1.0;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private canTrigger(event: SoundEventType, minIntervalMs: number): boolean {
    const now = performance.now();
    const last = this.eventCooldowns[event] ?? 0;
    if (now - last < minIntervalMs) return false;
    this.eventCooldowns[event] = now;
    return true;
  }

  private vol(base: number, options?: SoundPlayOptions): number {
    return Math.max(0.001, base * this.masterVolume * (options?.volume ?? 1));
  }

  /**
   * Punto de entrada unificado del Gestor de Sonidos para eventos de combate,
   * alertas de salud e interacciones del mundo (puertas y cofres).
   */
  public playEvent(event: SoundEventType, options?: SoundPlayOptions): void {
    switch (event) {
      case 'combat:swing':
        this.playSwing(options);
        break;
      case 'combat:hit':
        this.playHit(false, options);
        break;
      case 'combat:crit':
        this.playHit(true, options);
        break;
      case 'combat:block':
        this.playBlock(options);
        break;
      case 'combat:hurt':
        this.playPlayerHurt(options);
        break;
      case 'combat:low_hp':
        this.playLowHpWarning(options);
        break;
      case 'world:chest_open':
        this.playChestOpen(options);
        break;
      case 'world:door_open':
        this.playDoorOpen(options);
        break;
      case 'world:shrine_activate':
        this.playShrineActivate(options);
        break;
      case 'world:teleport':
        this.playTeleport(options);
        break;
      case 'spell:fireball':
        this.playFireball(options);
        break;
      case 'spell:heal':
        this.playHeal(options);
        break;
      case 'study:discover':
        this.playStudy(options);
        break;
      case 'ui:level_up':
        this.playLevelUp(options);
        break;
      case 'ui:trade_coin':
        this.playTradeCoin(options);
        break;
      case 'ui:achievement':
        this.playAchievement(options);
        break;
      case 'ui:craft':
        this.playCraft(options);
        break;
    }
  }

  public setMasterVolume(value: number): void {
    this.masterVolume = Math.max(0, Math.min(1, value));
  }

  public playSwing(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const pitch = options?.pitch ?? 1;

    // Air whoosh via filtered noise + triangle sweep
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650 * pitch, now);
    filter.frequency.exponentialRampToValueAtTime(220 * pitch, now + 0.14);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(this.vol(0.09, options), now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.15);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(90 * pitch, now + 0.14);
    gain.gain.setValueAtTime(this.vol(0.12, options), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playHit(isCrit: boolean, options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const pitch = options?.pitch ?? 1;

    // Punchy impact body
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isCrit ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime((isCrit ? 520 : 210) * pitch, now);
    osc.frequency.exponentialRampToValueAtTime((isCrit ? 160 : 62) * pitch, now + (isCrit ? 0.22 : 0.12));
    gain.gain.setValueAtTime(this.vol(isCrit ? 0.18 : 0.12, options), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isCrit ? 0.23 : 0.13));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);

    // Metallic blade slash transient
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);
    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(1400, now);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(this.vol(isCrit ? 0.16 : 0.08, options), now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    noise.connect(hpFilter);
    hpFilter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.1);

    // Critical hit harmonic ring
    if (isCrit) {
      const ring = ctx.createOscillator();
      const rGain = ctx.createGain();
      ring.type = 'triangle';
      ring.frequency.setValueAtTime(980 * pitch, now);
      ring.frequency.exponentialRampToValueAtTime(640 * pitch, now + 0.26);
      rGain.gain.setValueAtTime(this.vol(0.11, options), now);
      rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
      ring.connect(rGain);
      rGain.connect(ctx.destination);
      ring.start(now);
      ring.stop(now + 0.28);
    }
  }

  public playBlock(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canTrigger('combat:block', 90)) return;
    const now = ctx.currentTime;

    // Metallic shield clang (inharmonic partials)
    [415, 685, 1140].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.86, now + 0.24);
      gain.gain.setValueAtTime(this.vol(0.12 / (i + 1), options), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.27);
    });

    // Heavy thud of absorbed blow
    const thud = ctx.createOscillator();
    const tGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(140, now);
    thud.frequency.exponentialRampToValueAtTime(48, now + 0.12);
    tGain.gain.setValueAtTime(this.vol(0.18, options), now);
    tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    thud.connect(tGain);
    tGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.14);
  }

  public playPlayerHurt(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.17);
    gain.gain.setValueAtTime(this.vol(0.14, options), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playLowHpWarning(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.canTrigger('combat:low_hp', 2400)) return;
    const now = ctx.currentTime;

    // Double heartbeat thump ("lub-dub")
    [0, 0.22].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 78 : 66, now + offset);
      osc.frequency.exponentialRampToValueAtTime(36, now + offset + 0.16);
      gain.gain.setValueAtTime(this.vol(idx === 0 ? 0.22 : 0.17, options), now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.17);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.18);
    });
  }

  public playChestOpen(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Latch click
    const click = ctx.createOscillator();
    const cGain = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(620, now);
    click.frequency.exponentialRampToValueAtTime(240, now + 0.05);
    cGain.gain.setValueAtTime(this.vol(0.1, options), now);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    click.connect(cGain);
    cGain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.07);

    // 2. Wooden hinge creak
    const creak = ctx.createOscillator();
    const crFilter = ctx.createBiquadFilter();
    crFilter.type = 'bandpass';
    crFilter.frequency.setValueAtTime(380, now + 0.05);
    crFilter.Q.value = 5;
    const crGain = ctx.createGain();
    creak.type = 'sawtooth';
    creak.frequency.setValueAtTime(145, now + 0.05);
    creak.frequency.linearRampToValueAtTime(220, now + 0.22);
    creak.frequency.linearRampToValueAtTime(165, now + 0.34);
    crGain.gain.setValueAtTime(0.001, now + 0.05);
    crGain.gain.linearRampToValueAtTime(this.vol(0.08, options), now + 0.12);
    crGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    creak.connect(crFilter);
    crFilter.connect(crGain);
    crGain.connect(ctx.destination);
    creak.start(now + 0.05);
    creak.stop(now + 0.36);

    // 3. Treasure shimmer / coins
    [880, 1174.66, 1396.91].forEach((freq, idx) => {
      const coin = ctx.createOscillator();
      const coinGain = ctx.createGain();
      coin.type = 'sine';
      coin.frequency.setValueAtTime(freq, now + 0.16 + idx * 0.055);
      coinGain.gain.setValueAtTime(this.vol(0.07, options), now + 0.16 + idx * 0.055);
      coinGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38 + idx * 0.055);
      coin.connect(coinGain);
      coinGain.connect(ctx.destination);
      coin.start(now + 0.16 + idx * 0.055);
      coin.stop(now + 0.4 + idx * 0.055);
    });
  }

  public playDoorOpen(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Heavy stone/oak gate rumble via lowpass filtered noise
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(240, now);
    lp.frequency.linearRampToValueAtTime(130, now + 0.48);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.001, now);
    nGain.gain.linearRampToValueAtTime(this.vol(0.24, options), now + 0.08);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    noise.connect(lp);
    lp.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.54);

    // Iron latch / hinge resonance
    const creak = ctx.createOscillator();
    const cGain = ctx.createGain();
    creak.type = 'triangle';
    creak.frequency.setValueAtTime(115, now + 0.04);
    creak.frequency.linearRampToValueAtTime(165, now + 0.25);
    creak.frequency.linearRampToValueAtTime(88, now + 0.46);
    cGain.gain.setValueAtTime(this.vol(0.1, options), now + 0.04);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.47);
    creak.connect(cGain);
    cGain.connect(ctx.destination);
    creak.start(now + 0.04);
    creak.stop(now + 0.48);
  }

  public playFireball(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);
    gain.gain.setValueAtTime(this.vol(0.12, options), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playHeal(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(this.vol(0.09, options), now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  }

  public playStudy(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 554.37, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(this.vol(0.08, options), now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.24);
    });
  }

  public playLevelUp(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [392, 493.88, 587.33, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(this.vol(0.12, options), now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.4);
    });
  }

  public playTradeCoin(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1318.51, 1760.0].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);
      gain.gain.setValueAtTime(this.vol(0.11, options), now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.24);
    });
  }

  public playAchievement(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Heroic golden arpeggio (C5 - E5 - G5 - C6)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 3 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.075);
      gain.gain.setValueAtTime(this.vol(idx === 3 ? 0.13 : 0.1, options), now + idx * 0.075);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.075 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.075);
      osc.stop(now + idx * 0.075 + 0.47);
    });
  }

  public playCraft(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Anvil strike + alchemical harmonic chime
    [330, 660, 987.77].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(this.vol(idx === 0 ? 0.14 : 0.09, options), now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.36);
    });
  }

  public playShrineActivate(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [392.0, 587.33, 783.99, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);
      gain.gain.setValueAtTime(this.vol(0.11, options), now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.52);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.55);
    });
  }

  public playTeleport(options?: SoundPlayOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const sweep = ctx.createOscillator();
    const sGain = ctx.createGain();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(280, now);
    sweep.frequency.exponentialRampToValueAtTime(1120, now + 0.24);
    sweep.frequency.exponentialRampToValueAtTime(540, now + 0.42);
    sGain.gain.setValueAtTime(this.vol(0.13, options), now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    sweep.connect(sGain);
    sGain.connect(ctx.destination);
    sweep.start(now);
    sweep.stop(now + 0.46);

    [880, 1318.5].forEach((freq, idx) => {
      const chime = ctx.createOscillator();
      const cGain = ctx.createGain();
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(freq, now + 0.14 + idx * 0.06);
      cGain.gain.setValueAtTime(this.vol(0.08, options), now + 0.14 + idx * 0.06);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + idx * 0.06);
      chime.connect(cGain);
      cGain.connect(ctx.destination);
      chime.start(now + 0.14 + idx * 0.06);
      chime.stop(now + 0.47 + idx * 0.06);
    });
  }
}

export const soundEngine = new SoundEngine();
