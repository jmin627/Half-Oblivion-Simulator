// 절반 소멸 시뮬레이터 - Web Audio API 고품질 프로시저럴 사운드 엔진

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;
      }
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }
  }

  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(val) {
    this.enabled = !!val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.7 : 0, this.ctx.currentTime);
    }
  }

  // 1. 날카롭고 강렬한 스냅 소리 (Finger Snap)
  playSnap(combo = 1) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const comboPitchMultiplier = Math.min(1.8, 1 + (combo - 1) * 0.03);

    // 노이즈 버퍼로 마찰음 생성
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // 밴드패스 필터로 손가락 튕기는 마찰 주파수 강조
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400 * comboPitchMultiplier, t);
    filter.Q.setValueAtTime(3, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.07);

    // 타격감 있는 클릭 팝(Pop) 톤
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650 * comboPitchMultiplier, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);

    oscGain.gain.setValueAtTime(0.9, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // 2. 우주적 서브 베이스 충격파 (Cosmic Boom & Rumble)
  playCosmicBoom(isHighTier = false) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const duration = isHighTier ? 1.4 : 0.8;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isHighTier ? 120 : 90, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + duration);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  // 3. 희귀도별 팬파레 사운드
  playRarityFanfare(rarity) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;

    switch (rarity) {
      case 'COMMON': {
        // 부드러운 1음 차임
        this._playNote(523.25, t, 0.15, 'sine', 0.25); // C5
        break;
      }
      case 'UNCOMMON': {
        // 밝은 2음 코드 (C5 -> G5)
        this._playNote(523.25, t, 0.18, 'sine', 0.3);
        this._playNote(783.99, t + 0.08, 0.25, 'sine', 0.35);
        break;
      }
      case 'RARE': {
        // 신비로운 3음 아르페지오 (C5 -> E5 -> B5)
        this._playNote(523.25, t, 0.2, 'triangle', 0.35);
        this._playNote(659.25, t + 0.09, 0.2, 'triangle', 0.35);
        this._playNote(987.77, t + 0.18, 0.45, 'sine', 0.4);
        break;
      }
      case 'EPIC': {
        // 웅장한 SF 팡파르 (F4 -> A4 -> C5 -> F5)
        this._playNote(349.23, t, 0.25, 'triangle', 0.4);
        this._playNote(440.00, t + 0.08, 0.25, 'triangle', 0.4);
        this._playNote(523.25, t + 0.16, 0.3, 'sine', 0.45);
        this._playNote(698.46, t + 0.24, 0.7, 'sine', 0.5);
        break;
      }
      case 'LEGENDARY': {
        // 장엄한 영웅적 화음
        const notes = [261.63, 392.00, 523.25, 659.25, 1046.50];
        notes.forEach((freq, idx) => {
          this._playNote(freq, t + idx * 0.07, 0.9, 'triangle', 0.45);
        });
        break;
      }
      case 'COSMIC': {
        // 화면 전체를 뒤흔드는 우주적 초월 사운드
        const cosmicNotes = [196.00, 293.66, 392.00, 587.33, 783.99, 1174.66, 1567.98];
        cosmicNotes.forEach((freq, idx) => {
          this._playNote(freq, t + idx * 0.06, 1.6, idx % 2 === 0 ? 'sine' : 'triangle', 0.4);
        });
        // 은하 쉬머 효과음
        this._playShimmer(t + 0.4);
        break;
      }
    }
  }

  // 4. 레벨업 효과음 (Level Up Chime)
  playLevelUp() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      this._playNote(freq, t + idx * 0.07, 0.6, 'sine', 0.35);
    });
  }

  // 5. 업적 달성 / 보상 수령 사운드
  playAchievement() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    this._playNote(587.33, t, 0.2, 'triangle', 0.4);
    this._playNote(880.00, t + 0.1, 0.5, 'sine', 0.45);
  }

  // 6. 특수 이벤트 발생 사운드 (Double Snap, Uno Reverse 등)
  playSpecialEvent() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.25);
    osc.frequency.linearRampToValueAtTime(400, t + 0.4);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  // 헬퍼: 단일 음 재생
  _playNote(freq, startTime, duration, type = 'sine', volume = 0.3) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  // 헬퍼: 쉬머(Shimmer) 아르페지오
  _playShimmer(startTime) {
    if (!this.ctx) return;
    for (let i = 0; i < 8; i++) {
      const f = 1200 + i * 220;
      this._playNote(f, startTime + i * 0.04, 0.3, 'sine', 0.15);
    }
  }
}

export const soundEngine = new SoundEngine();
