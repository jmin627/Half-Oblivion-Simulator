// 절반 소멸 시뮬레이터 - 업적, 건틀릿 진화 및 일일 미션 데이터

export const GAUNTLET_TIERS = [
  {
    tier: 1,
    minLevel: 1,
    name: '낡은 작업용 장갑',
    subtitle: '스냅이 가능한 평범한 가죽 장갑',
    icon: '🧤',
    color: '#a1a1aa',
    glowColor: 'rgba(161, 161, 170, 0.3)',
    desc: '손가락 마디마디가 닳아있지만 우주의 힘이 미세하게 깃들어 있습니다.',
    snapMultiplier: 1.0
  },
  {
    tier: 2,
    minLevel: 5,
    name: '수상한 기계 장갑',
    subtitle: '미세 전자기 펄스가 흐르는 개조 장갑',
    icon: '🦾',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    desc: '작은 진동과 함께 파란색 스파크가 튀며 물질 분해 효율이 증가합니다.',
    snapMultiplier: 1.15
  },
  {
    tier: 3,
    minLevel: 10,
    name: '우주 공명 장갑',
    subtitle: '성운의 에너지를 흡수하는 아스트랄 장갑',
    icon: '✨',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    desc: '보라색 성운 입자가 손끝을 감싸며 소멸의 파동이 강해집니다.',
    snapMultiplier: 1.3
  },
  {
    tier: 4,
    minLevel: 20,
    name: '차원 왜곡 건틀릿',
    subtitle: '시공간의 틈새를 여는 중력 건틀릿',
    icon: '🌌',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.7)',
    desc: '스냅 한 번에 주변 중력이 왜곡되어 황금빛 충격파가 터져 나옵니다.',
    snapMultiplier: 1.5
  },
  {
    tier: 5,
    minLevel: 35,
    name: '현실 조작 건틀릿',
    subtitle: '물리 법칙을 재정의하는 오리진 건틀릿',
    icon: '🔮',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.8)',
    desc: '절반 소멸을 넘어 인과율 자체를 흔드는 궁극의 차원 장치입니다.',
    snapMultiplier: 1.8
  },
  {
    tier: 6,
    minLevel: 50,
    name: '전지전능한 신의 손길',
    subtitle: '우주의 균형을 완전히 지배하는 초월체',
    icon: '👑',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.95)',
    desc: '존재하는 모든 것의 50%가 당신의 가벼운 손끝 하나에 달려 있습니다.',
    snapMultiplier: 2.2
  }
];

