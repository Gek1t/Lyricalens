/**
 * IELTS Topic Bilingual Synonyms and Academic Keyword Mapping
 * Enables seamless Chinese and English cross-lingual searching across Cambridge IELTS Official Volumes,
 * Exam Recalls, Academic Reading Passages, and Listening Sections.
 */

export interface TopicMapping {
  chineseTerms: string[];
  englishTerms: string[];
  category: string;
}

export const IELTS_TOPIC_DICTIONARY: TopicMapping[] = [
  {
    chineseTerms: ['网球', '网球拍', '球拍', '网球运动', '网球史', '草地网球', '温布尔登', '网球俱乐部', '网球场地', '网球肘'],
    englishTerms: ['tennis', 'tennis racket', 'racket', 'racquet', 'lawn tennis', 'wimbledon', 'sphairistike', 'jeu de paume', 'topspin', 'magnus effect', 'tennis elbow'],
    category: 'Sports Science & History'
  },
  {
    chineseTerms: ['羽毛球', '壁球', '板球'],
    englishTerms: ['badminton', 'squash', 'cricket', 'racket sports'],
    category: 'Sports'
  },
  {
    chineseTerms: ['混凝土', '水泥', '古罗马混凝土', '火山灰水泥', '罗马工程', '建筑材料'],
    englishTerms: ['concrete', 'cement', 'roman concrete', 'pozzolana', 'volcanic ash', 'building materials'],
    category: 'Materials Science & Architecture'
  },
  {
    chineseTerms: ['磁感应', '地磁', '动物导航', '地磁导航', '鸽子导航', '候鸟迁徙', '隐花色素'],
    englishTerms: ['magnetoreception', 'animal magnetoreception', 'magnetic field', 'geomagnetic', 'cryptochrome', 'avian navigation'],
    category: 'Biology & Animal Behavior'
  },
  {
    chineseTerms: ['微森林', '垂直绿化', '城市再野化', '垂直森林', '城市森林', '宫胁造林法', '生物多样性走廊'],
    englishTerms: ['micro-forest', 'vertical forest', 'vertical micro-forests', 'urban rewilding', 'rewilding', 'miyawaki', 'biodiversity'],
    category: 'Urban Ecology & Forestry'
  },
  {
    chineseTerms: ['深海', '深海热泉', '热泉', '化能合成', '深海生物', '黑烟囱', '极端微生物', '深海滑翔机'],
    englishTerms: ['deep-sea', 'hydrothermal', 'chemosynthetic', 'black smoker', 'extremophile', 'ocean glider', 'abyssal zone'],
    category: 'Marine Biology & Oceanography'
  },
  {
    chineseTerms: ['海草', '海草床', '蓝碳', '碳汇', '海洋碳捕集', '海岸带生态'],
    englishTerms: ['seagrass', 'seagrass meadows', 'blue carbon', 'carbon sequestration', 'marine carbon sink'],
    category: 'Marine Ecology & Climate'
  },
  {
    chineseTerms: ['出租车', '伦敦出租车', '大脑神经', '海马体', '神经可塑性', '空间记忆', '出租车司机'],
    englishTerms: ['london taxi', 'taxi driver', 'hippocampus', 'neuroplasticity', 'spatial memory', 'the knowledge', 'brain mapping'],
    category: 'Neuroscience & Psychology'
  },
  {
    chineseTerms: ['内心独白', '内心语言', '脑内语音', '神经语言学', '自我对话'],
    englishTerms: ['inner speech', 'neurolinguistics', 'internal monologue', 'phonetic processing', 'cognitive architecture'],
    category: 'Cognitive Linguistics'
  },
  {
    chineseTerms: ['地热', '地下热能', '城市热岛', '地热能源', '地热管网'],
    englishTerms: ['geothermal', 'heat sink', 'subterranean', 'urban heat island', 'geothermal infrastructure'],
    category: 'Renewable Energy & Civil Engineering'
  },
  {
    chineseTerms: ['座头鲸', '仿生学', '风力发电机', '风力涡轮', '鲸鱼鳍结节', '减阻'],
    englishTerms: ['humpback whale', 'biomimetic', 'wind turbine', 'tubercle', 'aerodynamic drag', 'fluid dynamics'],
    category: 'Biomimetics & Fluid Mechanics'
  },
  {
    chineseTerms: ['算法偏见', '人工智能公平', '自动化偏见', '医疗诊断算法', '机器偏见'],
    englishTerms: ['algorithmic fairness', 'automation bias', 'healthcare diagnostics', 'ai ethics', 'machine learning bias'],
    category: 'AI & Healthcare'
  },
  {
    chineseTerms: ['冰川', '冰川学', '南极冰下湖', '南极水系', '沃斯托克湖'],
    englishTerms: ['glaciology', 'subglacial', 'east antarctica', 'lake vostok', 'ice sheet'],
    category: 'Glaciology & Earth Science'
  },
  {
    chineseTerms: ['大马士革钢', '碳纳米管', '古代冶金', '乌兹钢', '纳米晶体'],
    englishTerms: ['damascus steel', 'carbon nanotube', 'ancient metallurgy', 'wootz steel', 'nanowires'],
    category: 'Materials Science & Archaeology'
  },
  {
    chineseTerms: ['狐獴', '猫鼬', '哨兵系统', '喀拉哈里狐獴', '警报呼叫', '利他行为'],
    englishTerms: ['meerkat', 'kalahari meerkats', 'sentinel system', 'alarm calls', 'cooperative vigilance'],
    category: 'Zoology & Animal Social Behavior'
  },
  {
    chineseTerms: ['量子传感', '量子磁力计', '地球物理勘探', '矿产勘探', '地磁异常'],
    englishTerms: ['quantum sensor', 'magnetometry', 'geophysical exploration', 'magnetic anomalies', 'mineral survey'],
    category: 'Geophysics & Quantum Tech'
  },
  {
    chineseTerms: ['印度河流域文字', '古文字破译', '哈拉帕文明', '印章符号'],
    englishTerms: ['indus valley script', 'lost epics', 'deciphering', 'harappan civilization', 'undeciphered script'],
    category: 'Archaeology & Ancient Linguistics'
  },
  {
    chineseTerms: ['自行车', '骑行俱乐部', '山地车', '装备租赁'],
    englishTerms: ['cycling club', 'bicycle rental', 'trail equipment', 'bike maintenance'],
    category: 'Recreation & Student Life'
  },
  {
    chineseTerms: ['屋顶农场', '水培农业', '粮食主权', '无土栽培', '垂直农场'],
    englishTerms: ['rooftop hydroponic', 'hydroponic farming', 'food sovereignty', 'vertical agriculture', 'soilless cultivation'],
    category: 'Sustainable Agriculture'
  },
  {
    chineseTerms: ['凯尔特语', '海岛凯尔特语', '音系学', '语言变迁', '盖尔语'],
    englishTerms: ['celtic insular', 'comparative phonology', 'goidelic', 'brythonic', 'language shift'],
    category: 'Comparative Linguistics'
  },
  {
    chineseTerms: ['铁器时代', '山丘堡垒', '古城堡', '粮仓', '不列颠铁器时代'],
    englishTerms: ['iron age hillfort', 'grain silos', 'celtic fortification', 'prehistoric settlement', 'archaeological excavation'],
    category: 'British Prehistory & Archaeology'
  },
  {
    chineseTerms: ['波利尼西亚', '独木舟', '史前航海', '双体船', '寻路星象'],
    englishTerms: ['polynesian triangle', 'oceanic navigation', 'double-hulled canoe', 'wayfinding', 'star compass'],
    category: 'Anthropology & Maritime History'
  },
  {
    chineseTerms: ['生物荧光', '荧光素', '深海发光', '光遗传学', '荧光蛋白'],
    englishTerms: ['bioluminescence', 'luciferin', 'luciferase', 'green fluorescent protein', 'optogenetics'],
    category: 'Biochemistry & Deep Sea'
  },
  {
    chineseTerms: ['波斯风塔', '风捕', '被动冷却', '传统建筑', '坎儿井'],
    englishTerms: ['windcatcher', 'badgir', 'passive cooling', 'qanat', 'evaporative cooling', 'iranian architecture'],
    category: 'Sustainable Architecture'
  },
  {
    chineseTerms: ['语言习得', '脑波同步', '语音感知', '第二语言', '神经振荡'],
    englishTerms: ['neural oscillations', 'phonetic acquisition', 'theta-band', 'neuroplasticity', 'speech perception'],
    category: 'Cognitive Neuroscience'
  },
  {
    chineseTerms: ['听力', '听力测试', '雅思听力', '听力真题', '对话', '独白', '学术讲座'],
    englishTerms: ['listening', 'listening test', 'ielts listening', 'social conversation', 'academic monologue', 'lecture'],
    category: 'IELTS Listening'
  },
  {
    chineseTerms: ['阅读', '阅读理解', '学术类阅读', '长难句', '判断题', '小标题'],
    englishTerms: ['reading', 'academic reading', 'passage', 'heading matching', 'tfng', 'summary completion'],
    category: 'IELTS Reading'
  },
  {
    chineseTerms: ['体育馆', '运动中心', '健身房', '会员申请', '场地预约'],
    englishTerms: ['sports complex', 'sports center', 'fitness club', 'membership', 'facility booking'],
    category: 'Campus & Community Facilities'
  }
];

