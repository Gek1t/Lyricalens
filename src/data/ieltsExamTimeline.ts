import type { IELTSVolume } from './ieltsVolumes.ts';
import type { CambridgePassage } from './ieltsPassages.ts';
import type { IELTSListeningSection } from './ieltsListening.ts';
import { buildStandard40QuestionVolume } from './ieltsDynamicGenerator.ts';

export interface ExamTimelineSession {
  id: string;
  examDate: string; // e.g. "2026-08-29"
  dateLabel: string; // e.g. "2026年8月29日 (周六)"
  region: 'asia_pacific' | 'mainland_china' | 'global';
  regionBadge: string; // e.g. "亚太卷 · 香港/曼谷/墨尔本"
  mode: '机考 & 纸笔' | '机考专场' | '纸笔全国统考';
  recallAccuracy: number; // e.g. 96
  hotScore: string; // e.g. "99.4% 命中"
  isLatest: boolean;
  reuseWarning?: {
    isHighRisk: boolean;
    frequencyCount: number;
    text: string;
    targetPassageTitle: string;
  };
  readingPassages: Array<{
    passageNum: number;
    title: string;
    topicCategory: string;
    wordCount: number;
    difficulty: string;
    coreKeywords: string[];
    summary: string;
    questionTypes: string[];
    sourceDomain: string;
    keyVocab?: string[];
  }>;
  listeningSections: Array<{
    sectionNum: number;
    title: string;
    scenario: string;
    speakerRole: string;
    difficulty: string;
    coreKeywords: string[];
    summary: string;
    questionTypes: string[];
    keyVocab?: string[];
  }>;
  volumeId: string;
}

