// 절반 소멸 시뮬레이터 - 상태 관리 및 LocalStorage 영구 보존 엔진
import { DAILY_MISSION_TEMPLATES, ACHIEVEMENTS_DATA, GAUNTLET_TIERS } from './data/achievements.js';

const STORAGE_KEY = 'HALF_SNAP_SIMULATOR_V1';

export class GameState {
  constructor() {
    this.defaultState = {
      level: 1,
      exp: 0,
      dust: 100, // 시작 기본 지원금
      luck: 0,
      totalSnaps: 0,
      todaySnaps: 0,
      lastActiveDate: this._getTodayDateString(),
      combo: 0,
      maxCombo: 0,
      goodSnaps: 0,
      badSnaps: 0,
      neutralSnaps: 0,
      totalVirtualVanishedCount: 0, // 가상으로 사라진 누적 수치
      discovered: {}, // targetId: true
      discoveredCounts: {}, // targetId: count
      unlockedAchievements: {}, // achId: timestamp
      dailyMissions: [],
      equippedSkin: 'skin_default',
      equippedParticle: 'particle_default',
      equippedTheme: 'theme_default',
      purchasedItems: {},
      specialEventsExperienced: 0,
      hasCosmicDiscovered: false,
      consecutiveCommonCount: 0,
      multiSnapUnlocked: false,
      multiSnapMode: false,
      settings: {
        sound: true,
        particles: true,
        shake: true,
        fastAnim: false,
        vibration: true
      }
    };

    this.state = { ...this.defaultState };
    this.listeners = [];
    this.load();
    this._checkDailyReset();
  }

  _getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          ...this.defaultState,
          ...parsed,
          settings: { ...this.defaultState.settings, ...(parsed.settings || {}) }
        };
      }
    } catch (e) {
      console.error('Failed to load save state:', e);
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notify();
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  reset() {
    this.state = {
      ...this.defaultState,
      dailyMissions: this._generateDailyMissions()
    };
    this.save();
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notify() {
    for (let fn of this.listeners) {
      fn(this.state);
    }
  }

  _checkDailyReset() {
    const today = this._getTodayDateString();
    if (this.state.lastActiveDate !== today || !this.state.dailyMissions || this.state.dailyMissions.length === 0) {
      this.state.todaySnaps = 0;
      this.state.lastActiveDate = today;
      this.state.dailyMissions = this._generateDailyMissions();
      this.save();
    }
  }

  _generateDailyMissions() {
    const shuffled = [...DAILY_MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);
    return selected.map(t => ({
      id: t.id,
      title: t.title,
      target: t.target,
      type: t.type,
      current: 0,
      rewardDust: t.rewardDust,
      rewardExp: t.rewardExp,
      icon: t.icon,
      completed: false,
      claimed: false
    }));
  }

  // 레벨업에 필요한 경험치 공식
  getExpForNextLevel(level = this.state.level) {
    return Math.floor(120 * Math.pow(level, 1.32));
  }

  // 경험치 획득 및 레벨업 체크
  addExp(amount) {
    this.state.exp += amount;
    let leveledUp = false;
    let newLevel = this.state.level;

    while (this.state.exp >= this.getExpForNextLevel(newLevel)) {
      this.state.exp -= this.getExpForNextLevel(newLevel);
      newLevel++;
      leveledUp = true;
      this.state.dust += newLevel * 20; // 레벨업 축하금
      this.state.luck += 1; // 레벨업마다 행운 1 상승!
    }

    this.state.level = newLevel;
    if (newLevel >= 10) {
      this.state.multiSnapUnlocked = true;
    }
    this.save();
    return { leveledUp, level: newLevel };
  }

  // 재화 획득
  addDust(amount) {
    this.state.dust += amount;
    this.save();
  }

  // 현재 건틀릿 티어 정보 계산
  getCurrentGauntlet() {
    let currentTier = GAUNTLET_TIERS[0];
    for (let g of GAUNTLET_TIERS) {
      if (this.state.level >= g.minLevel) {
        currentTier = g;
      }
    }
    return currentTier;
  }

  // 성향 및 칭호 계산
  getKarmaTitle() {
    const total = this.state.goodSnaps + this.state.badSnaps;
    if (total < 5) return '🌀 각성을 기다리는 자';

    const goodRatio = this.state.goodSnaps / total;
    const badRatio = this.state.badSnaps / total;

    if (goodRatio >= 0.65) return '✨ 의외로 인류에게 도움됨';
    if (badRatio >= 0.65) return '💀 우주적 민폐의 화신';
    if (this.state.level >= 35) return '👑 현실을 비트는 자';
    if (this.state.level >= 20) return '🌌 차원 관조자';
    if (Math.abs(goodRatio - badRatio) <= 0.15) return '⚖️ 절반에 미친 자 (완벽한 균형)';
    return '🎲 혼돈 중립의 방랑자';
  }

  // 미션 진행도 갱신
  updateMissionProgress(type, count = 1) {
    if (!this.state.dailyMissions) return;
    let updated = false;

    for (let m of this.state.dailyMissions) {
      if (!m.completed && m.type === type) {
        m.current = Math.min(m.target, m.current + count);
        if (m.current >= m.target) {
          m.completed = true;
        }
        updated = true;
      }
    }
    if (updated) this.save();
  }

  // 업적 체크 및 자동 해금
  checkAchievements(targets) {
    const newlyUnlocked = [];
    for (let ach of ACHIEVEMENTS_DATA) {
      if (!this.state.unlockedAchievements[ach.id]) {
        if (ach.check(this.state, targets)) {
          this.state.unlockedAchievements[ach.id] = Date.now();
          this.state.dust += ach.rewardDust;
          this.addExp(ach.rewardExp);
          this.state.luck += 1;
          newlyUnlocked.push(ach);
        }
      }
    }
    if (newlyUnlocked.length > 0) {
      this.save();
    }
    return newlyUnlocked;
  }
}

export const gameState = new GameState();