/**
 * Expand a user search query into a comprehensive set of search tokens
 * encompassing both Chinese and English synonyms.
 */
export function expandSearchTokens(query: string): string[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const tokens = new Set<string>();
  tokens.add(clean);

  // Split multi-word or spaced queries
  const subWords = clean.split(/[\s,，、+]+/).filter(Boolean);
  subWords.forEach(w => tokens.add(w));

  // Search in topic dictionary
  for (const item of IELTS_TOPIC_DICTIONARY) {
    const matchesChinese = item.chineseTerms.some(ct => 
      clean.includes(ct.toLowerCase()) || ct.toLowerCase().includes(clean) ||
      subWords.some(w => ct.toLowerCase().includes(w) || w.includes(ct.toLowerCase()))
    );

    const matchesEnglish = item.englishTerms.some(et => 
      clean.includes(et.toLowerCase()) || et.toLowerCase().includes(clean) ||
      subWords.some(w => et.toLowerCase().includes(w) || w.includes(et.toLowerCase()))
    );

    if (matchesChinese || matchesEnglish) {
      item.chineseTerms.forEach(ct => tokens.add(ct.toLowerCase()));
      item.englishTerms.forEach(et => tokens.add(et.toLowerCase()));
    }
  }

  return Array.from(tokens);
}

/**
 * Check if target text matches any of the expanded search tokens
 */
export function matchesSearchTokens(targetText: string, tokens: string[]): boolean {
  if (!targetText || !tokens || tokens.length === 0) return false;
  const lower = targetText.toLowerCase();
  return tokens.some(tok => lower.includes(tok));
}

/**
 * Calculate relevance score for ranking articles against search tokens
 */
export function calculateRelevanceScore(
  item: { title?: string; category?: string; keyVocab?: string[]; text?: string; snippet?: string },
  tokens: string[]
): number {
  if (!item || !tokens || tokens.length === 0) return 0;

  let score = 0;
  const title = (item.title || '').toLowerCase();
  const category = (item.category || '').toLowerCase();
  const keyVocab = (item.keyVocab || []).map(v => v.toLowerCase());
  const text = (item.text || item.snippet || '').toLowerCase();

  for (const tok of tokens) {
    if (!tok || tok.length < 2) continue;

    if (title.includes(tok)) {
      score += 50; // Strong match on title
    }
    if (category.includes(tok)) {
      score += 20; // Match on category
    }
    if (keyVocab.some(kv => kv.includes(tok))) {
      score += 15; // Match on key vocabulary
    }
    if (text.includes(tok)) {
      score += 5;  // Match in body text
    }
  }

  return score;
}

export interface BilingualTopicMeta {
  titleZh: string;
  titleEn: string;
  categoryZh: string;
  gistZh: string;
}