export const EXAM_TIMELINE_SESSIONS: ExamTimelineSession[] = [
  {
    id: 'session-2026-08-29-ap',
    examDate: '2026-08-29',
    dateLabel: '2026年8月29日 (周六)',
    region: 'asia_pacific',
    regionBadge: '亚太卷 · 香港 / 曼谷 / 墨尔本 / 首尔',
    mode: '机考 & 纸笔',
    recallAccuracy: 96,
    hotScore: '99.8% 考场还原',
    isLatest: true,
    reuseWarning: {
      isHighRisk: true,
      frequencyCount: 2,
      targetPassageTitle: '座头鲸鳍肢结节仿生水动力学与风机叶片',
      text: '⚠️ 高频转考预警：该场 P2《座头鲸鳍肢结节仿生水动力学》近 3 周内在亚太与大陆考区出现 2 次，属于换题季高频母题，极大概率在 9 月后续场次翻考！'
    },
    readingPassages: [
      {
        passageNum: 1,
        title: '新西兰毛利传统雕刻与现代文化遗产传承 (Maori Wood Carvings and Cultural Heritage)',
        topicCategory: '艺术人类学 & 建筑文化',
        wordCount: 880,
        difficulty: 'Band 6.5 - 7.5',
        coreKeywords: ['Maori', 'carving', 'totara', 'whare whakairo', 'ancestral', 'preservation'],
        summary: '探讨毛利人在聚会所（Whare Whakairo）采用原生桃拓罗木（Totara）进行图腾雕刻的技法演进，以及 20 世纪后期新西兰通过国家法案抢救濒危毛利雕刻艺术的制度实践。',
        questionTypes: ['判断题 (TFNG)', '笔记填空 (Note Completion)'],
        sourceDomain: 'teara.govt.nz'
      },
      {
        passageNum: 2,
        title: '座头鲸鳍肢结节仿生水动力学与风力发电机减阻 (Humpback Whale Tubercles and Biomimetic Turbine Hydrodynamics)',
        topicCategory: '仿生工程学 & 流体力学',
        wordCount: 960,
        difficulty: 'Band 7.0 - 8.0',
        coreKeywords: ['tubercles', 'hydrodynamic', 'boundary layer', 'vortices', 'aerofoil', 'stall angle'],
        summary: '科学家解析座头鲸重达数十吨却能在水中极其敏捷翻转的原因：其胸鳍前缘的波浪形凸起结节（Tubercles）产生微型涡流延迟流体分离。这一机制已被成功移植至新一代海上风力发电机叶片。',
        questionTypes: ['段落标题配对 (Matching Headings)', '简答题 (Short Answer)'],
        sourceDomain: 'nature.com'
      },
      {
        passageNum: 3,
        title: '认知神经科学：决策疲劳与司法量刑规律 (Cognitive Fatigue and Judicial Sentencing)',
        topicCategory: '认知心理学 & 司法行为学',
        wordCount: 1040,
        difficulty: 'Band 7.5 - 8.5',
        coreKeywords: ['decision fatigue', 'ego depletion', 'parole', 'cognitive load', 'heuristic', 'deliberation'],
        summary: '哥伦比亚大学与以色列法学院联合追踪一千多起假释庭审，发现法官在刚开庭或餐后假释批准率高达 65%，而随着持续审理引发血糖与自控力衰竭（Ego Depletion），批准率骤降至 0%。',
        questionTypes: ['人名观点配对 (Matching Features)', '单项选择 (Multiple Choice)'],
        sourceDomain: 'pnas.org'
      }
    ],
    listeningSections: [
      {
        sectionNum: 1,
        title: '社区有机农场志愿者招募咨询 (Community Farm Volunteer Consultation)',
        scenario: 'Section 1: 租房与社区生活咨询',
        speakerRole: '项目协调员 & 报名志愿者',
        difficulty: 'Band 5.5 - 6.5',
        coreKeywords: ['composting', 'greenhouse', 'membership', 'induction', 'equipment'],
        summary: '志愿者咨询社区农场周末种植、堆肥研讨会安排，核实会员费用与安全护具发放。',
        questionTypes: ['个人信息填空 (Form Completion)']
      },
      {
        sectionNum: 2,
        title: '达特穆尔国家公园高地徒步导览 (Dartmoor National Park Hiking Guide)',
        scenario: 'Section 2: 公共设施与旅游导览',
        speakerRole: '资深护林员讲解',
        difficulty: 'Band 6.0 - 7.0',
        coreKeywords: ['granite tors', 'boggy terrain', 'waymarker', 'compass', 'emergency beacon'],
        summary: '护林员介绍高地花岗岩地貌特点、泥炭沼泽避险路线及访客中心地图标注。',
        questionTypes: ['地图标号题 (Map Labelling)', '多项选择题 (Multiple Choice)']
      },
      {
        sectionNum: 3,
        title: '环境科学专业导师与学生学术论文讨论 (Tutorial on Urban Microclimate Mitigation)',
        scenario: 'Section 3: 学术辅导与研究方法研讨',
        speakerRole: '环境学导师与两名研究生',
        difficulty: 'Band 7.0 - 8.0',
        coreKeywords: ['albedo', 'thermal imaging', 'methodology', 'sample size', 'regression analysis'],
        summary: '导师与学生讨论利用无人机热成像仪采集城市街区高反射涂层降温数据的实验设计与统计误差修正。',
        questionTypes: ['匹配配对题 (Matching)', '单选题 (Multiple Choice)']
      },
      {
        sectionNum: 4,
        title: '建筑考古学：拜占庭穹顶抗震工程演进 (Seismic Resilience of Byzantine Domes)',
        scenario: 'Section 4: 大学学术演讲',
        speakerRole: '建筑史客座教授',
        difficulty: 'Band 7.5 - 8.5',
        coreKeywords: ['pendentive', 'mortar', 'pozzolana', 'seismic fault', 'tensile strength'],
        summary: '学术剖析圣索菲亚大教堂等早期拜占庭建筑如何利用悬三角（Pendentive）与火山灰轻质砂浆抵御多次强震冲击。',
        questionTypes: ['大纲笔记填空 (Note Completion)']
      }
    ],
    volumeId: 'vol-timeline-2026-08-29'
  },
  {
    id: 'session-2026-08-22-cn',
    examDate: '2026-08-22',
    dateLabel: '2026年8月22日 (周六)',
    region: 'mainland_china',
    regionBadge: '中国大陆卷 · 全国考点纸笔 & 机考',
    mode: '机考 & 纸笔',
    recallAccuracy: 94,
    hotScore: '99.5% 考场还原',
    isLatest: false,
    reuseWarning: {
      isHighRisk: false,
      frequencyCount: 1,
      targetPassageTitle: '深海热泉生态系统与嗜极微生物生物采矿',
      text: '💡 考情提示：该场 P1《深海热泉》为 2026 夏季新题库首轮出现，阅读生词覆盖深海极端环境与酶催化，建议重点复习词汇。'
    },
    readingPassages: [
      {
        passageNum: 1,
        title: '深海热泉生态系统与嗜极微生物生物采矿 (Hydrothermal Vent Extremophiles and Biomining)',
        topicCategory: '深海生物学 & 生物冶金',
        wordCount: 890,
        difficulty: 'Band 6.5 - 7.5',
        coreKeywords: ['hydrothermal vents', 'chemosynthesis', 'extremophiles', 'hyperthermophile', 'biomining'],
        summary: '深海大洋中脊黑烟囱在高温高压且无光的极端环境下，嗜热古菌利用硫化氢进行化能合成，维持了独特的深海生物圈。现代矿业正尝试利用这类菌种提取稀缺多金属硫化物。',
        questionTypes: ['判断题 (TFNG)', '图表填空 (Diagram Completion)'],
        sourceDomain: 'sciencedirect.com'
      },
      {
        passageNum: 2,
        title: '儿童双语习得机制与大脑皮层电生理响应 (Cortical Neuroplasticity in Childhood Bilingualism)',
        topicCategory: '发展心理学 & 语言学',
        wordCount: 980,
        difficulty: 'Band 7.0 - 8.0',
        coreKeywords: ['bilingualism', 'executive function', 'neuroplasticity', 'DLPFC', 'inhibitory control'],
        summary: '对比单语与双语儿童在执行控制功能（Executive Function）上的神经电生理测试，证实早期双语环境促使前额叶皮层产生更高效的注意分配与冲突抑制通道。',
        questionTypes: ['段落信息匹配 (Matching Information)', '选择题 (Multiple Choice)'],
        sourceDomain: 'cambridge.org'
      },
      {
        passageNum: 3,
        title: '城市高反射涂层建筑降温工程 (Urban Cool Roof Engineering and Microclimate Control)',
        topicCategory: '材料科学 & 城市热环境',
        wordCount: 1020,
        difficulty: 'Band 7.5 - 8.5',
        coreKeywords: ['cool roof', 'solar reflectance', 'thermal emittance', 'radiative cooling', 'convection'],
        summary: '评估超高反射率涂层（冷屋顶）在大规模商业建筑群的应用实效。实验表明提高反照率不仅直接消减空调能耗，还能逆转区域城市热岛环流。',
        questionTypes: ['选词摘要填空 (Summary Completion with Word Box)', '单选题 (Multiple Choice)'],
        sourceDomain: 'sciencedirect.com'
      }
    ],
    listeningSections: [
      {
        sectionNum: 1,
        title: '新居民社区垃圾分类与回收箱申领 (Municipal Recycling Bin Application)',
        scenario: 'Section 1: 市政与日常生活登记',
        speakerRole: '市政服务热线坐席 & 搬家居民',
        difficulty: 'Band 5.5 - 6.5',
        coreKeywords: ['recycling', 'food waste', 'postcode', 'collection day', 'concession'],
        summary: '新住户电话申请厨余垃圾箱及黄色可回收物大箱，核对派送地址与每周清运周期。',
        questionTypes: ['表格填空 (Form Completion)']
      },
      {
        sectionNum: 2,
        title: '城市当代美术馆声学装置展导览 (Contemporary Acoustic Art Installation Guide)',
        scenario: 'Section 2: 文化场馆与展会指引',
        speakerRole: '策展人导览讲解',
        difficulty: 'Band 6.0 - 7.0',
        coreKeywords: ['soundscape', 'interactive', 'frequency', 'headphones', 'gallery layout'],
        summary: '策展人向观众介绍多声道声学展厅的动线分布、交互装置的操作方式及耳机借还规则。',
        questionTypes: ['地图方位匹配 (Map Matching)', '单选题 (Multiple Choice)']
      },
      {
        sectionNum: 3,
        title: '生物系野外候鸟雷达追踪数据研讨 (Fieldwork on Migratory Bird Radar Tracking)',
        scenario: 'Section 3: 学术讨论与论文研讨',
        speakerRole: '指导教授与生物学博士生',
        difficulty: 'Band 7.0 - 8.0',
        coreKeywords: ['radar reflectance', 'altitude', 'avian', 'meteorological interference', 'GPS tag'],
        summary: '师生评估利用多普勒天气雷达追踪夜间候鸟迁徙种群密度的可行性，排查气象雨雪杂波干扰。',
        questionTypes: ['配对题 (Matching)', '多选题 (Multiple Choice)']
      },
      {
        sectionNum: 4,
        title: '经济史：工业革命早期纺织厂水动力工坊变迁 (Hydropower and the Rise of Early Textile Mills)',
        scenario: 'Section 4: 历史学学术讲座',
        speakerRole: '经济史学者',
        difficulty: 'Band 7.5 - 8.5',
        coreKeywords: ['waterwheel', 'spinning jenny', 'derwent valley', 'capital investment', 'mechanisation'],
        summary: '详述 18 世纪英国德文特河谷水力纺纱厂的兴衰，剖析水轮机布局对早期工厂劳动组织与城镇化格局的深远塑造。',
        questionTypes: ['流程与大纲填空 (Note Completion)']
      }
    ],
    volumeId: 'vol-timeline-2026-08-22'
  },
  {
    id: 'session-2026-08-15-ap',
    examDate: '2026-08-15',
    dateLabel: '2026年8月15日 (周六)',
    region: 'asia_pacific',
    regionBadge: '亚太卷 · 新加坡 / 首尔 / 吉隆坡 / 迪拜',
    mode: '机考专场',
    recallAccuracy: 92,
    hotScore: '98.9% 考场还原',
    isLatest: false,
    reuseWarning: {
      isHighRisk: true,
      frequencyCount: 3,
      targetPassageTitle: '古巴比伦天文学与楔形文字泥板数学',
      text: '⚠️ 高频转考预警：该场 P1《古巴比伦天文学》在过去 6 周内已在墨尔本与新加坡复用，涉及天文学历史发展，建议重点演练。'
    },
    readingPassages: [
      {
        passageNum: 1,
        title: '古巴比伦天文学与楔形文字泥板数学 (Babylonian Cuneiform Astronomy and Planetary Mathematics)',
        topicCategory: '古代科学史 & 考古学',
        wordCount: 870,
        difficulty: 'Band 6.5 - 7.5',
        coreKeywords: ['cuneiform', 'clay tablets', 'ephemerides', 'zodiac', 'geometric calculation'],
        summary: '解密大英博物馆馆藏公元前 300 年巴比伦泥板，证实古巴比伦天文学家早于欧洲学者十四个世纪便运用梯形几何积分算法计算木星运动轨迹。',
        questionTypes: ['判断题 (TFNG)', '简答题 (Short Answer)'],
        sourceDomain: 'science.org'
      },
      {
        passageNum: 2,
        title: '植物电生理学：捕蝇草触觉感受器与记忆电位 (Mechanosensation and Action Potentials in Venus Flytrap)',
        topicCategory: '植物生物学 & 电生理',
        wordCount: 950,
        difficulty: 'Band 7.0 - 8.0',
        coreKeywords: ['Venus flytrap', 'trigger hairs', 'action potential', 'calcium flux', 'carnivorous plant'],
        summary: '科学家探测捕蝇草叶片陷阱的触发机制：昆虫必须在 20 秒内触碰两次触毛，触发双重钙离子动作电位累积，叶片才会迅速合拢，防止雨滴误触浪费能量。',
        questionTypes: ['段落标题配对 (Matching Headings)', '表格填空 (Table Completion)'],
        sourceDomain: 'cell.com'
      },
      {
        passageNum: 3,
        title: '分布式微电网储能与电网抗灾韧性 (Microgrid Energy Storage and Grid Resilience)',
        topicCategory: '能源工程 & 系统工程',
        wordCount: 1030,
        difficulty: 'Band 7.5 - 8.5',
        coreKeywords: ['microgrid', 'distributed storage', 'islanding mode', 'inverter', 'grid resilience'],
        summary: '剖析极端气候频发背景下，孤岛运行模式（Islanding Mode）微电网如何通过分散式磷酸铁锂储能柜为医院、通信基站等核心基础设施维持供电。',
        questionTypes: ['选择题 (Multiple Choice)', '摘要填空 (Summary Completion)'],
        sourceDomain: 'ieee.org'
      }
    ],
    listeningSections: [
      {
        sectionNum: 1,
        title: '儿童水上安全夏令营报名 (Children Water Safety Summer Camp Registration)',
        scenario: 'Section 1: 体育活动与日常咨询',
        speakerRole: '游泳学校前台与家长',
        difficulty: 'Band 5.5 - 6.5',
        coreKeywords: ['lifeguard', 'buoyancy aid', 'session times', 'medical history'],
        summary: '家长咨询少儿暑期防溺水训练班，核对班型、体检证明及水上安全用具准备。',
        questionTypes: ['个人信息填空 (Form Completion)']
      },
      {
        sectionNum: 2,
        title: '滨海灯塔历史遗迹改造项目宣讲 (Coastal Lighthouse Heritage Restoration)',
        scenario: 'Section 2: 旅游文化宣讲',
        speakerRole: '遗产保护信托基金代表',
        difficulty: 'Band 6.0 - 7.0',
        coreKeywords: ['fresnel lens', 'restoration', 'observation deck', 'visitor center'],
        summary: '介绍维多利亚时代老灯塔的透镜保护历程、新建观景台及无障碍坡道设计。',
        questionTypes: ['地图方位填空 (Map Completion)', '选择题 (Multiple Choice)']
      },
      {
        sectionNum: 3,
        title: '供应链管理课程案例分析研讨 (Supply Chain Optimization Case Study)',
        scenario: 'Section 3: 商学院学术辅导',
        speakerRole: '商学院教授与两位研究生',
        difficulty: 'Band 7.0 - 8.0',
        coreKeywords: ['just-in-time', 'lead time', 'bottleneck', 'inventory turnover', 'resilience'],
        summary: '探讨汽车制造企业在后疫情时代从“准时生产制（JIT）”向“稳健冗余（Just-in-case）”模式转型的权衡。',
        questionTypes: ['匹配题 (Matching)', '多选题 (Multiple Choice)']
      },
      {
        sectionNum: 4,
        title: '动物学：灵长类动物工具制造与文化传递 (Primate Tool Use and Cultural Transmission)',
        scenario: 'Section 4: 人类学与动物行为学演讲',
        speakerRole: '灵长类动物学家',
        difficulty: 'Band 7.5 - 8.5',
        coreKeywords: ['chimpanzee', 'termite fishing', 'stone anvil', 'social learning', 'imitation'],
        summary: '总结西非黑猩猩使用石砧砸坚果及细枝钓白蚁的跨代传递证据，证明工具制造具备文化区域性。',
        questionTypes: ['笔记填空 (Note Completion)']
      }
    ],
    volumeId: 'vol-timeline-2026-08-15'
  },
  {
    id: 'session-2026-08-08-cn',
    examDate: '2026-08-08',
    dateLabel: '2026年8月8日 (周六)',
    region: 'mainland_china',
    regionBadge: '中国大陆卷 · 全国统一纸笔 & 机考',
    mode: '机考 & 纸笔',
    recallAccuracy: 95,
    hotScore: '99.6% 考场还原',
    isLatest: false,
    readingPassages: [
      {
        passageNum: 1,
        title: '古罗马混凝土水下硬化机理与现代仿生防波堤 (Ancient Roman Concrete and Maritime Engineering)',
        topicCategory: '工程历史 & 材料学',
        wordCount: 880,
        difficulty: 'Band 6.5 - 7.5',
        coreKeywords: ['pozzolana', 'lime clasts', 'tobermorite', 'seawater corrosion', 'breakwater'],
        summary: '探讨古罗马海港防波堤历经两千年海水冲刷反而愈加坚固的机理：火山灰与海水发生次生结晶，生成稀有的斜托贝莫来石晶体。',
        questionTypes: ['判断题 (TFNG)', '摘要填空 (Summary Completion)'],
        sourceDomain: 'nature.com'
      },
      {
        passageNum: 2,
        title: '深海发光水母绿色荧光蛋白与现代医学标记 (Green Fluorescent Protein in Molecular Biology)',
        topicCategory: '生物医学 & 诺贝尔奖成果',
        wordCount: 960,
        difficulty: 'Band 7.0 - 8.0',
        coreKeywords: ['Aequorea victoria', 'GFP', 'bioluminescence', 'molecular tag', 'in vivo imaging'],
        summary: '回顾下村脩从多管水母中提取 GFP 并被钱永健等人改造为细胞荧光示踪标记物的发展历程，推动了现代癌症基因追踪技术。',
        questionTypes: ['人名观点配对 (Matching Names)', '单选题 (Multiple Choice)'],
        sourceDomain: 'nobelprize.org'
      },
      {
        passageNum: 3,
        title: '语言哲学：隐喻与人类认知架构构建 (Metaphors and Cognitive Conceptual Architecture)',
        topicCategory: '认知语言学 & 哲学',
        wordCount: 1010,
        difficulty: 'Band 7.5 - 8.5',
        coreKeywords: ['conceptual metaphor', 'Lakoff', 'embodied cognition', 'source domain', 'target domain'],
        summary: '评述莱考夫《我们赖以生存的隐喻》，论证人类概念系统本质上是由身体感知经验投影建立的隐喻网络。',
        questionTypes: ['标题配对 (Matching Headings)', '多选题 (Multiple Choice)'],
        sourceDomain: 'oup.com'
      }
    ],
    listeningSections: [
      {
        sectionNum: 1,
        title: '青年帆船俱乐部租借与课程咨询 (Sailing Club Membership Inquiry)',
        scenario: 'Section 1: 休闲运动与日常咨询',
        speakerRole: '俱乐部干事与申请人',
        difficulty: 'Band 5.5 - 6.5',
        coreKeywords: ['dinghy', 'buoyancy jacket', 'locker rental', 'tide times'],
        summary: '申请人咨询小帆船租借手续、救生衣配置与初学者风帆操控培训班排期。',
        questionTypes: ['信息填空 (Form Completion)']
      },
      {
        sectionNum: 2,
        title: '地热温泉康养小镇景区发展规划 (Geothermal Spa Town Masterplan)',
        scenario: 'Section 2: 城市规划与旅游介绍',
        speakerRole: '地方旅游局官员',
        difficulty: 'Band 6.0 - 7.0',
        coreKeywords: ['aquifer', 'mineral spring', 'pedestrian precinct', 'shuttle bus'],
        summary: '官员向居民介绍温泉镇步行街改造工程、穿梭巴士路线及古罗马浴场遗址公园。',
        questionTypes: ['地图方位选择 (Map Matching)', '单选题 (Multiple Choice)']
      },
      {
        sectionNum: 3,
        title: '工业设计专业关于仿生无人机机翼设计答辩 (Biomimetic Drone Wing Design Review)',
        scenario: 'Section 3: 工程学毕业设计辅导',
        speakerRole: '导师与工程系学生',
        difficulty: 'Band 7.0 - 8.0',
        coreKeywords: ['dragonfly wing', 'flutter', 'aspect ratio', 'carbon fiber', 'aerodynamic drag'],
        summary: '师生分析蜻蜓翅膀边缘褶皱结构如何抑制高速飞行震颤，测试碳纤维机翼风洞测试数据。',
        questionTypes: ['匹配题 (Matching)', '单选题 (Multiple Choice)']
      },
      {
        sectionNum: 4,
        title: '城市社会学：第三空间对社区凝聚力的影响 (The Sociology of Third Places and Community Cohesion)',
        scenario: 'Section 4: 社会学大学演讲',
        speakerRole: '城市社会学教授',
        difficulty: 'Band 7.5 - 8.5',
        coreKeywords: ['third place', 'Ray Oldenburg', 'social capital', 'civic engagement', 'loneliness'],
        summary: '探讨咖啡馆、公共图书馆与社区理发店等“第三空间”在抵抗现代都市原子化孤独、催生草根公民参与中的不可替代性。',
        questionTypes: ['笔记填空 (Note Completion)']
      }
    ],
    volumeId: 'vol-timeline-2026-08-08'
  }
];