export const ACHIEVEMENTS_DATA = [
  {
    id: 'first_snap',
    title: '첫 번째 소멸',
    desc: '처음으로 손가락을 튕겼다.',
    icon: '💥',
    rewardDust: 50,
    rewardExp: 100,
    check: (state) => state.totalSnaps >= 1
  },
  {
    id: 'repeat_snap',
    title: '또 나왔어?',
    desc: '같은 결과를 5번 이상 발견했다.',
    icon: '🔁',
    rewardDust: 80,
    rewardExp: 150,
    check: (state) => Object.values(state.discoveredCounts || {}).some(c => c >= 5)
  },
  {
    id: 'lab_nightmare',
    title: '대학원생의 악몽',
    desc: '연구 관련(LAB) 결과를 10개 이상 발견했다.',
    icon: '🎓',
    rewardDust: 100,
    rewardExp: 200,
    check: (state, targets) => {
      const labDiscovered = Object.keys(state.discovered || {}).filter(id => {
        const t = targets.find(item => item.id === id);
        return t && t.category === 'LAB';
      });
      return labDiscovered.length >= 10;
    }
  },
  {
    id: 'reviewer_eraser',
    title: 'Reviewer #2를 없앨 순 없나요?',
    desc: '논문/연구 관련 결과를 20개 이상 발견했다.',
    icon: '📝',
    rewardDust: 250,
    rewardExp: 400,
    check: (state, targets) => {
      const labDiscovered = Object.keys(state.discovered || {}).filter(id => {
        const t = targets.find(item => item.id === id);
        return t && t.category === 'LAB';
      });
      return labDiscovered.length >= 20;
    }
  },
  {
    id: 'chicken_party',
    title: '오늘은 치킨이다',
    desc: '음식(FOOD) 관련 결과를 15개 이상 발견했다.',
    icon: '🍗',
    rewardDust: 120,
    rewardExp: 250,
    check: (state, targets) => {
      const foodDiscovered = Object.keys(state.discovered || {}).filter(id => {
        const t = targets.find(item => item.id === id);
        return t && t.category === 'FOOD';
      });
      return foodDiscovered.length >= 15;
    }
  },
  {
    id: 'digital_detox',
    title: '디지털 디톡스',
    desc: '디지털(DIGITAL) 관련 결과를 15개 이상 발견했다.',
    icon: '💻',
    rewardDust: 120,
    rewardExp: 250,
    check: (state, targets) => {
      const digitalDiscovered = Object.keys(state.discovered || {}).filter(id => {
        const t = targets.find(item => item.id === id);
        return t && t.category === 'DIGITAL';
      });
      return digitalDiscovered.length >= 15;
    }
  },
  {
    id: 'balanced_one',
    title: '균형을 사랑하는 자',
    desc: '누적 100번 스냅했다.',
    icon: '⚖️',
    rewardDust: 150,
    rewardExp: 300,
    check: (state) => state.totalSnaps >= 100
  },
  {
    id: 'cosmic_obsession',
    title: '우주적 집착',
    desc: '누적 500번 스냅했다.',
    icon: '🌌',
    rewardDust: 500,
    rewardExp: 1000,
    check: (state) => state.totalSnaps >= 500
  },
  {
    id: 'infinite_snap',
    title: '차원의 지배자',
    desc: '누적 1,000번 스냅했다.',
    icon: '👑',
    rewardDust: 1000,
    rewardExp: 2500,
    check: (state) => state.totalSnaps >= 1000
  },
  {
    id: 'rarity_doubter',
    title: '확률을 의심하기 시작함',
    desc: 'Common 등급이 4번 연속으로 등장했다.',
    icon: '🤨',
    rewardDust: 80,
    rewardExp: 150,
    check: (state) => state.consecutiveCommonCount >= 4
  },
  {
    id: 'cosmic_witness',
    title: '0.5%라고 했잖아?',
    desc: '극도로 희귀한 Cosmic 등급 결과를 발견했다.',
    icon: '🌠',
    rewardDust: 300,
    rewardExp: 600,
    check: (state) => state.hasCosmicDiscovered === true
  },
  {
    id: 'mosquito_halved',
    title: '모기가 절반!',
    desc: '모기 결과를 발견하여 전 세계 인류에게 감동을 주었다.',
    icon: '🦟',
    rewardDust: 100,
    rewardExp: 200,
    check: (state) => state.discovered && (state.discovered['mosquitoes-nature'] || state.discovered['mosquitoes'])
  },
  {
    id: 'credit_card_blessing',
    title: '카드값의 구원자',
    desc: '카드값 절반 결과를 발견하여 환호성을 질렀다.',
    icon: '💳',
    rewardDust: 100,
    rewardExp: 200,
    check: (state) => state.discovered && state.discovered['credit-card-bill']
  },
  {
    id: 'hero_or_villain',
    title: '영웅인가 악당인가',
    desc: '좋은 스냅과 나쁜 스냅을 각각 25개 이상 경험했다.',
    icon: '🎭',
    rewardDust: 200,
    rewardExp: 400,
    check: (state) => state.goodSnaps >= 25 && state.badSnaps >= 25
  },
  {
    id: 'combo_master',
    title: '콤보 폭주',
    desc: '스냅 콤보 20연속을 달성했다.',
    icon: '🔥',
    rewardDust: 150,
    rewardExp: 300,
    check: (state) => state.maxCombo >= 20
  },
  {
    id: 'combo_god',
    title: '빛의 속도로 튕기기',
    desc: '스냅 콤보 50연속을 달성했다.',
    icon: '⚡',
    rewardDust: 400,
    rewardExp: 800,
    check: (state) => state.maxCombo >= 50
  },
  {
    id: 'codex_half',
    title: '도감의 절반을 채운 자',
    desc: '소멸 도감 발견율 50% 이상 달성.',
    icon: '📖',
    rewardDust: 300,
    rewardExp: 600,
    check: (state, targets) => {
      const total = targets.length || 100;
      const found = Object.keys(state.discovered || {}).length;
      return (found / total) >= 0.5;
    }
  },
  {
    id: 'codex_master',
    title: '만물의 절반을 아는 자',
    desc: '소멸 도감 100개 이상 발견.',
    icon: '📚',
    rewardDust: 800,
    rewardExp: 1500,
    check: (state) => Object.keys(state.discovered || {}).length >= 100
  },
  {
    id: 'level_10',
    title: '우주 신입 탈출',
    desc: '플레이어 레벨 10 달성.',
    icon: '⭐',
    rewardDust: 150,
    rewardExp: 300,
    check: (state) => state.level >= 10
  },
  {
    id: 'level_30',
    title: '현실 조작자',
    desc: '플레이어 레벨 30 달성.',
    icon: '🌟',
    rewardDust: 500,
    rewardExp: 1000,
    check: (state) => state.level >= 30
  },
  {
    id: 'level_50',
    title: '초월적 존재',
    desc: '플레이어 레벨 50 달성.',
    icon: '👑',
    rewardDust: 1200,
    rewardExp: 3000,
    check: (state) => state.level >= 50
  },
  {
    id: 'dust_rich',
    title: '우주 먼지 부자',
    desc: 'Cosmic Dust 1,000개 이상 보유.',
    icon: '💎',
    rewardDust: 200,
    rewardExp: 400,
    check: (state) => state.dust >= 1000
  },
  {
    id: 'special_event_first',
    title: '우주적 돌발상황',
    desc: '랜덤 특수 이벤트(더블 스냅, 우노 리버스 등)를 1회 경험했다.',
    icon: '🎲',
    rewardDust: 100,
    rewardExp: 200,
    check: (state) => state.specialEventsExperienced >= 1
  },
  {
    id: 'meta_glitch_witness',
    title: '제4의 벽 붕괴',
    desc: '메타/개그(META) 결과를 발견하여 UI 연출을 목격했다.',
    icon: '👾',
    rewardDust: 120,
    rewardExp: 250,
    check: (state, targets) => {
      const metaDiscovered = Object.keys(state.discovered || {}).filter(id => {
        const t = targets.find(item => item.id === id);
        return t && t.category === 'META';
      });
      return metaDiscovered.length >= 1;
    }
  },
  {
    id: 'luck_master',
    title: '행운의 총아',
    desc: 'Cosmic Luck 스탯이 20을 돌파했다.',
    icon: '🍀',
    rewardDust: 150,
    rewardExp: 300,
    check: (state) => state.luck >= 20
  }
];