const PASSAGE_BILINGUAL_MAP: Record<string, { titleZh: string; categoryZh: string; gistZh: string }> = {
  // Cambridge 19
  'the evolution of modern tennis rackets': {
    titleZh: '现代网球拍的材料科技演进',
    categoryZh: '材料科学与运动工程',
    gistZh: '从早期实木球拍、铝合金大拍面到碳纤维复合材料与压电陶瓷减震技术的革新历程。'
  },
  'the environmental impact of concrete': {
    titleZh: '混凝土生产对全球气候的影响与低碳革新',
    categoryZh: '土木工程与环境科学',
    gistZh: '剖析波特兰水泥煅烧的高碳排困境，以及矿渣替代、地聚物水泥与细菌自修复混凝土技术。'
  },
  'the mysteries of animal magnetoreception': {
    titleZh: '动物地磁导航与候鸟视网膜量子罗盘',
    categoryZh: '神经生物学与量子生物',
    gistZh: '揭秘候鸟如何利用视网膜隐花色素蛋白（Cry4）中的自由基对量子纠缠效应“看见”地球磁场。'
  },
  'the secret architecture of coral reefs': {
    titleZh: '珊瑚礁的隐秘共生结构与白化危机',
    categoryZh: '海洋生态学',
    gistZh: '探讨珊瑚虫与虫黄藻的光合作用营养互惠机制，以及海水升温引发珊瑚白化的细胞应激过程。'
  },
  'deciphering the cognitive realm of octopuses': {
    titleZh: '章鱼的分布式神经系统与异类高阶智能',
    categoryZh: '认知科学与动物行为',
    gistZh: '三分之二神经元分布在八条腕足中的章鱼，如何通过去中心化神经架构实现迷宫导航与瞬间拟态。'
  },
  'the history and chemistry of silk production': {
    titleZh: '丝绸生产的千年历史与丝素蛋白化学',
    categoryZh: '纺织史与生物化学',
    gistZh: '解析家蚕吐丝结茧的丝素蛋白与丝胶蛋白分子结构，以及沸水缫丝工艺的演进。'
  },
  'deep-ocean geothermal energy and hydrothermal mineralization': {
    titleZh: '深海地热能与海底热液黑烟囱成矿机制',
    categoryZh: '海洋地质与地球物理',
    gistZh: '大洋中脊超高温海水在高压下溶解玄武岩重金属，喷出遇冷沉淀形成多金属硫化物烟囱。'
  },
  'algorithmic decision making and human cognitive biases': {
    titleZh: '算法决策偏见与人类“自动化盲从”心理',
    categoryZh: '人工智能伦理与心理学',
    gistZh: '剖析机器学习如何放大历史偏见，以及人类操作员盲目信任计算机建议的“自动化偏见”现象。'
  },
  'self-healing durability of ancient roman marine concrete': {
    titleZh: '古罗马海工混凝土千年不倒的自修复之谜',
    categoryZh: '考古材料科学',
    gistZh: '火山灰、生石灰与海水反应生成的托贝莫来石晶体，如何在裂缝中持续生长实现结构自愈。'
  },
  'neuroplasticity and late-stage second language acquisition': {
    titleZh: '成年二语习得的大脑神经可塑性重塑',
    categoryZh: '认知神经科学与语言学',
    gistZh: '打破“语言关键期”绝对限制，fMRI证实成年人沉浸式学外语仍能促进脑白质重塑与突触新生。'
  },
  'quantum sensor magnetometry and mineral exploration': {
    titleZh: '金刚石量子磁力仪与深地矿产无损勘探',
    categoryZh: '量子物理与地球物理',
    gistZh: '利用金刚石氮-空位（NV）色心在室温下探测极其微弱的地下磁场异常，精准定位深层矿脉。'
  },
  'traditional polynesian celestial navigation & long-distance voyaging': {
    titleZh: '波利尼西亚传统星象导航与远洋双体独木舟',
    categoryZh: '海洋人类学与航海史',
    gistZh: '在没有指南针的时代，古代领航员如何凭借星盘方位、大洋涌浪折射与海鸟归巢规律横跨太平洋。'
  },
  'mycorrhizal fungal networks and plant interspecies communication': {
    titleZh: '森林地下“木联网”：菌根真菌与植物跨物种通讯',
    categoryZh: '植物生理与森林生态',
    gistZh: '树木如何通过地下菌丝网络向幼苗输送碳水养分，并在遭遇害虫啃食时传递化学防御警报。'
  },
  'microplastic bioaccumulation in marine trophic cascades': {
    titleZh: '海洋微塑料在食物链中的生物富集与毒性放大',
    categoryZh: '生态毒理学与环境化学',
    gistZh: '微塑料吸附持久性有机污染物后被浮游生物摄食，并沿海洋食物链逐级呈指数级生物放大。'
  },

  // Cambridge 18 & Classic Passages
  'urban transport and micro-mobility systems': {
    titleZh: '城市微出行网络与绿色慢行交通系统',
    categoryZh: '城市规划与交通工程',
    gistZh: '探讨电动滑板车、共享单车与专用自行车高速道如何解决大都市“最后一公里”通勤与减排难题。'
  },
  'urban transport & electric scooter infrastructure in european metropolises': {
    titleZh: '欧洲都市电动滑板车基础设施与慢行交通',
    categoryZh: '城市规划与交通工程',
    gistZh: '探讨零排放微出行工具在解决“最后一公里”接驳的同时，如何平衡人行道管理与行人安全。'
  },
  'the secret life of urban flora': {
    titleZh: '城市夹缝植物的顽强生命与快速演化',
    categoryZh: '城市生态与植物学',
    gistZh: '水泥裂缝中的蒲公英与野生植物如何演化出重型种子策略，抵抗城市热岛效应并记录人类贸易轨迹。'
  },
  'forest canopy ecology and epiphytic plant stratification': {
    titleZh: '热带雨林冠层生态与附生植物垂直分层',
    categoryZh: '植物学与森林生态',
    gistZh: '兰花、蕨类与凤梨等附生植物如何不依赖寄生，直接从潮湿空气与落叶碎屑中汲取养分。'
  },
  'conquering the hadal zone: deep ocean exploration': {
    titleZh: '征服超深渊带：万米海沟生命与深海探测',
    categoryZh: '深海海洋学与极端生物',
    gistZh: '全海深载人潜水器揭开6000米以下超深渊海沟的化能合成食物网与嗜压微生物抗压机制。'
  },
  'the psychology of time perception and temporal distortions': {
    titleZh: '时间知觉心理学：为什么危急时刻时间会变慢',
    categoryZh: '认知心理学',
    gistZh: '解析肾上腺素飙升与高密度记忆编码如何导致主观时间膨胀感，让几秒钟仿佛漫长如数分钟。'
  },
  'urban farming in paris': {
    titleZh: '巴黎屋顶的城市农业与垂直农场探索',
    categoryZh: '城市农业与可持续发展',
    gistZh: '探访世界最大屋顶城市农场：采用无土气培技术在巴黎建筑顶层种植蔬果，重塑都市食物供应链。'
  },
  'the step pyramid of djoser': {
    titleZh: '古埃及左塞尔阶梯金字塔的建筑革命',
    categoryZh: '考古学与古代建筑史',
    gistZh: '追踪古埃及祭司伊姆霍特普如何用石材堆叠取代传统泥砖马斯塔巴，建造人类史上首座巨石金字塔。'
  },
  'bats to the rescue': {
    titleZh: '马达加斯加农业救星：食虫蝙蝠防治害虫',
    categoryZh: '生态保护与农林科学',
    gistZh: '研究发现本土食虫蝙蝠大量捕食稻田害虫与疟蚊，成为兼顾生态保护与农民增收的天然卫士。'
  },
  'stadiums: past, present and future': {
    titleZh: '体育场建筑的过去、现在与未来多功能演进',
    categoryZh: '建筑史与城市空间更新',
    gistZh: '从古罗马圆形竞技场改建集市，到当代大型体育场结合光伏发电与社区混合业态的可持续转型。'
  },
  'stonehenge': {
    titleZh: '巨石阵建造之谜：史前巨石运输与天文用途',
    categoryZh: '史前考古与英国历史',
    gistZh: '还原新石器时代先民如何跨越数百英里运送威尔士蓝砂岩与萨森巨石，分三阶段筑起史前天文圣地。'
  },
  'living with artificial intelligence': {
    titleZh: '人类如何与人工智能协同共存及伦理对齐',
    categoryZh: '科技哲学与人工智能',
    gistZh: '探讨AI在完成复杂认知任务的同时，人类如何确保超级智能的目标始终与人类道德价值观保持一致。'
  },
  'an ideal city': {
    titleZh: '达·芬奇笔下的文艺复兴“理想城市”规划',
    categoryZh: '城市规划史与建筑美学',
    gistZh: '瘟疫肆虐米兰之后，达·芬奇超前构想出拥有多层立体交通、地下水利排污与通风廊道的现代都市蓝图。'
  },

  // Cambridge 17 / 16 / 15 / 14 & Special
  'the development of the london underground': {
    titleZh: '伦敦地下铁道系统的诞生与明挖回填工程',
    categoryZh: '交通基础设施与历史',
    gistZh: '19世纪伦敦为缓解马车拥堵，采用“明挖回填法”建成全球首条地下蒸汽铁路——大都会铁路。'
  },
  'the development of the london underground railway': {
    titleZh: '伦敦地下铁道系统的诞生与早期隧道工程',
    categoryZh: '交通基础设施与历史',
    gistZh: '19世纪中叶伦敦为化解街头马车瘫痪，采用明挖回填法修建全球第一条现代地下快速交通线。'
  },
  'the maya and hydraulic engineering': {
    titleZh: '玛雅文明的地下水库与沸石净水水利工程',
    categoryZh: '考古学与古代水利工程',
    gistZh: '激光雷达揭秘玛雅低地城市如何利用灰泥广场集水，并通过火山沸石砂滤系统抵御长达数月的旱季。'
  },
  'roman deep-sea shipwrecks and maritime trade': {
    titleZh: '古罗马深海沉船考古与双耳陶罐海上贸易',
    categoryZh: '航海史与水下考古',
    gistZh: '深海声呐与水下机器人探明地中海古罗马商船残骸，通过双耳陶罐残留物与压舱石还原远洋航线。'
  },
  'the enigma of the white horse of uffington': {
    titleZh: '阿芬顿白马巨型地画的年代测定与守护仪式',
    categoryZh: '考古学与遗产保护',
    gistZh: '牛津郡白垩山坡上的史前奔马图腾，经光释光测年证实始建于三千年前的青铜时代晚期。'
  },
  'climate shifts and the norse settlement of greenland': {
    titleZh: '小冰期气候剧变与格陵兰岛维京定居点的消亡',
    categoryZh: '气候人类学与北欧史',
    gistZh: '冰芯同位素揭示14世纪小冰期如何冻结航道、摧毁牧场，导致固守传统的维京殖民地最终废弃。'
  },
  'the desolenator: solar water innovation': {
    titleZh: '太阳能热电联产海水淡化创新：Desolenator',
    categoryZh: '可再生能源与水文工程',
    gistZh: '无需易损化学滤膜、完全脱离电网运行的光伏加热蒸馏净水器，为干旱地区提供饮水新方案。'
  },
  'nutmeg: the fragrant commodity that shaped colonial empires': {
    titleZh: '肉豆蔻传奇：重塑殖民帝国版图的珍稀香料',
    categoryZh: '经济贸易史与植物学',
    gistZh: '原产印尼班达群岛的肉豆蔻曾因被视为黑死病解药而身价倍增，引发17世纪欧洲列强的贸易垄断争夺。'
  },
  'the secret chemistry of spices and culinary preservation': {
    titleZh: '香料的秘密化学：人类嗜辣背后的抗菌进化策略',
    categoryZh: '进化生物学与饮食文化',
    gistZh: '为什么热带地区饮食偏爱辛辣？植物次生代谢物具有强效抗菌活性，被人类巧妙用于冷藏时代前的食物防腐。'
  },
  'the origins of tennis': {
    titleZh: '网球运动起源：从法国修道院掌球到温布尔登',
    categoryZh: '体育史与文化人类学',
    gistZh: '追溯12世纪修道院徒手击球、王室室内宫廷网球，到橡胶硫化技术催生现代温网草地网球的演进史。'
  },
  'aerodynamics and physics of the tennis ball': {
    titleZh: '网球飞行空气动力学：马格努斯效应与毛毡减阻',
    categoryZh: '应用物理与流体力学',
    gistZh: '解析网球上旋急坠与下旋漂浮的马格努斯压强差原理，以及球面毛毡如何激发湍流边界层以减小尾流阻力。'
  },

  // Cambridge 20 / 21 & 2025-2026 Exam Recalls
  'atmospheric moisture harvesting in hyper-arid ecosystems': {
    titleZh: '极干旱沙漠中的金属有机框架（MOF）空气取水技术',
    categoryZh: '材料科学与气候工程',
    gistZh: '多孔晶体材料在夜间低湿度下自动吸附大气水分子，白天仅靠阳光升温即可冷凝出纯净饮用水。'
  },
  'automated bio-acoustic monitoring in tropical rainforests': {
    titleZh: '热带雨林生物声学监测与AI声谱物种识别',
    categoryZh: '生态保护与深度神经网络',
    gistZh: '全天候录音设备结合卷积神经网络分析森林声谱图，自动识别隐秘濒危蛙类与鸟类并预警非法盗伐。'
  },
  'post-quantum cryptography and the architecture of secure networks': {
    titleZh: '后量子密码学：抵御量子计算机算力的格密码架构',
    categoryZh: '计算机安全与密码学',
    gistZh: '面对量子计算对传统RSA加密的威胁，基于数学“格问题”的后量子加密标准为全球金融通信筑起新防线。'
  },
  'neuroplasticity and cognitive reserve in lifelong bilingualism': {
    titleZh: '终身双语能力如何锻造大脑认知储备与延缓衰老',
    categoryZh: '认知神经科学',
    gistZh: '双语者日常抑制非目标语言的思维训练能够强化前额叶白质髓鞘，使阿尔茨海默症临床发病推迟4至5年。'
  },
  'deep-sea polymetallic nodules and the clarion-clipperton zone': {
    titleZh: '太平洋深海多金属结核开采与深渊生态保护争议',
    categoryZh: '海洋地球物理与环境法',
    gistZh: '富含镍钴铜的深海矿石虽能助力电动车电池转型，但海底采矿车掀起的沉积物羽流将威胁脆弱的底栖生物。'
  },
  'generative ai and structural topology optimization in architecture': {
    titleZh: '生成式AI与建筑结构拓扑优化：向骨骼学习仿生减重',
    categoryZh: '计算建筑学与结构工程',
    gistZh: '算法根据风荷载与应力约束自动剔除冗余材料，生成树枝与骨骼般的有机悬挑结构，节省40%钢材与混凝土。'
  },
  'generative ai and academic integrity in higher education': {
    titleZh: '生成式人工智能浪潮下的高等教育学术诚信改革',
    categoryZh: '教育科技与人工智能伦理',
    gistZh: '各大高校放弃难以执行的全面禁令，转向口头答辩、现场思辨与人机协作评估的新型教学范式。'
  },
  'the rise of urban rewilding and vertical micro-forests': {
    titleZh: '城市再野化浪潮与摩天大楼“垂直微森林”',
    categoryZh: '城市生态与气候适应',
    gistZh: '以米兰垂直森林为例，探讨本土植被回归高层建筑如何吸收PM2.5、降低30%空调能耗并构建野生动物迁徙走廊。'
  },
  'deep-sea hydrothermal chemosynthetic ecosystems': {
    titleZh: '深海热泉化能合成生物圈与外星海洋生命探索',
    categoryZh: '海洋生物学与天体生物学',
    gistZh: '在完全黑暗的2500米海底，巨型管虫与嗜极细菌如何依靠氧化硫化氢而非阳光繁衍生息，启发木卫二生命探寻。'
  },
  'neurocomputational models of human language processing': {
    titleZh: '人类语言处理的神经计算模型：大脑预测编码与AI对比',
    categoryZh: '认知神经科学与计算语言学',
    gistZh: '探讨大脑实时预测语音的N400电生理机制，以及人类幼童相比大语言模型具备超高语言学习效率的具身认知奥秘。'
  },
  'the resurgence of seagrass meadows in blue carbon sequestration': {
    titleZh: '海草床生态复兴与高效海洋“蓝碳”封存',
    categoryZh: '海洋生态与气候方案',
    gistZh: '仅占海床0.2%的海草床却贡献了超10%的海洋碳封存；生态学家正利用可降解黄麻种子矩阵加速海草修复。'
  },
  'neurolinguistics and the cognitive architecture of inner speech': {
    titleZh: '脑内“内心独白”的认知神经架构与运动抑制机制',
    categoryZh: '神经语言学与心理学',
    gistZh: '人在默念思考时同样激活布罗卡与韦尼克语言区，并由辅助运动皮层精准抑制发声肌肉，支撑工作记忆与情绪调节。'
  },
  'subterranean geothermal infrastructure and urban heat sinks': {
    titleZh: '城市地下热岛效应与摩天大楼“地热基础桩”储能',
    categoryZh: '城市岩土工程与清洁能源',
    gistZh: '将地下交通与管网聚集的地下废热转化为能源资产：在建筑承重桩内嵌入换热管，实现冬暖夏凉并削减45%电网能耗。'
  },
  'biomimetic wind turbines and humpback whale flipper tubercles': {
    titleZh: '座头鲸胸鳍结节仿生学与高效率风力发电机叶片',
    categoryZh: '仿生工程与流体力学',
    gistZh: '模仿座头鲸胸鳍前缘凸起结节设计的锯齿状风机叶片，能产生微涡流推迟失速，在微风下提升32%升阻比。'
  },
  'algorithmic fairness and automation bias in healthcare diagnostics': {
    titleZh: '医疗影像AI诊断中的算法公平性与医生“自动化盲从”',
    categoryZh: '医疗科技与生物伦理学',
    gistZh: '警惕放射科医生过度轻信AI诊断以及城市医院训练模型在偏远地区水土不服的问题，呼吁建立人机协同审核机制。'
  },
  'glaciology and subglacial aquatic environments in east antarctica': {
    titleZh: '东南极4000米冰层下的沃斯托克湖与极端微生物',
    categoryZh: '极地冰川学与行星科学',
    gistZh: '与世隔绝1500万年的南极冰下液态淡水湖中依然存在化能合成细菌，成为研究冰封星球地下海洋的最佳地球样本。'
  },
  'the cooperative social sentinel system of wild kalahari meerkats': {
    titleZh: '野生喀拉哈里狐獴家族的合作放哨与警报声学系统',
    categoryZh: '动物行为学与社会生物学',
    gistZh: '狐獴哨兵能根据地面胡狼或空中猛禽发出不同频率的警报叫声；实证表明放哨源于吃饱后的互利警戒而非纯粹牺牲。'
  },
  'quantum sensor magnetometry in geophysical exploration': {
    titleZh: '无人机搭载金刚石量子磁力仪：深层矿脉原子级勘探',
    categoryZh: '量子传感与矿产地球物理',
    gistZh: '突破导电覆盖层干扰，利用室温量子NV磁力仪在空中精准测绘地下500米深处的断层与稀土矿脉，省去盲目钻探。'
  },
  'the linguistics of lost epics: deciphering the indus valley script': {
    titleZh: '破译古印度河流域（哈拉帕）印章文字的百年谜题',
    categoryZh: '考古铭文学与计算语言学',
    gistZh: '在缺乏双语对照石碑的情况下，计算语言学家通过条件熵算法证实四千枚滑石印章上的符号序列符合真实语言语法。'
  }
};

