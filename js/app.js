// 절반 소멸 시뮬레이터 - 메인 애플리케이션 컨트롤러
import { TARGETS_DATA, CATEGORIES, RARITIES, TOTAL_TARGETS_COUNT } from './data/targets.js';
import { GAUNTLET_TIERS, ACHIEVEMENTS_DATA, SHOP_ITEMS } from './data/achievements.js';
import { gameState } from './state.js';
import { soundEngine } from './audio.js';
import { ParticleEngine } from './particles.js';

class HalfSnapApp {
  constructor() {
    this.particleEngine = null;
    this.isSnapping = false;
    this.comboTimer = null;
    this.currentCategoryFilter = 'ALL';
    this.probabilityCollapseUntil = 0; // 확률 붕괴 버프 시간

    // DOM 요소 캐싱
    this.dom = {
      canvas: document.getElementById('particle-canvas'),
      gauntletContainer: document.getElementById('gauntlet-container'),
      gauntletVisual: document.getElementById('gauntlet-visual'),
      snapBtn: document.getElementById('snap-btn'),
      comboDisplay: document.getElementById('combo-display'),
      comboCount: document.getElementById('combo-count'),
      resultModal: document.getElementById('result-modal'),
      resultCard: document.getElementById('result-card'),
      toastContainer: document.getElementById('toast-container'),
      cosmicOverlay: document.getElementById('cosmic-overlay'),
      
      // HUD
      playerLevel: document.getElementById('hud-player-level'),
      playerExpBar: document.getElementById('hud-exp-bar'),
      playerExpText: document.getElementById('hud-exp-text'),
      playerDust: document.getElementById('hud-dust'),
      playerLuck: document.getElementById('hud-luck'),
      gauntletName: document.getElementById('hud-gauntlet-name'),
      soundToggleBtn: document.getElementById('hud-sound-toggle'),

      // 모달들
      codexModal: document.getElementById('modal-codex'),
      achievementsModal: document.getElementById('modal-achievements'),
      statsModal: document.getElementById('modal-stats'),
      missionsModal: document.getElementById('modal-missions'),
      shopModal: document.getElementById('modal-shop'),
      settingsModal: document.getElementById('modal-settings'),

      // 모달 탭 버튼들
      navBtns: document.querySelectorAll('[data-tab]'),
      closeModalBtns: document.querySelectorAll('.modal-close-btn')
    };

    this.init();
  }

  init() {
    // 1. 파티클 엔진 초기화
    if (this.dom.canvas) {
      this.particleEngine = new ParticleEngine(this.dom.canvas);
      this.particleEngine.start();
    }

    // 2. 이벤트 바인딩
    this.bindEvents();

    // 3. 상태 구독 및 초기 렌더링
    gameState.subscribe(() => this.renderHUD());
    this.renderHUD();
    this.applyEquippedItems();

    // 첫 방문 팁 토스트
    if (gameState.state.totalSnaps === 0) {
      this.showToast('✨ 화면 중앙의 건틀릿이나 [ SNAP ] 버튼을 눌러 우주의 절반을 날려보세요!', 'info');
    }
  }