export const DAILY_MISSION_TEMPLATES = [
  { id: 'daily_snaps_10', title: '오늘 10번 스냅하기', target: 10, type: 'snaps', rewardDust: 50, rewardExp: 100, icon: '💥' },
  { id: 'daily_snaps_25', title: '오늘 25번 스냅하기', target: 25, type: 'snaps', rewardDust: 90, rewardExp: 200, icon: '🔥' },
  { id: 'daily_food_3', title: '음식 결과 3개 발견하기', target: 3, type: 'food', rewardDust: 60, rewardExp: 120, icon: '🍗' },
  { id: 'daily_lab_3', title: '연구/대학 결과 3개 발견하기', target: 3, type: 'lab', rewardDust: 60, rewardExp: 120, icon: '🎓' },
  { id: 'daily_rare_1', title: 'Rare 이상 결과 1개 발견하기', target: 1, type: 'rare_plus', rewardDust: 70, rewardExp: 150, icon: '✨' },
  { id: 'daily_good_5', title: 'GOOD SNAP 5회 기록하기', target: 5, type: 'good_snap', rewardDust: 60, rewardExp: 130, icon: '😇' },
  { id: 'daily_new_2', title: '새로운 도감 결과 2개 발견하기', target: 2, type: 'new_discovery', rewardDust: 80, rewardExp: 180, icon: '📖' },
  { id: 'daily_combo_10', title: '스냅 콤보 10연속 달성하기', target: 10, type: 'combo', rewardDust: 70, rewardExp: 140, icon: '⚡' }
];

export const SHOP_ITEMS = [
  // 건틀릿 스킨
  {
    id: 'skin_void_purple',
    type: 'skin',
    name: '공허의 보이드 스킨',
    desc: '신비로운 흑자색 공허의 안개가 손끝을 감쌉니다.',
    price: 300,
    icon: '🔮',
    color: '#9333ea',
    previewGlow: '0 0 20px #9333ea'
  },
  {
    id: 'skin_supernova_red',
    type: 'skin',
    name: '초신성 블레이즈 스킨',
    desc: '폭발하는 초신성의 붉은 열기가 분출됩니다.',
    price: 500,
    icon: '🔥',
    color: '#ef4444',
    previewGlow: '0 0 20px #ef4444'
  },
  {
    id: 'skin_cyber_glitch',
    type: 'skin',
    name: '사이버 네온 글리치',
    desc: '청록색과 마젠타의 홀로그램 글리치가 번쩍입니다.',
    price: 800,
    icon: '👾',
    color: '#06b6d4',
    previewGlow: '0 0 25px #06b6d4'
  },
  // 파티클 오라
  {
    id: 'particle_emerald',
    type: 'particle',
    name: '시간의 에메랄드 오라',
    desc: '먼지 파티클이 에메랄드 시간 입자로 빛납니다.',
    price: 250,
    icon: '❇️',
    particleColor: '#10b981'
  },
  {
    id: 'particle_cosmic_dust',
    type: 'particle',
    name: '황금빛 스타더스트 오라',
    desc: '순수한 황금빛 우주 먼지가 온 사방으로 흩날립니다.',
    price: 450,
    icon: '✨',
    particleColor: '#fbbf24'
  },
  // 배경 테마
  {
    id: 'theme_nebula',
    type: 'theme',
    name: '오리온 성운 테마',
    desc: '깊고 웅장한 자주빛과 푸른 성운 배경 테마입니다.',
    price: 400,
    icon: '🌌',
    themeClass: 'theme-nebula'
  },
  {
    id: 'theme_matrix',
    type: 'theme',
    name: '양자 매트릭스 테마',
    desc: '신비로운 사이버네틱 그린 그리드 배경 테마입니다.',
    price: 600,
    icon: '🟩',
    themeClass: 'theme-matrix'
  },
  // 행운 부적
  {
    id: 'luck_charm',
    type: 'stat',
    name: '우주 행운의 부적 (+3 Luck)',
    desc: '희귀 등급(Rare/Epic/Legendary) 출현 확률이 영구적으로 증가합니다.',
    price: 350,
    icon: '🍀',
    luckBoost: 3,
    maxPurchase: 5
  }
];