const LISTENING_BILINGUAL_MAP: Record<string, { titleZh: string; categoryZh: string; gistZh: string }> = {
  'harbor eco-tours & kayak hire booking': {
    titleZh: '海港生态游与皮划艇装备预订咨询',
    categoryZh: '日常对话 · 旅游与装备租赁',
    gistZh: '游客致电咨询周末海岸皮划艇导览出发时间、团购折扣、防水装备及免费停车核销。'
  },
  'riverfront botanical park redevelopment': {
    titleZh: '滨河植物园改造工程与游览设施导览',
    categoryZh: '公共独白 · 市政园林导览',
    gistZh: '园区总监介绍新建树冠步道、恢复湿地、地热温室兰花展及周末观鸟志愿者招募安排。'
  },
  'marine microplastic fieldwork presentation': {
    titleZh: '河口海洋微塑料采样与红外光谱分析研讨',
    categoryZh: '学术研讨 · 海洋环境科学',
    gistZh: '两名研究生与教授复盘底栖泥沙微塑料分离方法、实验室全棉防污染控制及季风暴雨后的浓度峰值。'
  },
  'archaeology of pre-columbian irrigation in the andes': {
    titleZh: '安第斯山脉前哥伦布时期高海拔台田水利考古',
    categoryZh: '学术讲座 · 农业工程考古',
    gistZh: '剖析蒂瓦纳库文明如何利用环水高架台田（Suka Kollus）蓄热防霜冻，实现每公顷16吨的马铃薯高产。'
  },
  'community library volunteer registration': {
    titleZh: '社区图书馆周末少儿阅读志愿者报名',
    categoryZh: '日常对话 · 社区志愿服务',
    gistZh: '馆长与申请者沟通周六上午橡木厅儿童绘本故事会职责、每周最低服务时长及迎新会证件要求。'
  },
  'exhibition guide: ancient glassmaking heritage': {
    titleZh: '博物馆导览：美索不达米亚古代玻璃制作工艺',
    categoryZh: '公共独白 · 博物馆语音导览',
    gistZh: '策展人讲解古代工匠如何在1100℃粘土熔炉中熔炼石英砂与植物碱灰，并展出公元前1400年钴蓝香水瓶。'
  },
  'the impact of urban acoustic noise on songbirds': {
    titleZh: '城市低频交通噪音对鸣禽歌唱频率的影响',
    categoryZh: '学术讲座 · 生物声学与鸟类学',
    gistZh: '鸟类学家解析城市大山雀如何通过提高鸣叫频率避开交通噪音掩蔽，以及高音调导致求偶传声距离缩短的代价。'
  },
  'buckworth conservation society registration': {
    titleZh: '巴克沃思自然保护协会周末河岸植树报名',
    categoryZh: '日常对话 · 环保志愿登记',
    gistZh: '保护官介绍周日河岸柳树幼苗种植集合地点、防水靴穿戴要求及中午热蔬菜汤供应。'
  },
  'buckworth community centre activity registration': {
    titleZh: '巴克沃思社区中心晚间陶艺与瑜伽课程报名',
    categoryZh: '日常对话 · 社区课程预约',
    gistZh: '居民咨询社区中心周三晚间中级瑜伽课程时间与场地预订流程。'
  },
  'biomimicry in modern civil architecture': {
    titleZh: '现代土木建筑中的自然仿生学：白蚁丘被动通风',
    categoryZh: '学术讲座 · 可持续建筑设计',
    gistZh: '以津巴布韦东门中心为例，剖析建筑师如何模仿白蚁丘内部对流烟囱效应，降低35%大楼空调能耗。'
  },
  'children’s creative art workshop enrollment': {
    titleZh: '少儿创意陶艺与雕塑周末工作坊报名',
    categoryZh: '日常对话 · 少儿艺术培训',
    gistZh: '家长致电艺术中心为8岁女儿报名周六下午B画室粘土陶艺课，确认自备旧画衣等注意事项。'
  },
  "children's holiday art workshop registration": {
    titleZh: '少儿假期陶艺与泥塑艺术工作坊报名',
    categoryZh: '日常对话 · 假期课程预约',
    gistZh: '家长咨询平日上午9点至12点的儿童陶艺泥塑课程时间与材料包费用。'
  },
  'bank account opening consultation': {
    titleZh: '国际留学生英国银行开户与借记卡办理咨询',
    categoryZh: '日常对话 · 银行金融服务',
    gistZh: '银行顾问指导新生准备护照与大学录取信办理账户，并说明无接触借记卡5个工作日寄达流程。'
  },
  'bank account setup and student debit card services': {
    titleZh: '国际学生免月费银行账户开通与手机提醒服务',
    categoryZh: '日常对话 · 银行金融服务',
    gistZh: '银行客服介绍国际学生专属零月费账户权益与透支保护规则。'
  },
  'city marathon volunteer registration': {
    titleZh: '城市马拉松赛道引导员与25公里补水站志愿者报名',
    categoryZh: '日常对话 · 体育赛事志愿服务',
    gistZh: '赛事协调员安排10月8日赛前培训、25公里能量饮料补给站岗位及黄色反光背心发放。'
  },
  'university tennis club membership & coaching application': {
    titleZh: '大学网球俱乐部会员分级、场地预约与中级集训报名',
    categoryZh: '日常对话 · 校园体育俱乐部',
    gistZh: '学生咨询银卡会员室内合成毯与室外红土球场预约权限、穿线服务收费及周六上午上旋球集训班。'
  },
  'westfield community tennis & racket sports centre refurbishment': {
    titleZh: '韦斯特菲尔德社区网球中心翻新重开与智能发球机导览',
    categoryZh: '公共独白 · 体育场馆升级介绍',
    gistZh: '主管介绍能吸收20%关节冲击的多层缓冲丙烯酸球场、防眩光LED夜场灯光及3号场旁的可编程发球机。'
  },
  'international conference volunteer & campus hotel registration': {
    titleZh: '全球可持续发展峰会学生志愿者与校内住宿登记',
    categoryZh: '日常对话 · 国际会议志愿服务',
    gistZh: '核对志愿者证件号、参会代表签到台职责、补贴单人间住宿费及火车站免费接驳巴士时间。'
  },
  'highlands nature reserve & biodiversity trail orientation': {
    titleZh: '高地自然保护区木栈道导览与观水獭徒步指南',
    categoryZh: '公共独白 · 自然保护区导览',
    gistZh: '首席护林员介绍感官互动室、芦苇荡高架木栈道、观鸟天文台及猛禽育雏期步道管控规定。'
  },
  'renewable battery storage technology dissertation tutorial': {
    titleZh: '微电网储能论文辅导：钠离子电池与磷酸铁锂对比',
    categoryZh: '学术研讨 · 新能源材料工程',
    gistZh: '导师与学生评估钠离子电池降低35%原材料成本、60℃热稳定性及4000次充放电循环后的容量保持率。'
  },
  'prehistoric oceanic navigation across the polynesian triangle': {
    titleZh: '史前波利尼西亚三角洲远洋航海与32方位星盘',
    categoryZh: '学术讲座 · 海洋人类学',
    gistZh: '教授剖析“霍库莱阿号”双体独木舟实验航行，还原古人如何借星象、海浪反射与红薯传播横跨太平洋。'
  },
  'riverside university sports complex facility membership': {
    titleZh: '河畔大学综合体育馆羽毛球与健身会员办理',
    categoryZh: '日常对话 · 校园运动场馆',
    gistZh: '访问学者办理学期健身与羽毛球白金通行卡，确认桑拿房权限与4号区专属储物柜。'
  },
  'guided tour of the national maritime chronometer museum': {
    titleZh: '格林威治国家航海天文钟博物馆导览：哈里森H4航海钟',
    categoryZh: '公共独白 · 科技史博物馆导览',
    gistZh: '策展人讲解约翰·哈里森发明的H4精密航海钟如何攻克远洋航海经度测算的世纪难题。'
  },
  'aerodynamic efficiency in high-speed magnetic levitation trains': {
    titleZh: '高速磁悬浮列车受电弓腔体空气动力学减阻研讨',
    categoryZh: '学术研讨 · 机械与流体力学',
    gistZh: '研究生通过风洞模拟证实重新设计受电弓凹腔可减少30%隧道微气压波音爆效应。'
  },
  'ancient caravan oases & the silk road trans-eurasian commerce': {
    titleZh: '丝绸之路沙漠绿洲命脉：吐鲁番地下坎儿井灌溉工程',
    categoryZh: '学术讲座 · 历史地理与水利',
    gistZh: '解析古代工匠如何挖掘地下暗渠引天山冰雪融水灌溉绿洲，避免酷热沙漠中的水分蒸发损耗。'
  },
  'metropolitan public library archive volunteer orientation': {
    titleZh: '市立图书馆19世纪古地图数字化保护志愿者迎新',
    categoryZh: '日常对话 · 档案保护志愿服务',
    gistZh: '档案室主任向大学生志愿者说明每周四下午古籍地图扫描与数字化归档工作安排。'
  },
  'alpine botanical garden micro-pollinator conservation': {
    titleZh: '高山植物园独居壁蜂保护与野生植物授粉计划',
    categoryZh: '公共独白 · 生态保护园区介绍',
    gistZh: '生态员介绍不产蜜但授粉效率是普通蜜蜂三倍的独居壁蜂（Mason Bees）人工巢箱项目。'
  },
  'precision agricultural drones and soil nitrogen sensors': {
    titleZh: '精准农业多光谱无人机与土壤氮元素遥感监测',
    categoryZh: '学术研讨 · 现代精准农业',
    gistZh: '农学硕士生校准近红外反射指数，使无人机在作物叶片肉眼发黄前4天即精准检出氮肥缺失。'
  },
  'the metallurgy of damascus steel and carbon nanotube matrix': {
    titleZh: '大马士革花纹钢的古法坩埚冶金与碳纳米管结构',
    categoryZh: '学术讲座 · 材料考古学',
    gistZh: '电子显微镜揭开17世纪大马士革刀剑削铁如泥的秘密：锻造中自然形成的碳纳米管包裹着渗碳体纳米线。'
  },
  'campus cycling club equipment rental and trail registration': {
    titleZh: '校园骑行俱乐部山地车租赁与防水驮包配置登记',
    categoryZh: '日常对话 · 校园户外运动',
    gistZh: '指导员向留学生介绍每周35英镑的山地车租赁套餐（含防水驮包与补胎工具包）。'
  },
  'urban rooftop hydroponic farming and food sovereignty': {
    titleZh: '城市废弃仓库屋顶水培垂直农场与节水农业',
    categoryZh: '公共独白 · 城市可持续农业',
    gistZh: '社区农场发起人分享如何利用垂直营养液膜水培塔，以比传统土壤耕作少90%的用水量产出新鲜绿叶菜。'
  },
  'comparative phonology of celtic insular languages': {
    titleZh: '海岛凯尔特语族比较音系学：苏格兰盖尔语辅音弱化',
    categoryZh: '学术研讨 · 历史语言学',
    gistZh: '语言学导师与本科生探讨苏格兰盖尔语在阴性单数定冠词后系统性触发的词首辅音弱化（Lenition）规律。'
  },
  'iron age hillfort architecture & communal grain silos in britain': {
    titleZh: '不列颠铁器时代山丘堡垒防御工事与地下密封粮仓',
    categoryZh: '学术讲座 · 史前聚落考古',
    gistZh: '考古学家复原梅登城堡的钟形地下储粮窖：黏土密封形成的二氧化碳缺氧环境可让大麦种子保鲜五年不发芽。'
  }
};

