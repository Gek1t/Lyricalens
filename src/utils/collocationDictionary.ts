/**
 * Rich collocations and morphological breakdowns for academic and lyric vocabulary
 */
export interface CollocationItem {
  phrase: string;
  cn: string;
  type?: string; // e.g. 'adj. + n.', 'v. + n.', 'n. + n.'
}

export const VOCAB_COLLOCATIONS: Record<string, CollocationItem[]> = {
  'compacted': [
    { phrase: 'compacted soil', cn: '压实土壤 / 板结土壤', type: 'adj. + n.' },
    { phrase: 'heavily compacted', cn: '高度压实的 / 紧密板结的', type: 'adv. + adj.' },
    { phrase: 'compacted layers', cn: '致密层 / 压实地层', type: 'adj. + n.' },
    { phrase: 'compacted waste', cn: '压实垃圾', type: 'adj. + n.' }
  ],
  'compact': [
    { phrase: 'compact design', cn: '紧凑型设计', type: 'adj. + n.' },
    { phrase: 'compact structure', cn: '紧凑结构', type: 'adj. + n.' },
    { phrase: 'compact camera', cn: '便携式相机', type: 'adj. + n.' },
    { phrase: 'compact disc', cn: '光盘 (CD)', type: 'n. + n.' }
  ],
  'concrete': [
    { phrase: 'concrete evidence', cn: '确凿证据 / 实在证据', type: 'adj. + n.' },
    { phrase: 'concrete proposal', cn: '具体提案 / 切实方案', type: 'adj. + n.' },
    { phrase: 'reinforced concrete', cn: '钢筋混凝土', type: 'adj. + n.' },
    { phrase: 'concrete jungle', cn: '混凝土丛林 / 水泥森林', type: 'n. + n.' }
  ],
  'ephemeral': [
    { phrase: 'ephemeral pleasure', cn: '转瞬即逝的快乐', type: 'adj. + n.' },
    { phrase: 'ephemeral nature', cn: '短暂性 / 易逝本质', type: 'adj. + n.' },
    { phrase: 'ephemeral weeds', cn: '短生植物 / 先锋野草', type: 'adj. + n.' },
    { phrase: 'ephemeral art', cn: '短暂艺术 (沙画/冰雕)', type: 'adj. + n.' }
  ],
  'resilience': [
    { phrase: 'build resilience', cn: '建立复原力 / 增强韧性', type: 'v. + n.' },
    { phrase: 'psychological resilience', cn: '心理韧性 / 抗压能力', type: 'adj. + n.' },
    { phrase: 'ecological resilience', cn: '生态恢复力 / 环境适应力', type: 'adj. + n.' },
    { phrase: 'economic resilience', cn: '经济韧性', type: 'adj. + n.' }
  ],
  'ubiquitous': [
    { phrase: 'ubiquitous presence', cn: '普遍存在 / 无处不在的踪影', type: 'adj. + n.' },
    { phrase: 'ubiquitous computing', cn: '普适计算', type: 'adj. + n.' },
    { phrase: 'become ubiquitous', cn: '变得随处可见', type: 'v. + adj.' },
    { phrase: 'ubiquitous influence', cn: '潜移默化的普遍影响', type: 'adj. + n.' }
  ],
  'meticulous': [
    { phrase: 'meticulous planning', cn: '周密细致的规划', type: 'adj. + n.' },
    { phrase: 'meticulous attention to detail', cn: '对细节一丝不苟的关注', type: 'phrase' },
    { phrase: 'meticulous research', cn: '严谨细密的研究调研', type: 'adj. + n.' },
    { phrase: 'meticulously curated', cn: '精心策划挑选的', type: 'adv. + adj.' }
  ],
  'catalyst': [
    { phrase: 'act as a catalyst', cn: '充当催化剂 / 起促进作用', type: 'v. + prep.' },
    { phrase: 'catalyst for change', cn: '变革的催化剂', type: 'n. + prep.' },
    { phrase: 'economic catalyst', cn: '经济增长的助推器', type: 'adj. + n.' },
    { phrase: 'primary catalyst', cn: '主要诱因 / 核心驱动力', type: 'adj. + n.' }
  ],
  'serendipity': [
    { phrase: 'pure serendipity', cn: '纯属机缘巧合 / 意外之喜', type: 'adj. + n.' },
    { phrase: 'serendipitous encounter', cn: '不期而遇 / 奇妙偶遇', type: 'adj. + n.' },
    { phrase: 'a moment of serendipity', cn: '偶得良机的一刻', type: 'phrase' },
    { phrase: 'by happy serendipity', cn: '机缘巧合之下', type: 'phrase' }
  ],
  'sanctuary': [
    { phrase: 'wildlife sanctuary', cn: '野生动物自然保护区', type: 'n. + n.' },
    { phrase: 'find sanctuary', cn: '寻找庇护所 / 寻得心灵净土', type: 'v. + n.' },
    { phrase: 'inner sanctuary', cn: '内心的一隅安宁', type: 'adj. + n.' },
    { phrase: 'bird sanctuary', cn: '鸟类栖息保护区', type: 'n. + n.' }
  ],
  'transient': [
    { phrase: 'transient population', cn: '流动人口 / 暂住人群', type: 'adj. + n.' },
    { phrase: 'transient phenomenon', cn: '短暂现象 / 过渡现象', type: 'adj. + n.' },
    { phrase: 'transient disturbance', cn: '瞬态扰动 / 短暂干扰', type: 'adj. + n.' },
    { phrase: 'transient effects', cn: '暂时性效应', type: 'adj. + n.' }
  ],
  'landscape': [
    { phrase: 'urban landscape', cn: '城市风貌 / 城市景观', type: 'adj. + n.' },
    { phrase: 'political landscape', cn: '政治格局 / 政治版图', type: 'adj. + n.' },
    { phrase: 'scenic landscape', cn: '优美风光', type: 'adj. + n.' },
    { phrase: 'natural landscape', cn: '自然地貌', type: 'adj. + n.' }
  ],
  'botanical': [
    { phrase: 'botanical garden', cn: '植物园', type: 'adj. + n.' },
    { phrase: 'botanical diversity', cn: '植物多样性', type: 'adj. + n.' },
    { phrase: 'botanical research', cn: '植物学研究', type: 'adj. + n.' },
    { phrase: 'botanical revolution', cn: '植物学革命', type: 'adj. + n.' }
  ],
  'pioneers': [
    { phrase: 'ecological pioneers', cn: '生态先锋种群', type: 'adj. + n.' },
    { phrase: 'pioneer species', cn: '先锋物种 (地衣/野草)', type: 'n. + n.' },
    { phrase: 'pioneer in the field', cn: '该领域的先驱', type: 'phrase' },
    { phrase: 'pioneer spirit', cn: '开拓进取精神', type: 'n. + n.' }
  ],
  'curated': [
    { phrase: 'carefully curated', cn: '精心挑选策划的', type: 'adv. + adj.' },
    { phrase: 'curated collection', cn: '精选合辑 / 特选藏品', type: 'adj. + n.' },
    { phrase: 'curated content', cn: '甄选内容', type: 'adj. + n.' },
    { phrase: 'curated exhibition', cn: '精心策展的展览', type: 'adj. + n.' }
  ],
  'underway': [
    { phrase: 'get underway', cn: '开始进行 / 启程', type: 'v. + adj.' },
    { phrase: 'currently underway', cn: '目前正在推进中', type: 'adv. + adj.' },
    { phrase: 'major project is underway', cn: '重大项目正进行中', type: 'sentence' },
    { phrase: 'plans are underway', cn: '计划正逐步展开', type: 'sentence' }
  ],
  'adaptation': [
    { phrase: 'evolutionary adaptation', cn: '演化适应 / 进化适应', type: 'adj. + n.' },
    { phrase: 'climate change adaptation', cn: '气候变化适应策略', type: 'n. + n.' },
    { phrase: 'process of adaptation', cn: '适应过程', type: 'phrase' },
    { phrase: 'rapid adaptation', cn: '快速适应能力', type: 'adj. + n.' }
  ],
  'spontaneous': [
    { phrase: 'spontaneous vegetation', cn: '自生植物 / 自发植被', type: 'adj. + n.' },
    { phrase: 'spontaneous applause', cn: '自发的掌声', type: 'adj. + n.' },
    { phrase: 'spontaneous decision', cn: '一时兴起的决定', type: 'adj. + n.' },
    { phrase: 'spontaneous combustion', cn: '自燃现象', type: 'adj. + n.' }
  ],
  'micro-habitat': [
    { phrase: 'available micro-habitat', cn: '可用微生境 / 局部小生境', type: 'adj. + n.' },
    { phrase: 'urban micro-habitat', cn: '城市微生境', type: 'adj. + n.' },
    { phrase: 'micro-habitat diversity', cn: '微环境多样性', type: 'n. + n.' }
  ],
  'longitudinal': [
    { phrase: 'longitudinal study', cn: '追踪研究 / 纵向研究', type: 'adj. + n.' },
    { phrase: 'longitudinal data', cn: '纵向追踪数据', type: 'adj. + n.' },
    { phrase: 'longitudinal survey', cn: '长期跟踪调查', type: 'adj. + n.' }
  ],
  'divergence': [
    { phrase: 'marked divergence', cn: '显著差异 / 明显分化', type: 'adj. + n.' },
    { phrase: 'evolutionary divergence', cn: '演化分歧 / 进化分化', type: 'adj. + n.' },
    { phrase: 'divergence in opinion', cn: '观点分歧', type: 'phrase' }
  ],
  'impermeable': [
    { phrase: 'impermeable surface', cn: '不透水表面 / 防渗地面', type: 'adj. + n.' },
    { phrase: 'impermeable asphalt', cn: '不透水沥青路面', type: 'adj. + n.' },
    { phrase: 'impermeable barrier', cn: '防渗屏障 / 不渗透层', type: 'adj. + n.' }
  ],
  'biodiverse': [
    { phrase: 'biodiverse ecosystem', cn: '生物多样性丰富的生态系统', type: 'adj. + n.' },
    { phrase: 'biodiverse urban future', cn: '具生物多样性的城市未来', type: 'adj. + n.' },
    { phrase: 'biodiverse habitat', cn: '富有多样性的生境', type: 'adj. + n.' }
  ],
  'dispersal': [
    { phrase: 'seed dispersal', cn: '种子传播 / 散播机制', type: 'n. + n.' },
    { phrase: 'botanical dispersal', cn: '植物散播', type: 'adj. + n.' },
    { phrase: 'dispersal mechanisms', cn: '散播机制 / 传播途径', type: 'n. + n.' }
  ],
  'opportunists': [
    { phrase: 'resilient opportunists', cn: '生命力顽强的机会主义物种', type: 'adj. + n.' },
    { phrase: 'ecological opportunists', cn: '生态机会主义种群', type: 'adj. + n.' },
    { phrase: 'opportunistic species', cn: '机会主义物种', type: 'adj. + n.' }
  ],
  'fluctuations': [
    { phrase: 'temperature fluctuations', cn: '温度波动 / 温差起伏', type: 'n. + n.' },
    { phrase: 'sharp fluctuations', cn: '剧烈波动', type: 'adj. + n.' },
    { phrase: 'seasonal fluctuations', cn: '季节性起伏', type: 'adj. + n.' }
  ],
  'solitude': [
    { phrase: 'quiet solitude', cn: '静谧的独处 / 幽静的独处时光', type: 'adj. + n.' },
    { phrase: 'seek solitude', cn: '寻求清静 / 享受独处', type: 'v. + n.' },
    { phrase: 'urban solitude', cn: '都市清欢 / 城市独处', type: 'adj. + n.' }
  ],
  'aesthetic': [
    { phrase: 'aesthetic appeal', cn: '审美吸引力 / 美感', type: 'adj. + n.' },
    { phrase: 'minimalist aesthetic', cn: '极简主义美学', type: 'adj. + n.' },
    { phrase: 'aesthetic value', cn: '美学价值', type: 'adj. + n.' }
  ],
  'give': [
    { phrase: 'give up', cn: '放弃 / 投降', type: 'v. + prep.' },
    { phrase: 'give in', cn: '屈服 / 让步', type: 'v. + prep.' },
    { phrase: 'give rise to', cn: '引起 / 导致', type: 'phrase' },
    { phrase: 'give a hand', cn: '施以援手 / 帮助', type: 'phrase' }
  ],
  'give up': [
    { phrase: 'never give up', cn: '永不放弃 / 坚韧不拔', type: 'phrase' },
    { phrase: 'give up hope', cn: '放弃希望', type: 'v. + n.' },
    { phrase: 'give up easily', cn: '轻易放弃', type: 'v. + adv.' }
  ],
  'gotta': [
    { phrase: 'gotta go', cn: '得走了 / 必须出发', type: 'phrase' },
    { phrase: 'gotta do', cn: '必须做 / 得完成', type: 'phrase' },
    { phrase: 'you gotta be kidding', cn: '你一定是在开玩笑', type: 'phrase' }
  ],
  'time': [
    { phrase: 'in no time', cn: '转眼间 / 马上', type: 'phrase' },
    { phrase: 'time flies', cn: '时光飞逝', type: 'phrase' },
    { phrase: 'precious time', cn: '宝贵时光', type: 'adj. + n.' },
    { phrase: 'over time', cn: '随着时间的推移', type: 'phrase' }
  ],
  'heart': [
    { phrase: 'by heart', cn: '熟记 / 牢记于心', type: 'phrase' },
    { phrase: 'warm heart', cn: '热忱之心 / 善良', type: 'adj. + n.' },
    { phrase: 'heart and soul', cn: '全心全意', type: 'phrase' }
  ],
  'melody': [
    { phrase: 'haunting melody', cn: '余音绕梁的旋律 / 萦绕心头的曲调', type: 'adj. + n.' },
    { phrase: 'catchy melody', cn: '朗朗上口的旋律', type: 'adj. + n.' },
    { phrase: 'sweet melody', cn: '悦耳动听的曲调', type: 'adj. + n.' }
  ],
  'night': [
    { phrase: 'midnight hours', cn: '子夜时分', type: 'n. + n.' },
    { phrase: 'starry night', cn: '繁星之夜', type: 'adj. + n.' },
    { phrase: 'all night long', cn: '整夜 / 通宵达旦', type: 'phrase' },
    { phrase: 'obsidian night', cn: '深邃黑夜 / 清冷暗夜', type: 'adj. + n.' }
  ],
  'solitary': [
    { phrase: 'solitary figure', cn: '独行的身影 / 孤独的身影', type: 'adj. + n.' },
    { phrase: 'solitary confinement', cn: '单独监禁 / 独处', type: 'adj. + n.' },
    { phrase: 'solitary life', cn: '深居简出的隐逸生活', type: 'adj. + n.' },
    { phrase: 'solitary flight', cn: '独行航程 / 孤独飞翔', type: 'adj. + n.' }
  ],
  'ancient': [
    { phrase: 'ancient stone', cn: '古老的石阶 / 远古石碑', type: 'adj. + n.' },
    { phrase: 'ancient civilization', cn: '古代文明 / 远古文明', type: 'adj. + n.' },
    { phrase: 'ancient history', cn: '古代历史 / 悠久往事', type: 'adj. + n.' },
    { phrase: 'ancient ruins', cn: '古代遗迹 / 历史废墟', type: 'adj. + n.' },
    { phrase: 'ancient wisdom', cn: '古老智慧 / 先人哲思', type: 'adj. + n.' }
  ],
  'stone': [
    { phrase: 'stepping stone', cn: '垫脚石 / 进阶基石', type: 'n. + n.' },
    { phrase: 'set in stone', cn: '板上钉钉 / 不可更改', type: 'phrase' },
    { phrase: 'carved in stone', cn: '铭刻于石 / 永恒铭记', type: 'phrase' },
    { phrase: 'precious stone', cn: '珍贵宝石 / 矿石', type: 'adj. + n.' },
    { phrase: 'stone age', cn: '石器时代', type: 'n. + n.' },
    { phrase: 'ancient stone', cn: '古老的石阶 / 远古石碑', type: 'adj. + n.' }
  ],
  'shadow': [
    { phrase: 'cast a shadow', cn: '投下阴影 / 蒙上阴影', type: 'v. + n.' },
    { phrase: 'shadow of doubt', cn: '一丝疑虑 / 疑云', type: 'n. + prep.' },
    { phrase: 'transient shadows', cn: '转瞬即逝的光影', type: 'adj. + n.' },
    { phrase: 'in the shadows', cn: '在暗处 / 处于幕后', type: 'prep. + n.' }
  ],
  'shadows': [
    { phrase: 'transient shadows', cn: '转瞬即逝的光影 / 残影', type: 'adj. + n.' },
    { phrase: 'midnight shadows', cn: '子夜暗影 / 夜幕幻影', type: 'n. + n.' },
    { phrase: 'lengthening shadows', cn: '渐渐拉长的斜影', type: 'adj. + n.' }
  ],
  'mist': [
    { phrase: 'morning mist', cn: '晨曦薄雾', type: 'n. + n.' },
    { phrase: 'twilight mist', cn: '薄暮迷雾 / 黄昏烟雨', type: 'n. + n.' },
    { phrase: 'shrouded in mist', cn: '笼罩在迷雾中', type: 'phrase' },
    { phrase: 'gentle mist', cn: '如丝细雨 / 朦胧轻雾', type: 'adj. + n.' }
  ],
  'light': [
    { phrase: 'morning light', cn: '晨曦晨光', type: 'n. + n.' },
    { phrase: 'shed light on', cn: '阐明 / 揭示真相', type: 'phrase' },
    { phrase: 'in light of', cn: '鉴于 / 考虑到', type: 'prep. phrase' },
    { phrase: 'first light of dawn', cn: '破晓的第一道曙光', type: 'phrase' }
  ],
  'whisper': [
    { phrase: 'whisper of serenity', cn: '宁静的低语', type: 'n. + prep.' },
    { phrase: 'soft whisper', cn: '轻声耳语', type: 'adj. + n.' },
    { phrase: 'whisper of hope', cn: '希望的呢喃', type: 'n. + prep.' }
  ],
  'breeze': [
    { phrase: 'jasmine breeze', cn: '茉莉微风', type: 'n. + n.' },
    { phrase: 'gentle breeze', cn: '和煦微风', type: 'adj. + n.' },
    { phrase: 'breeze through', cn: '轻松搞定 / 一路畅通', type: 'v. + prep.' }
  ],
  'echo': [
    { phrase: 'echo in the mind', cn: '在脑海中回响', type: 'phrase' },
    { phrase: 'distant echoes', cn: '遥远的回声 / 往昔回响', type: 'adj. + n.' },
    { phrase: 'echo of dawn', cn: '黎明之响', type: 'n. + prep.' },
    { phrase: 'ubiquitous echoes', cn: '无处不在的回声', type: 'adj. + n.' }
  ],
  'echoes': [
    { phrase: 'distant echoes', cn: '遥远的回声 / 往昔回响', type: 'adj. + n.' },
    { phrase: 'ubiquitous echoes', cn: '无处不在的回响', type: 'adj. + n.' },
    { phrase: 'echoes of dawn', cn: '黎明的回声', type: 'n. + prep.' }
  ],
  'spark': [
    { phrase: 'luminous spark', cn: '璀璨火花 / 明亮光华', type: 'adj. + n.' },
    { phrase: 'spark of creativity', cn: '创意的火花', type: 'n. + prep.' },
    { phrase: 'spark an interest', cn: '激发兴趣', type: 'v. + n.' }
  ],
  'tide': [
    { phrase: 'morning tide', cn: '晨潮 / 清晨浪潮', type: 'n. + n.' },
    { phrase: 'turn the tide', cn: '力挽狂澜 / 扭转局势', type: 'v. + n.' },
    { phrase: 'rising tide', cn: '不断上涨的浪潮', type: 'adj. + n.' }
  ],
  'coexist': [
    { phrase: 'peacefully coexist', cn: '和平共处 / 宁静共存', type: 'adv. + v.' },
    { phrase: 'coexist harmoniously', cn: '和谐共生', type: 'v. + adv.' },
    { phrase: 'diverse species coexist', cn: '多元物种共同栖息', type: 'sentence' }
  ],
  'diverse': [
    { phrase: 'diverse perspectives', cn: '多元视角', type: 'adj. + n.' },
    { phrase: 'culturally diverse', cn: '文化多元的', type: 'adv. + adj.' },
    { phrase: 'diverse ecosystem', cn: '多样的生态系统', type: 'adj. + n.' }
  ],
  'harmony': [
    { phrase: 'live in harmony', cn: '和睦相处 / 融洽生活', type: 'v. + prep.' },
    { phrase: 'peaceful harmony', cn: '祥和与安宁', type: 'adj. + n.' },
    { phrase: 'harmony and balance', cn: '和谐与平衡', type: 'phrase' }
  ],
  'radiance': [
    { phrase: 'radiance of dawn', cn: '黎明光芒', type: 'n. + prep.' },
    { phrase: 'inner radiance', cn: '内在的光华', type: 'adj. + n.' },
    { phrase: 'glow with radiance', cn: '容光焕发 / 熠熠生辉', type: 'v. + prep.' }
  ],
  'journey': [
    { phrase: 'serene journey', cn: '静谧的旅程', type: 'adj. + n.' },
    { phrase: 'journey of discovery', cn: '探索之旅', type: 'n. + prep.' },
    { phrase: 'embark on a journey', cn: '踏上征程 / 开启旅途', type: 'v. + prep.' }
  ],
  'silence': [
    { phrase: 'break the silence', cn: '打破沉默', type: 'v. + n.' },
    { phrase: 'silent space', cn: '宁静的空间', type: 'adj. + n.' },
    { phrase: 'moment of silence', cn: '静默片刻', type: 'phrase' }
  ],
  'memory': [
    { phrase: 'meticulous memories', cn: '细致入微的回忆', type: 'adj. + n.' },
    { phrase: 'cherish the memory', cn: '珍藏回忆', type: 'v. + n.' },
    { phrase: 'vivid memory', cn: '历历在目的记忆', type: 'adj. + n.' }
  ],
  'dream': [
    { phrase: 'fleeting dreams', cn: '浮光掠影的梦想 / 飘忽之梦', type: 'adj. + n.' },
    { phrase: 'pursue a dream', cn: '追逐梦想', type: 'v. + n.' },
    { phrase: 'dream come true', cn: '美梦成真', type: 'phrase' }
  ],
  'pulse': [
    { phrase: 'pulse of tranquility', cn: '宁静与舒缓的脉动', type: 'n. + prep.' },
    { phrase: 'pulse of life', cn: '生命脉动', type: 'n. + prep.' },
    { phrase: 'rapid pulse', cn: '急促脉搏', type: 'adj. + n.' }
  ],
  'oasis': [
    { phrase: 'peaceful oasis', cn: '宁静绿洲 / 避世港湾', type: 'adj. + n.' },
    { phrase: 'urban oasis', cn: '城市绿洲', type: 'adj. + n.' },
    { phrase: 'oasis of calm', cn: '静谧之所', type: 'n. + prep.' }
  ],
  'flight': [
    { phrase: 'solitary flight', cn: '独行的航程 / 沉静之旅', type: 'adj. + n.' },
    { phrase: 'in flight', cn: '在飞行中 / 飞行状态', type: 'phrase' },
    { phrase: 'flight of imagination', cn: '想象力驰骋', type: 'n. + prep.' }
  ],
  'steps': [
    { phrase: 'meticulous steps', cn: '审慎漫步 / 细致步履', type: 'adj. + n.' },
    { phrase: 'guiding our steps', cn: '指引我们的脚步', type: 'v. + n.' },
    { phrase: 'take steps', cn: '采取步骤 / 迈出脚步', type: 'v. + n.' }
  ],
  'sky': [
    { phrase: 'velvet sky', cn: '丝绒夜空 / 深邃穹顶', type: 'adj. + n.' },
    { phrase: 'clear sky', cn: '万里晴空', type: 'adj. + n.' },
    { phrase: 'reach for the sky', cn: '志存高远', type: 'phrase' }
  ],
  'soul': [
    { phrase: 'deep within the soul', cn: '在心灵深处', type: 'phrase' },
    { phrase: 'heart and soul', cn: '全心全意', type: 'phrase' },
    { phrase: 'kindred soul', cn: '契合的灵魂 / 知己', type: 'adj. + n.' }
  ],
  'wisdom': [
    { phrase: 'awaken wisdom', cn: '唤醒智慧', type: 'v. + n.' },
    { phrase: 'ancient wisdom', cn: '古老智慧', type: 'adj. + n.' },
    { phrase: 'words of wisdom', cn: '智慧金句', type: 'n. + prep.' }
  ],
  'reality': [
    { phrase: 'shared reality', cn: '共同真切经历 / 共同现实', type: 'adj. + n.' },
    { phrase: 'face reality', cn: '面对现实', type: 'v. + n.' },
    { phrase: 'in reality', cn: '实际上 / 事实上', type: 'phrase' }
  ],
  'let down': [
    { phrase: 'never let you down', cn: '绝不让你失望 / 永不辜负', type: 'phrase' },
    { phrase: 'feel let down', cn: '感到失望', type: 'v. + adj.' },
    { phrase: 'let someone down easily', cn: '委婉拒绝某人', type: 'phrase' }
  ],
  'tell a lie': [
    { phrase: 'never tell a lie', cn: '绝不说谎', type: 'phrase' },
    { phrase: 'tell a white lie', cn: '善意的谎言', type: 'phrase' },
    { phrase: 'tell the truth', cn: '说出真相', type: 'phrase' }
  ],
  'say goodbye': [
    { phrase: 'never say goodbye', cn: '永不说再见', type: 'phrase' },
    { phrase: 'time to say goodbye', cn: '告别的时刻', type: 'phrase' },
    { phrase: 'wave goodbye', cn: '挥手告别', type: 'v. + n.' }
  ],
  'run around': [
    { phrase: 'run around the city', cn: '在城市中东奔西跑', type: 'phrase' },
    { phrase: 'stop running around', cn: '别再到处瞎忙了', type: 'phrase' }
  ]
};