/**
 * Filter sessions by region and search query
 */
export function filterExamTimeline(
  sessions: ExamTimelineSession[],
  regionFilter: 'all' | 'asia_pacific' | 'mainland_china' | 'global' = 'all',
  searchQuery: string = ''
): ExamTimelineSession[] {
  let filtered = sessions;

  if (regionFilter !== 'all') {
    filtered = filtered.filter(s => s.region === regionFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(s => {
      const matchDate = s.examDate.includes(q) || s.dateLabel.toLowerCase().includes(q);
      const matchRegion = s.regionBadge.toLowerCase().includes(q);
      const matchPassage = s.readingPassages.some(
        p => p.title.toLowerCase().includes(q) ||
             p.summary.toLowerCase().includes(q) ||
             p.coreKeywords.some(k => k.toLowerCase().includes(q))
      );
      const matchListening = s.listeningSections.some(
        l => l.title.toLowerCase().includes(q) ||
             l.summary.toLowerCase().includes(q) ||
             l.coreKeywords.some(k => k.toLowerCase().includes(q))
      );
      const matchWarning = s.reuseWarning?.text.toLowerCase().includes(q);
      return matchDate || matchRegion || matchPassage || matchListening || matchWarning;
    });
  }

  return filtered;
}

/**
 * Generate a complete IELTS Volume from an ExamTimelineSession with deterministic IDs
 */
export function buildVolumeFromTimelineSession(session: ExamTimelineSession): IELTSVolume {
  const vol = buildStandard40QuestionVolume(
    `${session.dateLabel} ${session.regionBadge}`,
    [],
    {
      webResults: session.readingPassages.map(p => ({
        title: p.title,
        snippet: p.summary,
        url: `https://${p.sourceDomain}`
      })),
      examDate: session.examDate,
      examRegion: session.regionBadge
    }
  );

  const deterministicVolId = session.volumeId || `vol-${session.id}`;
  const shortDateBook = `2026机经 · ${session.examDate}`;
  vol.id = deterministicVolId;

  if (vol.tests?.[0]) {
    vol.tests[0].readingPassages = (vol.tests[0].readingPassages || []).map((p, idx) => {
      const sp = session.readingPassages[idx];
      return {
        ...p,
        id: `${session.id}-reading-p${idx + 1}`,
        passageNum: (idx + 1) as 1 | 2 | 3,
        title: sp ? sp.title : p.title,
        category: sp ? sp.topicCategory : p.category,
        bandDifficulty: (sp ? sp.difficulty : p.bandDifficulty) as any,
        cambridgeBook: shortDateBook,
        keyVocab: sp?.coreKeywords?.length ? sp.coreKeywords : p.keyVocab
      };
    });

    vol.tests[0].listeningSections = (vol.tests[0].listeningSections || []).map((s, idx) => {
      const sl = session.listeningSections[idx];
      return {
        ...s,
        id: `${session.id}-listening-s${idx + 1}`,
        sectionNum: (idx + 1) as 1 | 2 | 3 | 4,
        title: sl ? sl.title : s.title,
        scenario: sl ? sl.scenario : s.scenario,
        speakerRole: sl ? sl.speakerRole : s.speakerRole,
        bandDifficulty: (sl ? sl.difficulty : s.bandDifficulty) as any,
        cambridgeBook: shortDateBook,
        keyVocab: sl?.coreKeywords?.length ? sl.coreKeywords : s.keyVocab
      };
    });
  }

  return vol;
}