const CATEGORY_ZH_FALLBACK: Record<string, string> = {
  'materials science & sports': '材料科学与体育工程',
  'civil engineering & environment': '土木工程与环境科学',
  'neurobiology & zoology': '神经生物学与动物学',
  'urban planning & tech': '城市规划与交通科技',
  'ecology & botany': '城市生态与植物学',
  'oceanography & deep sea': '深海海洋学',
  'historical infrastructure': '历史基础设施工程',
  'archaeology & engineering': '考古学与古代工程',
  'maritime history & archaeology': '航海史与水下考古',
  'anthropology & climate': '气候人类学',
  'renewable tech & hydrology': '清洁能源与水文学',
  'evolutionary biology & history': '进化生物学与饮食史',
  'sports history & cultural anthropology': '体育史与文化人类学',
  'applied physics & aerodynamics': '应用物理与空气动力学',
  'urban ecology & climate adaptation': '城市生态与气候适应',
  'marine geobiology & astrobiology': '海洋生物学与天体生物',
  'cognitive neuroscience & ai linguistics': '认知神经科学与AI语言学',
  'marine ecology & climate solutions': '海洋生态与碳汇方案',
  'cognitive science & linguistics': '认知科学与语言学',
  'urban engineering & renewable energy': '城市工程与地热能源',
  'biomimicry & aerodynamic engineering': '仿生工程与空气动力学',
  'medical technology & bioethics': '医疗科技与AI伦理',
  'polar glaciology & planetary analogs': '极地冰川学与行星科学',
  'behavioral biology & zoology': '动物行为学与生物社会学',
  'quantum physics & mining geophysics': '量子物理与地球物理勘探',
  'archaeological epigraphy & computational linguistics': '考古铭文学与计算语言学'
};