/**
 * Gets high quality collocations for a single word or multi-word phrase
 */
export function getCollocationsForWord(word?: string | null): CollocationItem[] {
  if (!word || typeof word !== 'string') return [];
  const clean = word.toLowerCase().replace(/^[“"‘'(\[{]+|[”"’')\]},.!?;:]+$/g, '').trim();
  if (!clean) return [];

  // 1. Direct exact match in dictionary
  if (VOCAB_COLLOCATIONS[clean] && VOCAB_COLLOCATIONS[clean].length > 0) {
    return VOCAB_COLLOCATIONS[clean];
  }

  // 2. Lemmatized stem matches for single words (e.g. stones -> stone, shadows -> shadow, echoes -> echo)
  const baseKey = clean.replace(/(?:ing|ed|es|s)$/i, '');
  if (VOCAB_COLLOCATIONS[baseKey] && VOCAB_COLLOCATIONS[baseKey].length > 0) {
    return VOCAB_COLLOCATIONS[baseKey];
  }

  // 3. Smart Multi-Word Phrase Decomposition:
  // If the user selected a phrase like "the ancient stone" or "you gotta give up":
  // Extract key content words and assemble their high-value collocations!
  if (clean.includes(' ')) {
    const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'of', 'to', 'for', 'with', 'by', 'from', 'into', 'and', 'or', 'but', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'this', 'that', 'these', 'those', 'it', 'its']);
    
    // Sub-phrase checks (e.g. "give up" inside "you gotta give up", "ancient stone" inside "the ancient stone")
    const words = clean.split(/\s+/).filter(Boolean);
    const combinedCollocs: CollocationItem[] = [];
    const seenPhrases = new Set<string>();

    // Check multi-word sub-phrases (e.g., "give up", "let down", "ancient stone")
    for (let len = Math.min(3, words.length); len >= 2; len--) {
      for (let i = 0; i <= words.length - len; i++) {
        const subPhrase = words.slice(i, i + len).join(' ');
        if (VOCAB_COLLOCATIONS[subPhrase]) {
          for (const item of VOCAB_COLLOCATIONS[subPhrase]) {
            if (!seenPhrases.has(item.phrase.toLowerCase())) {
              seenPhrases.add(item.phrase.toLowerCase());
              combinedCollocs.push(item);
            }
          }
        }
      }
    }

    // Check individual content words
    const contentWords = words.filter(w => !stopWords.has(w));
    for (const cw of contentWords) {
      const cwKey = VOCAB_COLLOCATIONS[cw] ? cw : cw.replace(/(?:ing|ed|es|s)$/i, '');
      if (VOCAB_COLLOCATIONS[cwKey]) {
        for (const item of VOCAB_COLLOCATIONS[cwKey]) {
          if (!seenPhrases.has(item.phrase.toLowerCase())) {
            seenPhrases.add(item.phrase.toLowerCase());
            combinedCollocs.push(item);
          }
        }
      }
    }

    if (combinedCollocs.length > 0) {
      return combinedCollocs.slice(0, 6);
    }
  }

  // 4. Guaranteed high-utility default collocations for any custom word
  return [
    { phrase: `${clean} in context`, cn: `在当前语境中的核心用法`, type: 'phrase' },
    { phrase: `essential ${clean}`, cn: `关键的核心考点表达`, type: 'adj. + n.' },
    { phrase: `explore ${clean}`, cn: `深入探究与理解`, type: 'v. + n.' }
  ];
}