  bindEvents() {
    // 스냅 버튼 클릭
    this.dom.snapBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerSnap();
    });

    // 건틀릿 클릭
    this.dom.gauntletContainer.addEventListener('click', () => {
      this.triggerSnap();
    });

    // 키보드 스페이스바 스냅
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.isAnyModalOpen() && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        this.triggerSnap();
      }
    });

    // 모바일 터치 스와이프 제스처 지원 (짧은 스와이프로 튕기기)
    let touchStartY = 0;
    let touchStartX = 0;
    this.dom.gauntletContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    this.dom.gauntletContainer.addEventListener('touchend', (e) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > 20) { // 스와이프 감지
        this.triggerSnap();
      }
    }, { passive: true });

    // 사운드 토글
    this.dom.soundToggleBtn.addEventListener('click', () => {
      const current = gameState.state.settings.sound;
      gameState.state.settings.sound = !current;
      soundEngine.setEnabled(!current);
      gameState.save();
      this.renderHUD();
      this.showToast(!current ? '🔊 사운드가 켜졌습니다.' : '🔇 음소거되었습니다.', 'info');
    });

    // 하단 네비게이션 탭 모달 열기
    this.dom.navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.openTabModal(tab);
      });
    });

    // 모달 닫기
    this.dom.closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllModals();
      });
    });

    // 모달 배경 클릭 시 닫기
    document.querySelectorAll('.app-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeAllModals();
        }
      });
    });

    // 결과 모달 닫기 버튼
    const closeResultBtn = document.getElementById('result-close-btn');
    if (closeResultBtn) {
      closeResultBtn.addEventListener('click', () => {
        this.dom.resultModal.classList.remove('active');
      });
    }
  }

  isAnyModalOpen() {
    return document.querySelector('.app-modal.active') !== null;
  }

  closeAllModals() {
    document.querySelectorAll('.app-modal').forEach(m => m.classList.remove('active'));
  }

  openTabModal(tabName) {
    this.closeAllModals();
    soundEngine.resume();

    switch (tabName) {
      case 'codex':
        this.renderCodex();
        this.dom.codexModal.classList.add('active');
        break;
      case 'achievements':
        this.renderAchievements();
        this.dom.achievementsModal.classList.add('active');
        break;
      case 'stats':
        this.renderStats();
        this.dom.statsModal.classList.add('active');
        break;
      case 'missions':
        this.renderMissions();
        this.dom.missionsModal.classList.add('active');
        break;
      case 'shop':
        this.renderShop();
        this.dom.shopModal.classList.add('active');
        break;
      case 'settings':
        this.renderSettings();
        this.dom.settingsModal.classList.add('active');
        break;
    }
  }

  // ================= 💥 핵심 스냅 시퀀스 =================
  async triggerSnap() {
    if (this.isSnapping) return;
    this.isSnapping = true;
    soundEngine.resume();

    // 콤보 증가
    gameState.state.combo += 1;
    if (gameState.state.combo > gameState.state.maxCombo) {
      gameState.state.maxCombo = gameState.state.combo;
    }
    this.updateComboDisplay();

    // 콤보 타이머 리셋 (4초 후 콤보 초기화)
    clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => {
      gameState.state.combo = 0;
      this.updateComboDisplay();
      gameState.save();
    }, 4000);

    // 진동 피드백 (모바일 기기)
    if (gameState.state.settings.vibration && navigator.vibrate) {
      navigator.vibrate(gameState.state.combo > 5 ? [40, 30, 40] : 40);
    }

    // 1. 건틀릿 스냅 애니메이션 & 사운드
    this.dom.gauntletVisual.classList.add('snapping');
    soundEngine.playSnap(gameState.state.combo);

    // 2. 화면 암전 및 번쩍임
    document.body.classList.add('snap-flash');
    setTimeout(() => document.body.classList.remove('snap-flash'), 400);

    // 3. 파티클 폭발
    const rect = this.dom.gauntletContainer.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const gauntlet = gameState.getCurrentGauntlet();
    
    if (this.particleEngine) {
      this.particleEngine.spawnSnapDust(cx, cy, 70 + Math.min(60, gameState.state.combo * 2), gauntlet.color);
    }

    // 4. 화면 흔들림 효과
    if (gameState.state.settings.shake) {
      document.body.classList.add('screen-shake');
      setTimeout(() => document.body.classList.remove('screen-shake'), 350);
    }

    // 서브 베이스 충격음
    soundEngine.playCosmicBoom(gauntlet.tier >= 3);

    // 5. 특수 랜덤 이벤트 검사 (더블 스냅, 우노 리버스 등 7% 확률)
    const specialEvent = this.rollSpecialEvent();

    // 6. 타겟 선택 알고리즘
    const target = this.pickRandomTarget();
    let secondTarget = null;
    if (specialEvent && specialEvent.id === 'DOUBLE_SNAP') {
      secondTarget = this.pickRandomTarget(target.id);
    }

    // 0.5초 긴장감 대기 후 결과 공개 (FastAnim 모드면 0.2초)
    const waitDelay = gameState.state.settings.fastAnim ? 200 : 550;
    await new Promise(res => setTimeout(res, waitDelay));

    this.dom.gauntletVisual.classList.remove('snapping');
    this.isSnapping = false;

    // 결과 처리 및 모달 표시
    this.processSnapResult(target, specialEvent, secondTarget);
  }

  // 특수 랜덤 이벤트 추첨
  rollSpecialEvent() {
    if (gameState.state.level < 5) return null; // 5레벨 이상부터 돌발 이벤트 활성화
    const roll = Math.random();
    if (roll > 0.08) return null; // 92%는 일반 스냅

    const events = [
      { id: 'DOUBLE_SNAP', title: '⚡ DOUBLE SNAP!', desc: '차원 왜곡으로 한 번에 두 가지가 동시에 절반 소멸했습니다!', multiplier: 2.0 },
      { id: 'WRONG_SNAP', title: '📐 WRONG SNAP (49.7%)', desc: '절반이 아니라 49.7%가 사라졌습니다. "계산 담당자 실수"', multiplier: 1.0 },
      { id: 'CRITICAL_SNAP', title: '💥 CRITICAL SNAP (75% 소멸)', desc: '절반의 절반이 또 날아가 단 25%만 남았습니다!', multiplier: 1.5 },
      { id: 'UNO_REVERSE', title: '🔄 UNO REVERSE!', desc: '인과율 역전! 선택된 대상이 절반이 아니라 2배로 증가했습니다!', multiplier: 1.2 },
      { id: 'PROBABILITY_COLLAPSE', title: '🌟 확률 붕괴 (Reality Collapse)', desc: '15초 동안 Rare 이상 등급 출현 확률이 대폭 상승합니다!', multiplier: 1.5 }
    ];

    const chosen = events[Math.floor(Math.random() * events.length)];
    gameState.state.specialEventsExperienced += 1;
    soundEngine.playSpecialEvent();

    if (chosen.id === 'PROBABILITY_COLLAPSE') {
      this.probabilityCollapseUntil = Date.now() + 15000;
      this.showToast('🌟 15초 동안 희귀 등급 등장 확률 대폭 증가!', 'event');
    }

    return chosen;
  }

  // 가중치 및 행운 스탯 기반 타겟 추첨
  pickRandomTarget(excludeId = null) {
    const isBuffActive = Date.now() < this.probabilityCollapseUntil;
    const effectiveLuck = gameState.state.luck + (isBuffActive ? 25 : 0);

    // 희귀도 가중치 동적 계산
    const weights = {
      COMMON: Math.max(15, RARITIES.COMMON.weight - effectiveLuck * 0.4),
      UNCOMMON: RARITIES.UNCOMMON.weight,
      RARE: RARITIES.RARE.weight + effectiveLuck * 0.25,
      EPIC: RARITIES.EPIC.weight + effectiveLuck * 0.15,
      LEGENDARY: RARITIES.LEGENDARY.weight + effectiveLuck * 0.08,
      COSMIC: RARITIES.COSMIC.weight + effectiveLuck * 0.04
    };

    // 총 가중치 합산
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    let chosenRarity = 'COMMON';

    for (let [rarityKey, w] of Object.entries(weights)) {
      if (rand <= w) {
        chosenRarity = rarityKey;
        break;
      }
      rand -= w;
    }

    // 해당 희귀도의 타겟들 필터
    let candidates = TARGETS_DATA.filter(t => t.rarity === chosenRarity && t.id !== excludeId);
    if (candidates.length === 0) {
      candidates = TARGETS_DATA.filter(t => t.id !== excludeId);
    }

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    return selected;
  }

  // 스냅 결과 상태 반영 및 UI 카드 렌더링
  processSnapResult(target, specialEvent = null, secondTarget = null) {
    gameState.state.totalSnaps += 1;
    gameState.state.todaySnaps += 1;

    const isNew = !gameState.state.discovered[target.id];
    gameState.state.discovered[target.id] = true;
    gameState.state.discoveredCounts[target.id] = (gameState.state.discoveredCounts[target.id] || 0) + 1;
    const currentDiscoveryCount = gameState.state.discoveredCounts[target.id];

    // 연속 커먼 체크
    if (target.rarity === 'COMMON') {
      gameState.state.consecutiveCommonCount += 1;
    } else {
      gameState.state.consecutiveCommonCount = 0;
    }

    if (target.rarity === 'COSMIC') {
      gameState.state.hasCosmicDiscovered = true;
      if (this.particleEngine) this.particleEngine.spawnCosmicBurst();
      this.triggerCosmicWarpAnimation();
    }

    // 성향 반영
    if (target.polarity === 'good') gameState.state.goodSnaps += 1;
    else if (target.polarity === 'bad') gameState.state.badSnaps += 1;
    else gameState.state.neutralSnaps += 1;

    // 가상 소멸 수치 누적
    const vanishedVal = target.originalVal * 0.5;
    gameState.state.totalVirtualVanishedCount += vanishedVal;

    // 경험치 및 재화 계산
    const baseExp = {
      COMMON: 25,
      UNCOMMON: 40,
      RARE: 70,
      EPIC: 120,
      LEGENDARY: 250,
      COSMIC: 800
    }[target.rarity] || 25;

    const comboBonus = Math.floor(gameState.state.combo * 1.5);
    const newBonus = isNew ? 50 : 0;
    const totalExpGain = baseExp + comboBonus + newBonus;
    const dustGain = Math.floor((baseExp / 10) + (isNew ? 10 : 2));

    const expResult = gameState.addExp(totalExpGain);
    gameState.addDust(dustGain);

    // 미션 및 업적 갱신
    gameState.updateMissionProgress('snaps', 1);
    if (target.category === 'FOOD') gameState.updateMissionProgress('food', 1);
    if (target.category === 'LAB') gameState.updateMissionProgress('lab', 1);
    if (['RARE', 'EPIC', 'LEGENDARY', 'COSMIC'].includes(target.rarity)) gameState.updateMissionProgress('rare_plus', 1);
    if (target.polarity === 'good') gameState.updateMissionProgress('good_snap', 1);
    if (isNew) gameState.updateMissionProgress('new_discovery', 1);
    if (gameState.state.combo >= 10) gameState.updateMissionProgress('combo', gameState.state.combo);

    const unlockedAchs = gameState.checkAchievements(TARGETS_DATA);
    for (let ach of unlockedAchs) {
      soundEngine.playAchievement();
      this.showToast(`🏆 업적 달성: [${ach.title}] (+${ach.rewardDust} Dust)`, 'achievement');
    }

    if (expResult.leveledUp) {
      soundEngine.playLevelUp();
      this.showToast(`🎉 LEVEL UP! 플레이어 레벨 ${expResult.level} 달성!`, 'levelup');
    }

    // 사운드 팬파레
    soundEngine.playRarityFanfare(target.rarity);

    // 메타 이벤트 시각 연출 트리거 (이 웹사이트 글자 소멸 등)
    if (target.id === 'meta-website-text') {
      this.triggerMetaTextGlitch();
    } else if (target.id === 'meta-website-buttons') {
      this.triggerMetaButtonGlitch();
    }

    // 결과 카드 렌더링
    this.renderResultCard(target, isNew, currentDiscoveryCount, totalExpGain, dustGain, specialEvent, secondTarget);
  }

  // 메타 이벤트 1: 화면 글자 3초간 소멸 연출
  triggerMetaTextGlitch() {
    document.body.classList.add('meta-text-dissolved');
    this.showToast('🔤 글자 소멸 연출 발생! 3초 후 양자 복구됩니다.', 'event');
    setTimeout(() => {
      document.body.classList.remove('meta-text-dissolved');
    }, 3200);
  }

  // 메타 이벤트 2: 버튼 투명화 연출
  triggerMetaButtonGlitch() {
    document.body.classList.add('meta-button-glitched');
    setTimeout(() => {
      document.body.classList.remove('meta-button-glitched');
    }, 3000);
  }

  // Cosmic 전용 화면 왜곡 웜홀 애니메이션
  triggerCosmicWarpAnimation() {
    this.dom.cosmicOverlay.classList.add('active');
    setTimeout(() => {
      this.dom.cosmicOverlay.classList.remove('active');
    }, 2500);
  }

  // 결과 카드 렌더링
  renderResultCard(target, isNew, discoveryCount, expGain, dustGain, specialEvent = null, secondTarget = null) {
    const rarityMeta = RARITIES[target.rarity] || RARITIES.COMMON;
    const categoryMeta = CATEGORIES[target.category] || { name: '기타', icon: '❓' };

    let polarityBadge = '';
    if (target.polarity === 'good') polarityBadge = '<span class="badge badge-good">😇 GOOD SNAP</span>';
    else if (target.polarity === 'bad') polarityBadge = '<span class="badge badge-bad">💀 BAD SNAP</span>';
    else polarityBadge = '<span class="badge badge-neutral">🎲 NEUTRAL</span>';

    // 수치 계산 (Uno Reverse면 2배, Critical이면 75% 감소, Wrong이면 49.7% 감소)
    let reducedVal = target.originalVal * 0.5;
    let reductionText = '50% 절반 소멸';
    if (specialEvent) {
      if (specialEvent.id === 'UNO_REVERSE') {
        reducedVal = target.originalVal * 2;
        reductionText = '💥 2배 폭증 (UNO REVERSE)';
      } else if (specialEvent.id === 'CRITICAL_SNAP') {
        reducedVal = target.originalVal * 0.25;
        reductionText = '💥 75% 초임계 소멸';
      } else if (specialEvent.id === 'WRONG_SNAP') {
        reducedVal = target.originalVal * 0.503;
        reductionText = '📐 49.7% 오차 소멸';
      }
    }

    const formatNum = (n) => {
      if (n >= 1000000000000) return (n / 1000000000000).toLocaleString() + '조';
      if (n >= 100000000) return (n / 100000000).toLocaleString() + '억';
      if (n >= 10000) return (n / 10000).toLocaleString() + '만';
      return Number(n.toFixed(1)).toLocaleString();
    };

    const duplicateBadge = discoveryCount > 1 
      ? `<span class="duplicate-level-badge">⭐ Lv. ${Math.min(5, Math.floor(discoveryCount / 2) + 1)} (${discoveryCount}회 발견)</span>`
      : '';

    let eventHtml = '';
    if (specialEvent) {
      eventHtml = `
        <div class="special-event-banner">
          <div class="event-title">${specialEvent.title}</div>
          <div class="event-desc">${specialEvent.desc}</div>
        </div>
      `;
    }

    let secondTargetHtml = '';
    if (secondTarget) {
      secondTargetHtml = `
        <div class="second-target-box">
          <div class="second-title">⚡ 동시 소멸: ${secondTarget.emoji} ${secondTarget.name}</div>
          <div class="second-values">${formatNum(secondTarget.originalVal)} ${secondTarget.unit} → ${formatNum(secondTarget.originalVal * 0.5)} ${secondTarget.unit}</div>
        </div>
      `;
    }

    const loreUnlock = discoveryCount >= 3 && target.loreLv3 
      ? `<div class="lore-unlock-box"><strong>🔓 ⭐Lv.3 해금 로어:</strong> "${target.loreLv3}"</div>`
      : '';

    this.dom.resultCard.innerHTML = `
      <div class="result-card-inner rarity-border-${target.rarity.toLowerCase()}" style="--rarity-color: ${rarityMeta.color}">
        ${isNew ? '<div class="new-discovery-ribbon">✨ NEW DISCOVERY!</div>' : ''}
        
        ${eventHtml}

        <div class="result-header">
          <div class="category-tag">${categoryMeta.icon} ${categoryMeta.name}</div>
          <div class="rarity-tag" style="background: ${rarityMeta.bg}; color: ${rarityMeta.color}; border: 1px solid ${rarityMeta.border}">
            ${rarityMeta.name}
          </div>
        </div>

        <div class="result-target-header">
          <span class="target-emoji">${target.emoji}</span>
          <h2 class="target-name">${target.name}</h2>
          ${duplicateBadge}
        </div>

        <div class="value-transformation-box">
          <div class="val-block val-old">
            <span class="val-label">기존 수치</span>
            <span class="val-number">${formatNum(target.originalVal)} <small>${target.unit}</small></span>
          </div>
          <div class="val-arrow">↓</div>
          <div class="val-block val-new">
            <span class="val-label">${reductionText}</span>
            <span class="val-number animated-number">${formatNum(reducedVal)} <small>${target.unit}</small></span>
          </div>
        </div>

        ${secondTargetHtml}

        <div class="result-polarity-container">
          ${polarityBadge}
        </div>

        <p class="result-desc">${target.desc}</p>
        <blockquote class="result-humor-quote">"${target.humor}"</blockquote>

        ${loreUnlock}

        <div class="result-rewards-footer">
          <span class="reward-pill exp-pill">+${expGain} EXP</span>
          <span class="reward-pill dust-pill">+${dustGain} Dust</span>
          ${gameState.state.combo > 1 ? `<span class="reward-pill combo-pill">Combo x${gameState.state.combo}</span>` : ''}
        </div>
      </div>
    `;

    this.dom.resultModal.classList.add('active');
  }

  // 콤보 HUD 갱신
  updateComboDisplay() {
    if (gameState.state.combo > 1) {
      this.dom.comboDisplay.classList.add('active');
      this.dom.comboCount.textContent = `x${gameState.state.combo}`;
      if (gameState.state.combo >= 10) {
        this.dom.comboDisplay.classList.add('high-combo');
      } else {
        this.dom.comboDisplay.classList.remove('high-combo');
      }
    } else {
      this.dom.comboDisplay.classList.remove('active');
      this.dom.comboDisplay.classList.remove('high-combo');
    }
  }

  // HUD 상단 정보 렌더링
  renderHUD() {
    const state = gameState.state;
    this.dom.playerLevel.textContent = `Lv. ${state.level}`;

    const nextExp = gameState.getExpForNextLevel();
    const expPercent = Math.min(100, Math.floor((state.exp / nextExp) * 100));
    this.dom.playerExpBar.style.width = `${expPercent}%`;
    this.dom.playerExpText.textContent = `${state.exp} / ${nextExp} EXP (${expPercent}%)`;

    this.dom.playerDust.textContent = state.dust.toLocaleString();
    this.dom.playerLuck.textContent = `🍀 +${state.luck}`;

    const gauntlet = gameState.getCurrentGauntlet();
    this.dom.gauntletName.textContent = gauntlet.name;
    this.dom.gauntletName.style.color = gauntlet.color;

    // 사운드 아이콘
    this.dom.soundToggleBtn.textContent = state.settings.sound ? '🔊' : '🔇';

    // 건틀릿 비주얼 업데이트 (티어에 따른 오라 글로우)
    this.dom.gauntletVisual.style.filter = `drop-shadow(0 0 25px ${gauntlet.color})`;
  }

  // 장착 아이템 스타일 적용
  applyEquippedItems() {
    const shopItemParticle = SHOP_ITEMS.find(i => i.id === gameState.state.equippedParticle);
    if (shopItemParticle && this.particleEngine) {
      this.particleEngine.setAuraColor(shopItemParticle.particleColor);
    }

    // 테마 클래스
    document.body.className = '';
    const themeItem = SHOP_ITEMS.find(i => i.id === gameState.state.equippedTheme);
    if (themeItem && themeItem.themeClass) {
      document.body.classList.add(themeItem.themeClass);
    }
  }

  // ================= 📖 소멸 도감 탭 렌더링 =================
  renderCodex() {
    const state = gameState.state;
    const totalFound = Object.keys(state.discovered).length;
    const progressPercent = ((totalFound / TOTAL_TARGETS_COUNT) * 100).toFixed(1);

    const progressContainer = document.getElementById('codex-progress-box');
    if (progressContainer) {
      progressContainer.innerHTML = `
        <div class="codex-stat-summary">
          <div class="stat-number-large">${totalFound} / ${TOTAL_TARGETS_COUNT}</div>
          <div class="stat-desc-bar">
            <div class="codex-bar-fill" style="width: ${progressPercent}%"></div>
          </div>
          <div class="stat-percent-text">도감 완성도: <strong>${progressPercent}%</strong></div>
        </div>
      `;
    }

    // 카테고리 필터 버튼 렌더링
    const filterContainer = document.getElementById('codex-category-filters');
    if (filterContainer) {
      filterContainer.innerHTML = `
        <button class="category-pill-btn ${this.currentCategoryFilter === 'ALL' ? 'active' : ''}" data-cat="ALL">전체 (${totalFound}/${TOTAL_TARGETS_COUNT})</button>
        ${Object.values(CATEGORIES).map(cat => {
          const inCat = TARGETS_DATA.filter(t => t.category === cat.id);
          const foundInCat = inCat.filter(t => state.discovered[t.id]).length;
          return `
            <button class="category-pill-btn ${this.currentCategoryFilter === cat.id ? 'active' : ''}" data-cat="${cat.id}">
              ${cat.icon} ${cat.name.split('/')[0]} (${foundInCat}/${inCat.length})
            </button>
          `;
        }).join('')}
      `;

      filterContainer.querySelectorAll('.category-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.currentCategoryFilter = btn.getAttribute('data-cat');
          this.renderCodex();
        });
      });
    }

    // 아이템 그리드 렌더링
    const gridContainer = document.getElementById('codex-grid');
    if (!gridContainer) return;

    let filtered = TARGETS_DATA;
    if (this.currentCategoryFilter !== 'ALL') {
      filtered = TARGETS_DATA.filter(t => t.category === this.currentCategoryFilter);
    }

    gridContainer.innerHTML = filtered.map(t => {
      const isDiscovered = state.discovered[t.id];
      const count = state.discoveredCounts[t.id] || 0;
      const rarityMeta = RARITIES[t.rarity] || RARITIES.COMMON;

      if (!isDiscovered) {
        return `
          <div class="codex-card undiscovered">
            <div class="codex-card-header">
              <span class="codex-rarity-badge" style="color: ${rarityMeta.color}">${rarityMeta.name}</span>
            </div>
            <div class="codex-unknown-icon">❓</div>
            <div class="codex-card-title">???</div>
            <div class="codex-card-desc">"아직 이 운명을 목격하지 못했습니다."</div>
          </div>
        `;
      }

      return `
        <div class="codex-card discovered rarity-border-${t.rarity.toLowerCase()}" style="--rarity-color: ${rarityMeta.color}">
          <div class="codex-card-header">
            <span class="codex-rarity-badge" style="background: ${rarityMeta.bg}; color: ${rarityMeta.color}; border: 1px solid ${rarityMeta.border}">${rarityMeta.name}</span>
            <span class="codex-count-badge">⭐ Lv. ${Math.min(5, Math.floor(count / 2) + 1)} (${count}회)</span>
          </div>
          <div class="codex-emoji-icon">${t.emoji}</div>
          <div class="codex-card-title">${t.name}</div>
          <div class="codex-values">${Number(t.originalVal).toLocaleString()} ${t.unit} → 절반 소멸</div>
          <div class="codex-card-humor">"${t.humor}"</div>
          ${count >= 3 && t.loreLv3 ? `<div class="codex-lore">🔓 Lv.3 로어: ${t.loreLv3}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  // ================= 🏆 업적 탭 렌더링 =================
  renderAchievements() {
    const listContainer = document.getElementById('achievements-list');
    if (!listContainer) return;

    const state = gameState.state;
    const unlockedCount = Object.keys(state.unlockedAchievements).length;

    document.getElementById('achievements-summary').textContent = `달성 업적: ${unlockedCount} / ${ACHIEVEMENTS_DATA.length}`;

    listContainer.innerHTML = ACHIEVEMENTS_DATA.map(ach => {
      const isUnlocked = !!state.unlockedAchievements[ach.id];
      return `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="ach-icon">${ach.icon}</div>
          <div class="ach-info">
            <div class="ach-title">${ach.title} ${isUnlocked ? '<span class="ach-check">✓ 달성 완료</span>' : ''}</div>
            <div class="ach-desc">${ach.desc}</div>
            <div class="ach-rewards">보상: <strong>+${ach.rewardDust} Dust</strong>, <strong>+${ach.rewardExp} EXP</strong></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ================= 📊 통계 & 성향 탭 렌더링 =================
  renderStats() {
    const state = gameState.state;
    const karmaTitle = gameState.getKarmaTitle();
    const totalFound = Object.keys(state.discovered).length;
    const completionRate = ((totalFound / TOTAL_TARGETS_COUNT) * 100).toFixed(1);

    // 가장 많이 소멸시킨 타겟
    let topTargetName = '없음';
    let topTargetCount = 0;
    for (let [id, count] of Object.entries(state.discoveredCounts)) {
      if (count > topTargetCount) {
        topTargetCount = count;
        const found = TARGETS_DATA.find(t => t.id === id);
        if (found) topTargetName = `${found.emoji} ${found.name}`;
      }
    }

    const totalPolarity = state.goodSnaps + state.badSnaps || 1;
    const goodPercent = Math.round((state.goodSnaps / totalPolarity) * 100);
    const badPercent = 100 - goodPercent;

    document.getElementById('stats-karma-title').innerHTML = `
      <div class="karma-badge">${karmaTitle}</div>
      <div class="karma-subtext">GOOD SNAP ${state.goodSnaps}회 (${goodPercent}%) vs BAD SNAP ${state.badSnaps}회 (${badPercent}%)</div>
    `;

    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">총 스냅 횟수</div>
        <div class="stat-val">${state.totalSnaps.toLocaleString()}회</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">오늘 한 스냅</div>
        <div class="stat-val">${state.todaySnaps.toLocaleString()}회</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">도감 발견 수</div>
        <div class="stat-val">${totalFound} / ${TOTAL_TARGETS_COUNT} (${completionRate}%)</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">최고 연속 콤보</div>
        <div class="stat-val">🔥 x${state.maxCombo}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">가장 많이 없앤 대상</div>
        <div class="stat-val">${topTargetName} (${topTargetCount}회)</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Cosmic Luck</div>
        <div class="stat-val">🍀 +${state.luck}</div>
      </div>
      <div class="stat-card full-width">
        <div class="stat-label">가상으로 사라진 만물의 총 개체 수</div>
        <div class="stat-val text-gold">${Math.floor(state.totalVirtualVanishedCount).toLocaleString()} 단위 개체</div>
      </div>
    `;
  }

  // ================= 📜 데일리 미션 탭 렌더링 =================
  renderMissions() {
    const listContainer = document.getElementById('missions-list');
    if (!listContainer) return;

    listContainer.innerHTML = gameState.state.dailyMissions.map((m, idx) => {
      const progressPercent = Math.min(100, Math.floor((m.current / m.target) * 100));
      return `
        <div class="mission-card ${m.claimed ? 'claimed' : (m.completed ? 'completed' : '')}">
          <div class="mission-icon">${m.icon}</div>
          <div class="mission-body">
            <div class="mission-title">${m.title}</div>
            <div class="mission-bar-container">
              <div class="mission-bar-fill" style="width: ${progressPercent}%"></div>
            </div>
            <div class="mission-progress-text">${m.current} / ${m.target} (${progressPercent}%)</div>
          </div>
          <div class="mission-action">
            ${m.claimed 
              ? '<span class="claimed-text">수령완료</span>' 
              : `<button class="claim-btn ${m.completed ? 'active' : 'disabled'}" data-mindex="${idx}">
                  +${m.rewardDust} Dust
                 </button>`
            }
          </div>
        </div>
      `;
    }).join('');

    listContainer.querySelectorAll('.claim-btn.active').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-mindex'), 10);
        const m = gameState.state.dailyMissions[idx];
        if (m && m.completed && !m.claimed) {
          m.claimed = true;
          gameState.addDust(m.rewardDust);
          gameState.addExp(m.rewardExp);
          soundEngine.playAchievement();
          this.showToast(`🎁 미션 보상 수령! (+${m.rewardDust} Dust, +${m.rewardExp} EXP)`, 'reward');
          this.renderMissions();
        }
      });
    });
  }

  // ================= 🛍️ 상점 탭 렌더링 =================
  renderShop() {
    const gridContainer = document.getElementById('shop-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = SHOP_ITEMS.map(item => {
      const isPurchased = (gameState.state.purchasedItems[item.id] || 0) > 0;
      const isEquipped = (
        (item.type === 'skin' && gameState.state.equippedSkin === item.id) ||
        (item.type === 'particle' && gameState.state.equippedParticle === item.id) ||
        (item.type === 'theme' && gameState.state.equippedTheme === item.id)
      );

      let actionBtn = '';
      if (item.type === 'stat') {
        const boughtCount = gameState.state.purchasedItems[item.id] || 0;
        const canBuy = boughtCount < (item.maxPurchase || 5);
        actionBtn = canBuy 
          ? `<button class="shop-buy-btn" data-shopid="${item.id}">구매 (${item.price} Dust)</button>`
          : `<span class="shop-max-badge">최대 구매 완료</span>`;
      } else if (isPurchased) {
        actionBtn = isEquipped 
          ? `<button class="shop-equip-btn equipped" disabled>장착 중</button>`
          : `<button class="shop-equip-btn" data-equipid="${item.id}">장착하기</button>`;
      } else {
        actionBtn = `<button class="shop-buy-btn" data-shopid="${item.id}">해금 (${item.price} Dust)</button>`;
      }

      return `
        <div class="shop-card">
          <div class="shop-item-icon">${item.icon}</div>
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.desc}</div>
          <div class="shop-item-action">${actionBtn}</div>
        </div>
      `;
    }).join('');

    // 구매 버튼 바인딩
    gridContainer.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-shopid');
        this.buyShopItem(id);
      });
    });

    // 장착 버튼 바인딩
    gridContainer.querySelectorAll('.shop-equip-btn:not(.equipped)').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-equipid');
        this.equipShopItem(id);
      });
    });
  }

  buyShopItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (gameState.state.dust < item.price) {
      this.showToast('⚠️ Cosmic Dust가 부족합니다!', 'warning');
      return;
    }

    gameState.state.dust -= item.price;
    gameState.state.purchasedItems[itemId] = (gameState.state.purchasedItems[itemId] || 0) + 1;

    if (item.type === 'stat' && item.luckBoost) {
      gameState.state.luck += item.luckBoost;
    }

    soundEngine.playAchievement();
    this.showToast(`✨ [${item.name}] 구매 완료!`, 'reward');
    gameState.save();
    this.renderShop();
    this.renderHUD();
  }

  equipShopItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (item.type === 'skin') gameState.state.equippedSkin = itemId;
    if (item.type === 'particle') gameState.state.equippedParticle = itemId;
    if (item.type === 'theme') gameState.state.equippedTheme = itemId;

    gameState.save();
    this.applyEquippedItems();
    this.showToast(`🎨 [${item.name}] 장착 완료!`, 'info');
    this.renderShop();
    this.renderHUD();
  }

  // ================= ⚙️ 설정 탭 렌더링 =================
  renderSettings() {
    const container = document.getElementById('settings-container');
    if (!container) return;

    const s = gameState.state.settings;
    container.innerHTML = `
      <div class="settings-group">
        <label class="setting-item">
          <span>🔊 효과음 (Sound SFX)</span>
          <input type="checkbox" id="set-sound" ${s.sound ? 'checked' : ''}>
        </label>
        <label class="setting-item">
          <span>✨ 우주 먼지 파티클 (Canvas Particles)</span>
          <input type="checkbox" id="set-particles" ${s.particles ? 'checked' : ''}>
        </label>
        <label class="setting-item">
          <span>📳 화면 흔들림 효과 (Screen Shake)</span>
          <input type="checkbox" id="set-shake" ${s.shake ? 'checked' : ''}>
        </label>
        <label class="setting-item">
          <span>⚡ 빠른 연출 모드 (Fast Animation)</span>
          <input type="checkbox" id="set-fastanim" ${s.fastAnim ? 'checked' : ''}>
        </label>
        <label class="setting-item">
          <span>📱 모바일 진동 (Haptic Vibration)</span>
          <input type="checkbox" id="set-vibration" ${s.vibration ? 'checked' : ''}>
        </label>
      </div>

      <div class="settings-danger-zone">
        <div class="danger-title">⚠️ 데이터 초기화</div>
        <p class="danger-desc">모든 레벨, 도감 수집 내역, Dust, 업적이 영구 삭제됩니다.</p>
        <button id="reset-data-btn" class="danger-btn">전체 데이터 초기화</button>
      </div>
    `;

    const bindCheck = (id, key) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          gameState.state.settings[key] = e.target.checked;
          if (key === 'sound') soundEngine.setEnabled(e.target.checked);
          if (key === 'particles' && this.particleEngine) this.particleEngine.setEnabled(e.target.checked);
          gameState.save();
        });
      }
    };

    bindCheck('set-sound', 'sound');
    bindCheck('set-particles', 'particles');
    bindCheck('set-shake', 'shake');
    bindCheck('set-fastanim', 'fastAnim');
    bindCheck('set-vibration', 'vibration');

    document.getElementById('reset-data-btn').addEventListener('click', () => {
      if (confirm('정말로 모든 진행 상황과 도감을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        gameState.reset();
        this.renderHUD();
        this.closeAllModals();
        this.showToast('🗑️ 모든 데이터가 성공적으로 초기화되었습니다.', 'info');
      }
    });
  }

  // ================= 🍞 범용 토스트 알림 =================
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = message;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }
}

// DOM 로드 완료 후 앱 기동 (readyState 대응)
function startApp() {
  if (!window.halfSnapApp) {
    window.halfSnapApp = new HalfSnapApp();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