/**
 * Format Cambridge Volume Name into clean Chinese display label
 */
export function formatBookNameZh(book: string): string {
  if (!book) return '剑雅真题';
  if (book === 'ALL') return '全部卷册';
  const camMatch = book.match(/Cambridge\s*(\d+)/i);
  if (camMatch) return `剑桥雅思 ${camMatch[1]}`;
  if (/Special/i.test(book)) return '剑雅专项特辑';
  if (/2026/.test(book)) return '2026 考场真题';
  if (/2025/.test(book)) return '2025 考场真题';
  if (/2024/.test(book)) return '2024 考场真题';
  return book;
}

/**
 * Get clear Chinese core topic title, English subtitle, Chinese category, and 1-sentence gist for any Reading Passage
 */
export function getPassageBilingualMeta(passage: {
  id?: string;
  title: string;
  category?: string;
  text?: string;
  passageNumber?: number;
  summary?: string;
}): BilingualTopicMeta {
  const rawTitle = (passage.title || '').trim();
  const lowerTitle = rawTitle.toLowerCase();

  // 1. Check if title already contains "中文标题 (English Title)"
  const mixedMatch = rawTitle.match(/^([\u4e00-\u9fa5][^()（）]+?)\s*[（(]([A-Za-z0-9\s:,&'-]+)[)）]$/);
  if (mixedMatch) {
    return {
      titleZh: mixedMatch[1].trim(),
      titleEn: mixedMatch[2].trim(),
      categoryZh: passage.category || '学术阅读真题',
      gistZh: '剑桥雅思官方学术阅读精选长文，涵盖高频同义替换与核心论证结构。'
    };
  }

  // 2. Check exact match in PASSAGE_BILINGUAL_MAP
  if (PASSAGE_BILINGUAL_MAP[lowerTitle]) {
    const mapped = PASSAGE_BILINGUAL_MAP[lowerTitle];
    return {
      titleZh: mapped.titleZh,
      titleEn: rawTitle,
      categoryZh: mapped.categoryZh,
      gistZh: mapped.gistZh
    };
  }

  // 3. Check partial match or Official Academic Reading prefix
  if (rawTitle.startsWith('Official Academic Reading:') && /[\u4e00-\u9fa5]/.test(rawTitle)) {
    const zhPart = rawTitle.replace('Official Academic Reading:', '').trim();
    return {
      titleZh: zhPart,
      titleEn: 'Cambridge Official Academic Reading',
      categoryZh: '自然科学与人文历史',
      gistZh: '剑桥雅思历年经典学术阅读长文，精选高频必考话题与核心学术词汇。'
    };
  }

  // 4. Match via IELTS_TOPIC_DICTIONARY keywords
  for (const topic of IELTS_TOPIC_DICTIONARY) {
    if (topic.englishTerms.some(et => lowerTitle.includes(et.toLowerCase()))) {
      const catZh = CATEGORY_ZH_FALLBACK[(passage.category || '').toLowerCase()] || '剑雅学术阅读';
      return {
        titleZh: `${topic.chineseTerms[0]}与${topic.chineseTerms[1] || '学术前沿'}研究`,
        titleEn: rawTitle,
        categoryZh: catZh,
        gistZh: `围绕「${topic.chineseTerms.slice(0, 3).join('、')}」展开的剑桥雅思全真学术阅读篇章。`
      };
    }
  }

  // 5. Fallback for custom/imported articles
  const catLower = (passage.category || '').toLowerCase();
  const categoryZh = CATEGORY_ZH_FALLBACK[catLower] || (
    /[\u4e00-\u9fa5]/.test(passage.category || '') ? passage.category! : '剑雅学术阅读'
  );

  // If rawTitle already has Chinese characters, use it directly
  if (/[\u4e00-\u9fa5]/.test(rawTitle)) {
    return {
      titleZh: rawTitle,
      titleEn: passage.category || 'IELTS Academic Reading',
      categoryZh,
      gistZh: '剑桥雅思学术类阅读精选篇章，训练快速扫读定位与长难句同义替换。'
    };
  }

  return {
    titleZh: `${categoryZh}：${rawTitle}`,
    titleEn: rawTitle,
    categoryZh,
    gistZh: '剑桥雅思官方学术阅读全真篇章，涵盖高频学术词汇与典型考场题型。'
  };
}

/**
 * Get clear Chinese core topic title, English subtitle, Chinese scenario, and gist for any Listening Section
 */
export function getListeningBilingualMeta(section: {
  id?: string;
  title: string;
  scenario?: string;
  category?: string;
  sectionNum?: number;
  sectionNumber?: number;
}): BilingualTopicMeta {
  const rawTitle = (section.title || '').trim();
  const rawScenario = section.scenario || section.category || '';
  const sNum = section.sectionNum || section.sectionNumber || 1;
  const lowerTitle = rawTitle.toLowerCase();

  // 1. Check if title already contains "中文标题 (English Title)"
  const mixedMatch = rawTitle.match(/^([\u4e00-\u9fa5][^()（）]+?)\s*[（(]([A-Za-z0-9\s:,&'-]+)[)）]$/);
  if (mixedMatch) {
    return {
      titleZh: mixedMatch[1].trim(),
      titleEn: mixedMatch[2].trim(),
      categoryZh: rawScenario || `Part ${sNum} 听力真题`,
      gistZh: '剑桥雅思官方原声听力真题，训练考场瞬时同义替换与数字拼写捕捉。'
    };
  }

  // 2. Check exact match in LISTENING_BILINGUAL_MAP
  if (LISTENING_BILINGUAL_MAP[lowerTitle]) {
    const mapped = LISTENING_BILINGUAL_MAP[lowerTitle];
    return {
      titleZh: mapped.titleZh,
      titleEn: rawTitle,
      categoryZh: mapped.categoryZh,
      gistZh: mapped.gistZh
    };
  }

  // 3. If scenario already has Chinese description (like "日常申请 · 大学室内综合体育馆会员注册与场地预订")
  if (rawScenario && /[\u4e00-\u9fa5]/.test(rawScenario)) {
    const parts = rawScenario.split('·').map(s => s.trim());
    const zhTitle = parts.length > 1 ? parts[1] : rawScenario;
    const zhCat = parts.length > 1 ? parts[0] : `Part ${sNum} 官方听力`;
    return {
      titleZh: zhTitle,
      titleEn: rawTitle,
      categoryZh: zhCat,
      gistZh: rawScenario
    };
  }

  // 4. Match via IELTS_TOPIC_DICTIONARY
  for (const topic of IELTS_TOPIC_DICTIONARY) {
    if (topic.englishTerms.some(et => lowerTitle.includes(et.toLowerCase()))) {
      return {
        titleZh: `${topic.chineseTerms[0]}场景听力实训`,
        titleEn: rawTitle,
        categoryZh: `Part ${sNum} · 考场听力`,
        gistZh: rawScenario || '剑桥雅思官方听力场景训练。'
      };
    }
  }

  const partLabel = sNum === 1 ? '日常咨询对话'
    : sNum === 2 ? '公共导览独白'
    : sNum === 3 ? '学术课题研讨'
    : '大学专题讲座';

  return {
    titleZh: /[\u4e00-\u9fa5]/.test(rawTitle) ? rawTitle : `${partLabel}：${rawTitle}`,
    titleEn: rawTitle,
    categoryZh: `Part ${sNum} · ${partLabel}`,
    gistZh: rawScenario || '剑桥雅思官方听力全真场景训练。'
  };
}