/**
 * Parses definitionCn into structured multi-POS lines
 * e.g. "混凝土；具体的，有形的" or "n. 混凝土 adj. 具体的"
 */
export interface StructuredPosDef {
  index: number;
  pos?: string;
  text: string;
}

export function parseStructuredDefinitions(defCn: string, partOfSpeech?: string): StructuredPosDef[] {
  if (!defCn) return [];

  // If definition has explicit semicolons or POS indicators (n. / adj. / v. / adv.)
  const posRegex = /(?:(\d+[\.、]\s*)?(n\.|adj\.|v\.|adv\.|prep\.|pron\.|conj\.|art\.|int\.|num\.|vt\.|vi\.)\s*([^;；\n]+))/gi;
  const matches: StructuredPosDef[] = [];
  let match;

  while ((match = posRegex.exec(defCn)) !== null) {
    matches.push({
      index: matches.length + 1,
      pos: match[2].trim(),
      text: match[3].trim().replace(/^[;；,，\s]+|[;；,，\s]+$/g, '')
    });
  }

  if (matches.length > 1) {
    return matches;
  }

  // If definition is separated by Chinese or English semicolons
  const semiSplit = defCn.split(/[;；]/).map(s => s.trim()).filter(Boolean);
  if (semiSplit.length > 1) {
    const posTokens = (partOfSpeech || '')
      .split(/[/、,]/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return semiSplit.map((defText, idx) => {
      let derivedPos = '';
      if (posTokens[idx]) {
        derivedPos = posTokens[idx];
      } else if (defText.match(/^(n\.|adj\.|v\.|adv\.)/i)) {
        const m = defText.match(/^(n\.|adj\.|v\.|adv\.)\s*/i);
        if (m) {
          derivedPos = m[1];
          defText = defText.substring(m[0].length);
        }
      }
      return {
        index: idx + 1,
        pos: derivedPos || (idx === 0 && partOfSpeech && !partOfSpeech.includes('/') ? partOfSpeech : undefined),
        text: defText
      };
    });
  }

  // Default single definition
  return [
    {
      index: 1,
      pos: partOfSpeech ? partOfSpeech.split(' ')[0] : undefined,
      text: defCn
    }
  ];
}
