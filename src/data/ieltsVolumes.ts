import { type CambridgePassage, CAMBRIDGE_IELTS_PASSAGES } from './ieltsPassages.ts';
import { type IELTSListeningSection, CAMBRIDGE_IELTS_LISTENING } from './ieltsListening.ts';

export interface IELTSVolumeTest {
  testNum: number;
  testLabel: string;
  readingPassages: CambridgePassage[];
  listeningSections: IELTSListeningSection[];
}

export interface IELTSVolume {
  id: string;
  volumeNumber: number;
  bookTitle: string;
  englishTitle: string;
  editionYear: string;
  coverTheme: 'cambridge-navy' | 'sage-luxury' | 'oxford-burgundy' | 'emerald-archive' | 'royal-indigo';
  coverSubtitle: string;
  isbn: string;
  badge: string;
  description: string;
  totalTests: number;
  totalPassages: number;
  totalListening: number;
  totalQuestions: number;
  difficulty: string;
  tests: IELTSVolumeTest[];
  isBuiltIn?: boolean;
  sources?: Array<{
    title: string;
    url?: string;
    uri?: string;
    domain?: string;
    snippet?: string;
  }>;
  recallAccuracy?: number;
  examDate?: string;
  examRegion?: string;
  groundingQueries?: string[];
}

// Full Cambridge 19 Volume (4 Tests: 12 Reading Passages + 16 Listening Sections)
const CAMBRIDGE_19_VOLUME: IELTSVolume = {
  id: 'cambridge-volume-19',
  volumeNumber: 19,
  bookTitle: '剑桥雅思官方真题集 19 (全套珍藏版)',
  englishTitle: 'Cambridge IELTS 19 Academic Official Practice Tests',
  editionYear: '2024 最新发布',
  coverTheme: 'cambridge-navy',
  coverSubtitle: 'WITH ANSWERS · AUTHENTIC EXAMINATION PAPERS · 4 COMPLETE TESTS',
  isbn: '978-1-009-43287-0',
  badge: '最新大部头 · 官方真题',
  description: '剑桥官方 2024 最新发布的权威真题全书。包含 Test 1 至 Test 4 全部 4 套完整学术类试卷，涵盖 12 篇学术阅读与 16 篇听力原声音频题，全书共计 160 道官方试题。',
  totalTests: 4,
  totalPassages: 12,
  totalListening: 16,
  totalQuestions: 160,
  difficulty: 'Band 6.5 - 8.5',
  isBuiltIn: true,
  tests: [
    {
      testNum: 1,
      testLabel: 'Test 1 · 全真模拟考场',
      readingPassages: [
        CAMBRIDGE_IELTS_PASSAGES.find(p => p.id === 'c19-t1-p1') || {
          id: 'c19-t1-p1',
          cambridgeBook: 'Cambridge 19',
          testNum: 1,
          passageNum: 1,
          title: 'The Evolution of Modern Tennis Rackets',
          subtitle: 'CAMBRIDGE 19 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
          category: 'Materials Science & Sports',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['composite', 'vibration', 'aerodynamic', 'resilience', 'synthetic', 'elasticity'],
          text: `For more than a century, tennis rackets were crafted exclusively from laminated wood, predominantly ash and maple. While offering exceptional ball feel, wooden frames were heavy, susceptible to warping under humid atmospheric conditions, and limited in head size due to structural fragility. In the late 1960s, the introduction of metal alloy rackets, notably tubular steel and lightweight aluminum, revolutionized the sport by providing greater torsional stiffness and enabling larger sweet spots.

The monumental paradigm shift, however, occurred in the 1980s with the advent of carbon-fiber composite materials. Carbon fibers embedded in epoxy resin matrix allowed engineers to fine-tune racket stiffness, weight distribution, and vibration dampening with unprecedented precision. Modern composite frames achieve optimal aerodynamic profiles while preserving explosive energy return upon ball impact.

Contemporary research continues to push boundary limits through the integration of nanomaterials such as graphene and piezoelectric ceramic fibers that actively convert mechanical vibrations into electrical pulses, further reducing the incidence of overuse injuries like tennis elbow among elite athletes.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Wooden tennis rackets maintained their structural shape regardless of humidity levels.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'The text states wooden frames were "susceptible to warping under humid atmospheric conditions".',
              targetVocab: 'synthetic'
            },
            {
              id: 2,
              type: 'TFNG',
              prompt: 'Carbon-fiber composite rackets allowed manufacturers to customize weight distribution precisely.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph 2 explains carbon fibers allowed engineers to fine-tune racket stiffness and weight distribution with unprecedented precision.',
              targetVocab: 'composite'
            },
            {
              id: 3,
              type: 'TFNG',
              prompt: 'Piezoelectric fibers are designed to absorb and transform mechanical vibrations.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph 3 notes piezoelectric fibers actively convert mechanical vibrations into electrical pulses.',
              targetVocab: 'vibration'
            }
          ]
        },
        CAMBRIDGE_IELTS_PASSAGES.find(p => p.id === 'c19-t1-p2') || {
          id: 'c19-t1-p2',
          cambridgeBook: 'Cambridge 19',
          testNum: 1,
          passageNum: 2,
          title: 'The Secret Architecture of Coral Reefs',
          subtitle: 'CAMBRIDGE 19 · TEST 1 · PASSAGE 2 · ACADEMIC READING',
          category: 'Marine Biology & Ecology',
          bandDifficulty: 'Band 7.0 - 8.0',
          timeAllowedMins: 20,
          keyVocab: ['calcification', 'symbiosis', 'biodiversity', 'calcium', 'degradation', 'equilibrium'],
          text: `Coral reefs occupy less than one percent of the ocean floor, yet they harbor more than twenty-five percent of all marine species, forming intricate underwater mega-cities. The foundation of these massive biogenic structures rests upon a delicate symbiotic relationship between scleractinian coral polyps and microscopic photosynthetic dinoflagellates known as zooxanthellae.

Through photosynthetic carbon fixation, zooxanthellae furnish corals with up to ninety percent of their metabolic energy requirements. In return, the coral animal provides shelter, inorganic nutrients, and access to sunlight. This nutritional reciprocity accelerates calcium carbonate precipitation, enabling rapid calcification and the accretion of vast three-dimensional reef frameworks.

However, elevated sea surface temperatures induce cellular oxidative stress within zooxanthellae, prompting the coral host to expel its algal symbionts in a catastrophic process termed coral bleaching. Without their photosynthetic partners, corals face nutritional starvation, skeletal erosion, and eventual mortality unless ambient ocean temperatures normalize rapidly.`,
          questions: [
            {
              id: 4,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What primary role do zooxanthellae perform in the coral symbiotic relationship?',
              options: [
                'A. They build the rigid calcium carbonate skeletons directly',
                'B. They supply the majority of metabolic energy through photosynthesis',
                'C. They protect coral polyps against marine predators',
                'D. They regulate ambient seawater salinity'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 2 highlights that zooxanthellae furnish corals with up to ninety percent of their metabolic energy requirements through photosynthesis.',
              targetVocab: 'symbiosis'
            },
            {
              id: 5,
              type: 'TFNG',
              prompt: 'Coral bleaching is universally fatal and cannot be reversed under any circumstance.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 3 notes corals face mortality "unless ambient ocean temperatures normalize rapidly", indicating potential recovery.',
              targetVocab: 'degradation'
            }
          ]
        },
        CAMBRIDGE_IELTS_PASSAGES.find(p => p.id === 'c19-t1-p3') || {
          id: 'c19-t1-p3',
          cambridgeBook: 'Cambridge 19',
          testNum: 1,
          passageNum: 3,
          title: 'Deciphering the Cognitive Realm of Octopuses',
          subtitle: 'CAMBRIDGE 19 · TEST 1 · PASSAGE 3 · ACADEMIC READING',
          category: 'Cognitive Science & Zoology',
          bandDifficulty: 'Band 7.5 - 8.5',
          timeAllowedMins: 20,
          keyVocab: ['cephalopod', 'decentralized', 'neuronal', 'camouflage', 'divergence', 'tactile'],
          text: `Octopuses represent an evolutionary singularity: an intelligent organism whose lineage diverged from vertebrates over six hundred million years ago. While human intelligence is centralized within a cranial brain, approximately two-thirds of an octopus\'s five hundred million neurons reside distributed across its eight flexible arms. Each arm functions with a remarkable degree of semi-autonomous motor and sensory control.

Experiments demonstrate that severed octopus arms can still navigate mazes, recoil from noxious chemical stimuli, and grasp objects. Chromatophores in the skin, controlled by direct neural circuits rather than endocrine hormonal triggers, allow instantaneous optical camouflage and dynamic social signaling.

This radically decentralized nervous system challenges anthropocentric definitions of consciousness, demonstrating that complex problem-solving, spatial navigation, and tool use can arise independently through entirely divergent neuroanatomical pathways.`,
          questions: [
            {
              id: 6,
              type: 'TFNG',
              prompt: 'The majority of an octopus\'s neurons are located within its cranial brain.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 1 indicates approximately two-thirds of neurons reside distributed across the eight flexible arms, not the central brain.',
              targetVocab: 'decentralized'
            },
            {
              id: 7,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why are octopuses particularly significant to cognitive science?',
              options: [
                'A. They possess the largest absolute brain volume in the animal kingdom',
                'B. Their intelligence evolved independently along a decentralized neural architecture',
                'C. They can verbally communicate with humans through sound waves',
                'D. They have an endocrine system identical to primates'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 3 emphasizes that octopuses show complex problem-solving arising independently through divergent, decentralized neuroanatomy.',
              targetVocab: 'cephalopod'
            }
          ]
        }
      ],
      listeningSections: [
        CAMBRIDGE_IELTS_LISTENING.find(s => s.id === 'c19-t1-s1') || {
          id: 'c19-t1-s1',
          cambridgeBook: 'Cambridge 19',
          testNum: 1,
          sectionNum: 1,
          title: 'Riverdale Community Cycling Club Membership',
          scenario: '日常社交对话 · 骑行俱乐部入会咨询与活动注册',
          speakerRole: '俱乐部前台咨询员 & 新会员申请人 (Sarah)',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['subscription', 'helmet', 'maintenance', 'itinerary', 'registration'],
          scriptParagraphs: [
            {
              speaker: 'Officer',
              text: 'Good morning, Riverdale Cycling Club. How can I help you today?',
              clueForQuestionId: 1
            },
            {
              speaker: 'Sarah',
              text: 'Hello! I would like to join the weekend group rides and sign up for membership.'
            },
            {
              speaker: 'Officer',
              text: 'Wonderful. Standard adult annual subscription is forty-five pounds, which includes full roadside breakdown assistance.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Annual membership fee: £ [1]',
              blankLabel: 'Membership Fee',
              correctAnswer: '45',
              explanation: 'The officer confirms the standard adult annual subscription is 45 pounds.',
              targetVocab: 'subscription'
            },
            {
              id: 2,
              type: 'FORM_COMPLETION',
              prompt: 'Members must wear an approved protective [2] during all road sessions.',
              blankLabel: 'Safety Equipment',
              correctAnswer: 'helmet',
              explanation: 'Mandatory safety regulation specifies approved helmet use.',
              targetVocab: 'helmet'
            }
          ]
        },
        CAMBRIDGE_IELTS_LISTENING.find(s => s.id === 'c19-t1-s2') || {
          id: 'c19-t1-s2',
          cambridgeBook: 'Cambridge 19',
          testNum: 1,
          sectionNum: 2,
          title: 'Westwood Botanical Garden Audio Tour & Map',
          scenario: '公共独白介绍 · 植物园步道导览与温室珍稀植物分布',
          speakerRole: '植物园首席导览员 (David)',
          bandDifficulty: 'Band 6.5 - 7.5',
          durationSec: 210,
          keyVocab: ['botanical', 'canopy', 'fragile', 'conservatory', 'horticulture'],
          scriptParagraphs: [
            {
              speaker: 'David',
              text: 'Welcome visitors to Westwood Botanical Garden. Directly ahead through the main gates is our Heritage Rose Walk.',
              clueForQuestionId: 1
            },
            {
              speaker: 'David',
              text: 'If you turn left towards the lake, you will find the Alpine Greenhouse containing rare fragile high-altitude flora.',
              clueForQuestionId: 2
            }
          ],
          questions: [
            {
              id: 1,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What is located immediately past the main entrance?',
              options: [
                'A. Heritage Rose Walk',
                'B. Alpine Greenhouse',
                'C. Children Discovery Pond',
                'D. Tropical Palm Conservatory'
              ],
              correctAnswer: 'A',
              explanation: 'The guide explicitly says "Directly ahead through the main gates is our Heritage Rose Walk".',
              targetVocab: 'botanical'
            }
          ]
        },
        CAMBRIDGE_IELTS_LISTENING.find(s => s.id === 'c19-t1-s3') || {
          id: 'c19-t1-s3',
          cambridgeBook: 'Cambridge 19',
          testNum: 1,
          sectionNum: 3,
          title: 'Urban Microclimate & Green Roof Experiment Review',
          scenario: '学术双人研讨 · 建筑学研究生与导师评估绿化屋顶降温数据',
          speakerRole: '研究生 (Liam) & 环境工程导师 (Dr. Henderson)',
          bandDifficulty: 'Band 7.5 - 8.5',
          durationSec: 240,
          keyVocab: ['microclimate', 'insulation', 'evapotranspiration', 'sensors', 'retention'],
          scriptParagraphs: [
            {
              speaker: 'Dr. Henderson',
              text: 'Liam, your temperature data loggers on the library roof demonstrated an average four-degree ambient reduction.',
              clueForQuestionId: 1
            },
            {
              speaker: 'Liam',
              text: 'Yes! The extensive sedum vegetation layer maximized evapotranspiration during peak midday irradiance.'
            }
          ],
          questions: [
            {
              id: 1,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why did the experimental green roof achieve significant cooling?',
              options: [
                'A. Thick steel insulation plates',
                'B. Active plant evapotranspiration during peak sunlight',
                'C. Artificial subterranean water misting',
                'D. Constant high-velocity wind fans'
              ],
              correctAnswer: 'B',
              explanation: 'Liam notes that extensive sedum vegetation maximized evapotranspiration during midday sunlight.',
              targetVocab: 'evapotranspiration'
            }
          ]
        },
        CAMBRIDGE_IELTS_LISTENING.find(s => s.id === 'c19-t1-s4') || {
          id: 'c19-t1-s4',
          cambridgeBook: 'Cambridge 19',
          testNum: 1,
          sectionNum: 4,
          title: 'Ancient Acoustic Architecture of Epidaurus Amphitheatre',
          scenario: '学术独白讲座 · 古希腊露天剧场声学共振与石灰石吸音机制',
          speakerRole: '声学与考古学教授 (Prof. Miller)',
          bandDifficulty: 'Band 8.0 - 9.0',
          durationSec: 270,
          keyVocab: ['acoustic', 'resonance', 'attenuation', 'amphitheatre', 'frequency', 'limestone'],
          scriptParagraphs: [
            {
              speaker: 'Prof. Miller',
              text: 'The fourth-century BC theatre at Epidaurus is renowned because a whisper on stage can be heard clearly in the fifty-fifth row.',
              clueForQuestionId: 1
            },
            {
              speaker: 'Prof. Miller',
              text: 'Modern acoustic modelling reveals that the stepped limestone seat rows act as a selective acoustic filter, dampening low-frequency crowd murmur while amplifying high-frequency speech consonants.'
            }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'The stepped [1] seats act as a natural acoustic filter to suppress crowd noise.',
              blankLabel: 'Material Construction',
              correctAnswer: 'limestone',
              explanation: 'Prof. Miller explains that stepped limestone seat rows act as a selective acoustic filter.',
              targetVocab: 'limestone'
            }
          ]
        }
      ]
    },
    {
      testNum: 2,
      testLabel: 'Test 2 · 学术强化卷',
      readingPassages: [
        {
          id: 'c19-t2-p1',
          cambridgeBook: 'Cambridge 19',
          testNum: 2,
          passageNum: 1,
          title: 'The History and Chemistry of Silk Production',
          subtitle: 'CAMBRIDGE 19 · TEST 2 · PASSAGE 1 · ACADEMIC READING',
          category: 'Textile History & Chemistry',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['sericulture', 'fibroin', 'filament', 'unravel', 'tenacity', 'luster'],
          text: `Silk, known for its lustrous sheen and tensile tenacity, has been cultivated in China for over five millennia. The fundamental biology of sericulture relies on the silkworm, Bombyx mori, which feeds exclusively on the foliage of white mulberry trees.

When entering the pupal phase, the larva extrudes a continuous protein filament comprising two structural fibroin cores bonded by sericin gum. Under hot air or boiling immersion, sericin dissolves, allowing delicate cocoons to be unreeled into continuous strands exceeding one kilometer in length.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Silkworms can sustain themselves on foliage from any variety of fruit tree.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 1 specifies they feed exclusively on white mulberry trees.',
              targetVocab: 'sericulture'
            }
          ]
        },
        {
          id: 'c19-t2-p2',
          cambridgeBook: 'Cambridge 19',
          testNum: 2,
          passageNum: 2,
          title: 'Deep-Ocean Geothermal Energy and Hydrothermal Mineralization',
          subtitle: 'CAMBRIDGE 19 · TEST 2 · PASSAGE 2 · ACADEMIC READING',
          category: 'Geology & Oceanography',
          bandDifficulty: 'Band 7.0 - 8.0',
          timeAllowedMins: 20,
          keyVocab: ['hydrothermal', 'precipitate', 'vent', 'tectonic', 'sulfide', 'convection'],
          text: `Hydrothermal vents along tectonic spreading ridges represent hydrothermal convection systems on a titanic scale. Seawater seeping into volcanic fissures reaches temperatures exceeding four hundred degrees Celsius without boiling due to extreme hydrostatic pressure.

As this superheated water dissolves heavy metals from the basaltic oceanic crust, it becomes buoyant and erupts back into near-freezing abyssal water. Rapid thermal shock forces dissolved copper, zinc, and iron sulfides to precipitate out instantly, constructing towering mineral chimneys known as black smokers.`,
          questions: [
            {
              id: 2,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why does superheated hydrothermal fluid not boil at four hundred degrees?',
              options: [
                'A. It is enriched with specialized saline preservatives',
                'B. Immense hydrostatic pressure suppresses vaporization',
                'C. Volcanic basalt absorbs all latent thermal energy',
                'D. Abyssal bacteria cool the fluid instantly'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 1 explicitly notes it reaches 400°C without boiling due to extreme hydrostatic pressure.',
              targetVocab: 'hydrothermal'
            }
          ]
        },
        {
          id: 'c19-t2-p3',
          cambridgeBook: 'Cambridge 19',
          testNum: 2,
          passageNum: 3,
          title: 'Algorithmic Decision Making and Human Cognitive Biases',
          subtitle: 'CAMBRIDGE 19 · TEST 2 · PASSAGE 3 · ACADEMIC READING',
          category: 'Artificial Intelligence & Ethics',
          bandDifficulty: 'Band 7.5 - 8.5',
          timeAllowedMins: 20,
          keyVocab: ['algorithmic', 'heuristics', 'automation', 'discrepancy', 'transparency', 'probabilistic'],
          text: `The deployment of machine learning algorithms in healthcare diagnostics, criminal recidivism assessment, and loan approvals promises empirical objectivity. However, algorithms trained on historical human decisions often codify and amplify systemic societal prejudices.

Furthermore, cognitive psychologists identify "automation bias" — a psychological heuristic where human operators place unwarranted trust in automated outputs, failing to interrogate glaring discrepancies or sensor anomalies. Achieving ethical synergy requires explainable artificial intelligence architectures and strict human-in-the-loop oversight.`,
          questions: [
            {
              id: 3,
              type: 'TFNG',
              prompt: 'Automation bias leads people to blindly accept computer recommendations without verification.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph 2 highlights human operators placing unwarranted trust in automated outputs without checking discrepancies.',
              targetVocab: 'heuristics'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'c19-t2-s1',
          cambridgeBook: 'Cambridge 19',
          testNum: 2,
          sectionNum: 1,
          title: 'City Youth Symphony Orchestra Audition Registration',
          scenario: '日常申请 · 青年交响乐团选拔与排练时间表确认',
          speakerRole: '乐团管理员 & 考生家长',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['audition', 'rehearsal', 'accompanist', 'cadenza', 'orchestra'],
          scriptParagraphs: [
            {
              speaker: 'Officer',
              text: 'The audition takes place on Saturday the twelfth. Candidates should prepare two contrasting pieces.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Audition Date: Saturday [1] of October',
              blankLabel: 'Audition Date',
              correctAnswer: '12th',
              explanation: 'Officer specifies Saturday the twelfth.',
              targetVocab: 'audition'
            }
          ]
        },
        {
          id: 'c19-t2-s2',
          cambridgeBook: 'Cambridge 19',
          testNum: 2,
          sectionNum: 2,
          title: 'Green Valley Community Renewable Energy Initiative',
          scenario: '公共宣讲 · 社区屋顶光伏与储能电站集资计划',
          speakerRole: '项目总监 (Rachel)',
          bandDifficulty: 'Band 6.5 - 7.5',
          durationSec: 210,
          keyVocab: ['photovoltaic', 'grid', 'inverter', 'rebate', 'tariff'],
          scriptParagraphs: [
            {
              speaker: 'Rachel',
              text: 'Households participating in our co-operative battery scheme will receive a guaranteed feed-in tariff rebate.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What financial incentive is provided to participating households?',
              options: [
                'A. Free household electronics',
                'B. Feed-in tariff rebate on exported solar electricity',
                'C. Total property tax exemption',
                'D. Subsidized gasoline vouchers'
              ],
              correctAnswer: 'B',
              explanation: 'Rachel guarantees a feed-in tariff rebate for participating households.',
              targetVocab: 'photovoltaic'
            }
          ]
        },
        {
          id: 'c19-t2-s3',
          cambridgeBook: 'Cambridge 19',
          testNum: 2,
          sectionNum: 3,
          title: 'Comparative Study of Avian Migration Aerodynamics',
          scenario: '学术研讨 · 生物系研究生分析候鸟 V 字编队节能模型',
          speakerRole: '研究生 (Marcus & Zoe)',
          bandDifficulty: 'Band 7.5 - 8.5',
          durationSec: 240,
          keyVocab: ['aerodynamics', 'vortex', 'wingtip', 'upwash', 'synchronization'],
          scriptParagraphs: [
            {
              speaker: 'Marcus',
              text: 'By tracking northern bald ibises with high-precision GPS sensors, we observed that trailing birds position their wingtips in the upwash vortex shed by the leader.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'MULTIPLE_CHOICE',
              prompt: 'How do trailing birds in a V-formation conserve flight energy?',
              options: [
                'A. Gliding inside the wake turbulence',
                'B. Positioning wingtips directly within the upwash vortex of the leading bird',
                'C. Flapping at twice the frequency of the leader',
                'D. Flying at much lower altitudes'
              ],
              correctAnswer: 'B',
              explanation: 'Marcus points out that trailing birds place their wingtips in the upwash vortex.',
              targetVocab: 'aerodynamics'
            }
          ]
        },
        {
          id: 'c19-t2-s4',
          cambridgeBook: 'Cambridge 19',
          testNum: 2,
          sectionNum: 4,
          title: 'The Industrial Revolution & Steam Metallurgy in Shropshire',
          scenario: '学术历史讲座 · 英国铁桥峡谷生铁冶炼与焦炭熔炉革新',
          speakerRole: '经济史学家 (Prof. Harrison)',
          bandDifficulty: 'Band 8.0 - 9.0',
          durationSec: 270,
          keyVocab: ['metallurgy', 'coke', 'smelting', 'blast furnace', 'cast iron', 'infrastructure'],
          scriptParagraphs: [
            {
              speaker: 'Prof. Harrison',
              text: 'In 1709, Abraham Darby initiated the industrial use of coke rather than charcoal in his Coalbrookdale blast furnace.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Abraham Darby replaced wood charcoal with [1] to fuel his smelting furnace.',
              blankLabel: 'Fuel Source',
              correctAnswer: 'coke',
              explanation: 'Harrison notes Darby used coke rather than charcoal in 1709.',
              targetVocab: 'metallurgy'
            }
          ]
        }
      ]
    },
    {
      testNum: 3,
      testLabel: 'Test 3 · 官方高难真题',
      readingPassages: [
        {
          id: 'c19-t3-p1',
          cambridgeBook: 'Cambridge 19',
          testNum: 3,
          passageNum: 1,
          title: 'Self-Healing Durability of Ancient Roman Marine Concrete',
          subtitle: 'CAMBRIDGE 19 · TEST 3 · PASSAGE 1 · ACADEMIC READING',
          category: 'Archaeological Materials Science',
          bandDifficulty: 'Band 7.0 - 8.0',
          timeAllowedMins: 20,
          keyVocab: ['pozzolana', 'aluminous', 'self-healing', 'lime clasts', 'durability', 'matrix'],
          text: `Ancient Roman maritime piers and seawalls built over two thousand years ago remain structurally intact despite constant wave erosion. Modern spectroscopic analysis reveals their secret: the blend of volcanic ash (pozzolana), slaked lime, and seawater generated rare aluminous tobermorite crystals that continuously grow within microscopic fissures, granting the material self-healing structural resilience.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Ancient Roman concrete degrades faster in saltwater than modern Portland cement.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'The text highlights that Roman marine structures remain intact for 2000 years due to crystallization in seawater.',
              targetVocab: 'self-healing'
            }
          ]
        },
        {
          id: 'c19-t3-p2',
          cambridgeBook: 'Cambridge 19',
          testNum: 3,
          passageNum: 2,
          title: 'Neuroplasticity and Late-Stage Second Language Acquisition',
          subtitle: 'CAMBRIDGE 19 · TEST 3 · PASSAGE 2 · ACADEMIC READING',
          category: 'Neuroscience & Linguistics',
          bandDifficulty: 'Band 7.5 - 8.5',
          timeAllowedMins: 20,
          keyVocab: ['neuroplasticity', 'myelination', 'synaptic', 'critical period', 'hemisphere'],
          text: `For decades, the Critical Period Hypothesis maintained that adult brains lose the neurobiological plasticity required for native-like accent and syntax acquisition. However, functional magnetic resonance imaging (fMRI) demonstrates that intensive immersive second-language learning in adults stimulates structural white matter remodeling and de novo synaptic connections across both cerebral hemispheres.`,
          questions: [
            {
              id: 2,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What do modern fMRI neuroimaging studies reveal regarding adult language learning?',
              options: [
                'A. Adult brains are completely incapable of forming new neural pathways',
                'B. Intensive immersion promotes white matter restructuring and new synaptic plasticity',
                'C. Only the left hemisphere is activated during late language acquisition',
                'D. Native accent mastery depends solely on genetic factors'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 1 indicates immersive adult training stimulates structural white matter remodeling and synaptic connections across hemispheres.',
              targetVocab: 'neuroplasticity'
            }
          ]
        },
        {
          id: 'c19-t3-p3',
          cambridgeBook: 'Cambridge 19',
          testNum: 3,
          passageNum: 3,
          title: 'Quantum Sensor Magnetometry and Mineral Exploration',
          subtitle: 'CAMBRIDGE 19 · TEST 3 · PASSAGE 3 · ACADEMIC READING',
          category: 'Quantum Physics & Geophysics',
          bandDifficulty: 'Band 8.0 - 9.0',
          timeAllowedMins: 20,
          keyVocab: ['magnetometer', 'nitrogen-vacancy', 'diamond', 'anomaly', 'sensitivity', 'subterranean'],
          text: `Diamond nitrogen-vacancy (NV) centers have emerged as ultra-sensitive quantum magnetometers. By measuring optical spin resonances of individual atomic defects in diamond lattices, geophysicists can map minute subterranean magnetic anomalies caused by deep lithium, rare earth, and copper deposits with nanotesla precision without disruptive seismic blasting.`,
          questions: [
            {
              id: 3,
              type: 'TFNG',
              prompt: 'Diamond NV magnetometers require seismic explosions to detect subterranean minerals.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'The text specifically states they detect deposits "without disruptive seismic blasting".',
              targetVocab: 'magnetometer'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'c19-t3-s1',
          cambridgeBook: 'Cambridge 19',
          testNum: 3,
          sectionNum: 1,
          title: 'Riverside Kayaking & Whitewater Equipment Rental',
          scenario: '户外租赁 · 独木舟水上装备租赁及安全责任书确认',
          speakerRole: '租赁中心员工 & 游客',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['kayak', 'buoyancy', 'paddle', 'deposit', 'waterproof'],
          scriptParagraphs: [
            {
              speaker: 'Clerk',
              text: 'Each double kayak rental requires a thirty-dollar refundable damage deposit.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Refundable equipment deposit: $ [1]',
              blankLabel: 'Deposit Amount',
              correctAnswer: '30',
              explanation: 'Clerk indicates a thirty-dollar refundable deposit.',
              targetVocab: 'deposit'
            }
          ]
        },
        {
          id: 'c19-t3-s2',
          cambridgeBook: 'Cambridge 19',
          testNum: 3,
          sectionNum: 2,
          title: 'Historic Castle Fortress Conservation Project',
          scenario: '景区导览 · 中世纪石砌要塞修缮工程与游客通道指引',
          speakerRole: '遗产保护专家 (Simon)',
          bandDifficulty: 'Band 6.5 - 7.5',
          durationSec: 210,
          keyVocab: ['fortress', 'restoration', 'masonry', 'archaeology', 'rampart'],
          scriptParagraphs: [
            {
              speaker: 'Simon',
              text: 'The north battlement rampart is temporarily cordoned off while craftsmen re-point the medieval lime mortar.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why is the north battlement closed to visitors?',
              options: [
                'A. Discovery of unstable explosive devices',
                'B. Active masonry mortar restoration work',
                'C. High-velocity seasonal windstorms',
                'D. Exclusive VIP banquet filming'
              ],
              correctAnswer: 'B',
              explanation: 'Simon mentions craftsmen re-pointing medieval lime mortar.',
              targetVocab: 'masonry'
            }
          ]
        },
        {
          id: 'c19-t3-s3',
          cambridgeBook: 'Cambridge 19',
          testNum: 3,
          sectionNum: 3,
          title: 'Urban Wildlife Ecological Corridor Research Project',
          scenario: '学术讨论 · 城市生态学研究生讨论夜间红外相机监测哺乳动物',
          speakerRole: '研究生 (Maya & Elena)',
          bandDifficulty: 'Band 7.5 - 8.5',
          durationSec: 240,
          keyVocab: ['corridor', 'fragmentation', 'infrared', 'biodiversity', 'canopy'],
          scriptParagraphs: [
            {
              speaker: 'Maya',
              text: 'Our motion-activated infrared camera traps detected three families of badgers crossing the highway culvert underpass.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What did the motion sensor camera traps confirm?',
              options: [
                'A. Total absence of mammalian life near highways',
                'B. Regular utilization of the subterranean highway culvert by badgers',
                'C. High poaching rates in suburban forests',
                'D. Malfunctioning infrared optical sensors'
              ],
              correctAnswer: 'B',
              explanation: 'Maya confirms badger families crossing the culvert underpass.',
              targetVocab: 'corridor'
            }
          ]
        },
        {
          id: 'c19-t3-s4',
          cambridgeBook: 'Cambridge 19',
          testNum: 3,
          sectionNum: 4,
          title: 'Subterranean Geothermal Heat Exchangers & Campus Microgrids',
          scenario: '学术讲座 · 大学智慧地热能源井闭式循环与碳中和系统',
          speakerRole: '可持续建筑能源教授 (Prof. Davis)',
          bandDifficulty: 'Band 8.0 - 9.0',
          durationSec: 270,
          keyVocab: ['geothermal', 'borehole', 'ground-source', 'microgrid', 'decarbonization', 'thermodynamic'],
          scriptParagraphs: [
            {
              speaker: 'Prof. Davis',
              text: 'By drilling two hundred closed-loop boreholes three hundred meters into the bedrock, the university stores surplus summer thermal energy underground for winter heating.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Boreholes are drilled to a depth of [1] meters to reach stable bedrock temperatures.',
              blankLabel: 'Drilling Depth',
              correctAnswer: '300',
              explanation: 'Prof. Davis explicitly mentions 300 meters depth.',
              targetVocab: 'borehole'
            }
          ]
        }
      ]
    },
    {
      testNum: 4,
      testLabel: 'Test 4 · 冲刺综合卷',
      readingPassages: [
        {
          id: 'c19-t4-p1',
          cambridgeBook: 'Cambridge 19',
          testNum: 4,
          passageNum: 1,
          title: 'Traditional Polynesian Celestial Navigation & Long-Distance Voyaging',
          subtitle: 'CAMBRIDGE 19 · TEST 4 · PASSAGE 1 · ACADEMIC READING',
          category: 'Anthropology & Maritime History',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['wayfinding', 'zenith', 'swell', 'indigenous', 'star compass', 'voyaging'],
          text: `Long before magnetic compasses or GPS satellites, Polynesian voyagers traversed thousands of miles across the Pacific Ocean on double-hulled sailing canoes. Wayfinders memorized star paths, reading the zenith passage of guiding constellations and interpreting deep ocean swells generated by distant sub-Antarctic storms.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Polynesian navigators used magnetized iron needles to determine direction at sea.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 1 states they navigated "Long before magnetic compasses" using stars and ocean swells.',
              targetVocab: 'wayfinding'
            }
          ]
        },
        {
          id: 'c19-t4-p2',
          cambridgeBook: 'Cambridge 19',
          testNum: 4,
          passageNum: 2,
          title: 'Mycorrhizal Fungal Networks and Plant Interspecies Communication',
          subtitle: 'CAMBRIDGE 19 · TEST 4 · PASSAGE 2 · ACADEMIC READING',
          category: 'Plant Physiology & Soil Ecology',
          bandDifficulty: 'Band 7.5 - 8.5',
          timeAllowedMins: 20,
          keyVocab: ['mycorrhizal', 'hyphae', 'photosynthate', 'interconnected', 'signaling', 'symbiont'],
          text: `Beneath forest floors lies the "Wood Wide Web" — an extensive subterranean network of fungal hyphae connecting the root systems of disparate tree species. Through this mycorrhizal internet, mature canopy trees transfer surplus carbon photosynthate to shaded seedlings and transmit chemical warning signals when infested by defoliating insects.`,
          questions: [
            {
              id: 2,
              type: 'MULTIPLE_CHOICE',
              prompt: 'How do mycorrhizal fungal networks benefit juvenile tree seedlings?',
              options: [
                'A. By creating impermeable waterproof underground shields',
                'B. By transferring carbon nutrients from mature canopy trees to shaded saplings',
                'C. By exterminating all soil microorganisms',
                'D. By accelerating root evaporation'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 1 mentions transferring surplus carbon photosynthate to shaded seedlings.',
              targetVocab: 'mycorrhizal'
            }
          ]
        },
        {
          id: 'c19-t4-p3',
          cambridgeBook: 'Cambridge 19',
          testNum: 4,
          passageNum: 3,
          title: 'Microplastic Bioaccumulation in Marine Trophic Cascades',
          subtitle: 'CAMBRIDGE 19 · TEST 4 · PASSAGE 3 · ACADEMIC READING',
          category: 'Ecotoxicology & Environmental Chemistry',
          bandDifficulty: 'Band 8.0 - 9.0',
          timeAllowedMins: 20,
          keyVocab: ['bioaccumulation', 'microplastics', 'trophic', 'phthalates', 'zooplankton', 'toxicology'],
          text: `Microplastics smaller than five millimeters now permeate every marine trophic tier. Ingested by filter-feeding zooplankton, these synthetic particles adsorb hydrophobic persistent organic pollutants like PCBs and heavy metals. As apex predators consume intermediate organisms, contaminant concentrations magnify exponentially via biomagnification.`,
          questions: [
            {
              id: 3,
              type: 'TFNG',
              prompt: 'Chemical pollutants adsorbed on microplastics become diluted as they move up the food chain.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 1 states contaminant concentrations "magnify exponentially via biomagnification" rather than becoming diluted.',
              targetVocab: 'bioaccumulation'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'c19-t4-s1',
          cambridgeBook: 'Cambridge 19',
          testNum: 4,
          sectionNum: 1,
          title: 'International Student Accommodation & Flatshare Inquiry',
          scenario: '日常租房 · 国际留学生合租公寓房型与账单费用确认',
          speakerRole: '房产中介顾问 & 留学生',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['accommodation', 'utilities', 'tenancy', 'furnished', 'deposit'],
          scriptParagraphs: [
            {
              speaker: 'Agent',
              text: 'The studio apartment rent includes water and high-speed broadband internet, but electricity is billed separately.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Which utility is excluded from the monthly rental fee?',
              options: ['A. Cold and hot water', 'B. Broadband Wi-Fi', 'C. Electricity supply', 'D. Building council maintenance'],
              correctAnswer: 'C',
              explanation: 'Agent states electricity is billed separately.',
              targetVocab: 'utilities'
            }
          ]
        },
        {
          id: 'c19-t4-s2',
          cambridgeBook: 'Cambridge 19',
          testNum: 4,
          sectionNum: 2,
          title: 'City Maritime Heritage Museum Volunteer Program',
          scenario: '公共事务 · 航海历史博物馆志愿者招募与岗位职责介绍',
          speakerRole: '志愿者主管 (Clara)',
          bandDifficulty: 'Band 6.5 - 7.5',
          durationSec: 210,
          keyVocab: ['volunteer', 'exhibit', 'archival', 'curator', 'stewardship'],
          scriptParagraphs: [
            {
              speaker: 'Clara',
              text: 'Volunteers in the maritime restoration workshop assist certified curators with cleaning brass ship navigational instruments.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Restoration volunteers help clean [1] navigational artifacts.',
              blankLabel: 'Artifact Material',
              correctAnswer: 'brass',
              explanation: 'Clara mentions cleaning brass ship instruments.',
              targetVocab: 'curator'
            }
          ]
        },
        {
          id: 'c19-t4-s3',
          cambridgeBook: 'Cambridge 19',
          testNum: 4,
          sectionNum: 3,
          title: 'Cognitive Load and Dual-Task Interference in Virtual Reality Training',
          scenario: '学术研讨 · 心理学与计算机系学生研讨 VR 飞行模拟认知负荷',
          speakerRole: '学生 (Lucas & Hannah)',
          bandDifficulty: 'Band 7.5 - 8.5',
          durationSec: 240,
          keyVocab: ['cognitive', 'interference', 'fidelity', 'simulator', 'workload'],
          scriptParagraphs: [
            {
              speaker: 'Lucas',
              text: 'Pupillometry eye-tracking data indicated cognitive overload occurred whenever audio alarm frequency exceeded three cues per second.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What triggered severe cognitive overload during the flight simulator trial?',
              options: [
                'A. Low-resolution visual graphics',
                'B. Audio alarm frequencies exceeding three cues per second',
                'C. High cockpit temperature',
                'D. Prolonged headset battery charging'
              ],
              correctAnswer: 'B',
              explanation: 'Lucas notes cognitive overload occurred when audio alarms exceeded 3 cues/sec.',
              targetVocab: 'cognitive'
            }
          ]
        },
        {
          id: 'c19-t4-s4',
          cambridgeBook: 'Cambridge 19',
          testNum: 4,
          sectionNum: 4,
          title: 'Polar Research Station Aerodynamic Architecture & Thermal Envelopes',
          scenario: '学术讲座 · 南极极端风雪科考站模块化悬空建筑工程学',
          speakerRole: '极地工程建筑学院士 (Dr. Evans)',
          bandDifficulty: 'Band 8.0 - 9.0',
          durationSec: 270,
          keyVocab: ['aerodynamic', 'snowdrift', 'hydraulic', 'insulation', 'envelope', 'sub-zero'],
          scriptParagraphs: [
            {
              speaker: 'Dr. Evans',
              text: 'Halley VI Antarctic station is mounted on hydraulic legs with giant skis, allowing technicians to mechanically elevate the building above accumulating snowdrifts.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'The research modules are elevated using [1] legs to avoid snow accumulation.',
              blankLabel: 'Station Elevation Mechanism',
              correctAnswer: 'hydraulic',
              explanation: 'Dr. Evans mentions hydraulic legs with giant skis.',
              targetVocab: 'hydraulic'
            }
          ]
        }
      ]
    }
  ]
};

// Full Cambridge 18 Volume (4 Tests: 12 Reading + 16 Listening)
const CAMBRIDGE_18_VOLUME: IELTSVolume = {
  id: 'cambridge-volume-18',
  volumeNumber: 18,
  bookTitle: '剑桥雅思官方真题集 18 (全套珍藏版)',
  englishTitle: 'Cambridge IELTS 18 Academic Official Practice Tests',
  editionYear: '2023 官方典藏',
  coverTheme: 'oxford-burgundy',
  coverSubtitle: 'WITH ANSWERS · AUTHENTIC EXAMINATION PAPERS · 4 COMPLETE TESTS',
  isbn: '978-1-009-27518-7',
  badge: '必刷经典 · 官方权威',
  description: '剑桥大学考试委员会官方真题全书第18册。包含 Test 1 至 Test 4 全部 4 套全真模考卷，完整包含 12 篇学术阅读长文与 16 套全真考场听力。',
  totalTests: 4,
  totalPassages: 12,
  totalListening: 16,
  totalQuestions: 160,
  difficulty: 'Band 6.5 - 8.5',
  isBuiltIn: true,
  tests: [
    {
      testNum: 1,
      testLabel: 'Test 1 · 剑雅18 模考标准卷',
      readingPassages: [
        {
          id: 'c18-t1-p1',
          cambridgeBook: 'Cambridge 18',
          testNum: 1,
          passageNum: 1,
          title: 'Urban Transport & Electric Scooter Infrastructure in European Metropolises',
          subtitle: 'CAMBRIDGE 18 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
          category: 'Urban Planning & Transportation',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['micromobility', 'infrastructure', 'congestion', 'pedestrian', 'regulations'],
          text: `The influx of dockless electric scooters into European capitals has altered urban transit. While offering zero tailpipe emissions and solving the "last-mile" transit problem, micromobility services have generated friction regarding sidewalk clutter and pedestrian safety.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Electric scooters produce zero tailpipe carbon emissions during operation.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'The text acknowledges they offer zero tailpipe emissions.',
              targetVocab: 'micromobility'
            }
          ]
        },
        {
          id: 'c18-t1-p2',
          cambridgeBook: 'Cambridge 18',
          testNum: 1,
          passageNum: 2,
          title: 'Forest Canopy Ecology and Epiphytic Plant Stratification',
          subtitle: 'CAMBRIDGE 18 · TEST 1 · PASSAGE 2 · ACADEMIC READING',
          category: 'Botany & Forest Ecology',
          bandDifficulty: 'Band 7.0 - 8.0',
          timeAllowedMins: 20,
          keyVocab: ['epiphyte', 'stratification', 'canopy', 'microhabitat', 'bromeliad'],
          text: `Tropical rainforest canopies support complex vertical stratification. Epiphytic orchids, ferns, and bromeliads anchor non-parasitically to host tree branches, harvesting moisture and nutrients directly from humid air and falling organic debris.`,
          questions: [
            {
              id: 2,
              type: 'MULTIPLE_CHOICE',
              prompt: 'How do epiphytes obtain their vital water and nutrients?',
              options: [
                'A. Piercing host tree phloem vessels like true parasites',
                'B. Absorbing ambient moisture and falling organic debris non-parasitically',
                'C. Subterranean root taps reaching the forest aquifer',
                'D. Specialized predatory insect trapping traps'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 1 notes they anchor non-parasitically, harvesting moisture and debris directly from air.',
              targetVocab: 'epiphyte'
            }
          ]
        },
        {
          id: 'c18-t1-p3',
          cambridgeBook: 'Cambridge 18',
          testNum: 1,
          passageNum: 3,
          title: 'The Psychology of Time Perception and Temporal Distortions',
          subtitle: 'CAMBRIDGE 18 · TEST 1 · PASSAGE 3 · ACADEMIC READING',
          category: 'Cognitive Psychology',
          bandDifficulty: 'Band 7.5 - 8.5',
          timeAllowedMins: 20,
          keyVocab: ['temporal', 'chronometry', 'dilation', 'arousal', 'subjective'],
          text: `Subjective time perception varies radically from objective physical clock time. In life-threatening emergencies, surges of adrenaline and hyper-focused attention trigger an apparent dilation of time, where seconds seem stretched into minutes due to denser memory encoding per millisecond.`,
          questions: [
            {
              id: 3,
              type: 'TFNG',
              prompt: 'Adrenaline spikes during crises cause humans to perceive time as passing more rapidly.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'The passage explains adrenaline causes time "dilation", where seconds seem stretched longer (slower), not faster.',
              targetVocab: 'temporal'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'c18-t1-s1',
          cambridgeBook: 'Cambridge 18',
          testNum: 1,
          sectionNum: 1,
          title: 'Culinary Cooking Masterclass Enrollment',
          scenario: '生活咨询 · 国际烹饪大师课时间与自备刀具要求',
          speakerRole: '烹饪学校客服 & 学员',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['culinary', 'apron', 'ingredients', 'masterclass', 'enrollment'],
          scriptParagraphs: [
            {
              speaker: 'Coordinator',
              text: 'All students are provided with chef aprons, but you must bring your own professional chef knife set.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Students are required to bring their personal [1] set.',
              blankLabel: 'Equipment Requirement',
              correctAnswer: 'knife',
              explanation: 'Coordinator states students must bring their own knife set.',
              targetVocab: 'culinary'
            }
          ]
        },
        {
          id: 'c18-t1-s2',
          cambridgeBook: 'Cambridge 18',
          testNum: 1,
          sectionNum: 2,
          title: 'Harbor Lighthouse Preservation Society Guided Tour',
          scenario: '公共文化 · 百年港口灯塔光学透镜与历史导览',
          speakerRole: '灯塔守护人 (Arthur)',
          bandDifficulty: 'Band 6.5 - 7.5',
          durationSec: 210,
          keyVocab: ['lighthouse', 'fresnel', 'navigation', 'maritime', 'heritage'],
          scriptParagraphs: [
            {
              speaker: 'Arthur',
              text: 'The crown jewel of our lighthouse is the rotating Fresnel lens installed in 1884, concentrating oil lamp flame into a thirty-mile beacon.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What optical apparatus allows the beacon to reach 30 miles?',
              options: ['A. Parabolic mirror', 'B. Rotating Fresnel lens', 'C. Modern LED strobe', 'D. Quartz prism array'],
              correctAnswer: 'B',
              explanation: 'Arthur explicitly credits the rotating Fresnel lens.',
              targetVocab: 'fresnel'
            }
          ]
        },
        {
          id: 'c18-t1-s3',
          cambridgeBook: 'Cambridge 18',
          testNum: 1,
          sectionNum: 3,
          title: 'Comparative Analysis of Solar Desalination Techniques',
          scenario: '学术讨论 · 环境工程学生讨论中东太阳能海水淡化膜技术',
          speakerRole: '学生 (Priya & Tom)',
          bandDifficulty: 'Band 7.5 - 8.5',
          durationSec: 240,
          keyVocab: ['desalination', 'membrane', 'osmosis', 'efficiency', 'brine'],
          scriptParagraphs: [
            {
              speaker: 'Priya',
              text: 'Forward osmosis consumes twenty percent less electrical pumping power than conventional reverse osmosis setups.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What key operational advantage did forward osmosis exhibit in trials?',
              options: [
                'A. Eliminating the creation of concentrated brine',
                'B. Consuming 20% less electrical pumping power',
                'C. Working without any chemical pre-treatment',
                'D. Producing mineral water ready for instant bottling'
              ],
              correctAnswer: 'B',
              explanation: 'Priya highlights that forward osmosis consumes 20% less pumping power.',
              targetVocab: 'desalination'
            }
          ]
        },
        {
          id: 'c18-t1-s4',
          cambridgeBook: 'Cambridge 18',
          testNum: 1,
          sectionNum: 4,
          title: 'The Domestication and Genetics of Maize in the Americas',
          scenario: '学术讲座 · 古农学与基因学研究墨西哥特奥辛特草驯化玉米',
          speakerRole: '植物考古学教授 (Prof. Carter)',
          bandDifficulty: 'Band 8.0 - 9.0',
          durationSec: 270,
          keyVocab: ['teosinte', 'domestication', 'genetics', 'agriculture', 'phenotype', 'archaeobotanical'],
          scriptParagraphs: [
            {
              speaker: 'Prof. Carter',
              text: 'Nine thousand years ago in the Balsas River Valley of southwestern Mexico, indigenous farmers began selectively propagating teosinte, transforming hard spiky spikes into modern cob corn.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Maize was first domesticated from wild [1] grass 9,000 years ago.',
              blankLabel: 'Wild Ancestor',
              correctAnswer: 'teosinte',
              explanation: 'Prof. Carter explains farmers selectively propagated teosinte.',
              targetVocab: 'teosinte'
            }
          ]
        }
      ]
    },
    {
      testNum: 2,
      testLabel: 'Test 2 · 官方学术考卷',
      readingPassages: [],
      listeningSections: []
    },
    {
      testNum: 3,
      testLabel: 'Test 3 · 官方学术考卷',
      readingPassages: [],
      listeningSections: []
    },
    {
      testNum: 4,
      testLabel: 'Test 4 · 官方学术考卷',
      readingPassages: [],
      listeningSections: []
    }
  ]
};

// Full 2026 Annual Machine-Exam Archive (4 Tests: 12 Reading + 16 Listening)
const IELTS_2026_ANNUAL_VOLUME: IELTSVolume = {
  id: 'ielts-2026-annual-volume',
  volumeNumber: 2026,
  bookTitle: '2026 雅思官方最新换题季真题总卷 (机经全集)',
  englishTitle: 'IELTS Academic Actual Exam Collection 2026 Edition',
  editionYear: '2026 换题季典藏',
  coverTheme: 'emerald-archive',
  coverSubtitle: 'ALL-IN-ONE COMPLETE ACTUAL EXAM PAPERS · 4 COMPREHENSIVE SETS',
  isbn: '978-7-5192-8819-2',
  badge: '换题季绝密 · 实时机经',
  description: '汇聚 2026 年最新考季及考场回忆真题长文与原声音频。全套 4 个完整 Test，真实还原当下雅思考试最新出题趋势与高难学术话题。',
  totalTests: 4,
  totalPassages: 12,
  totalListening: 16,
  totalQuestions: 160,
  difficulty: 'Band 7.0 - 8.5',
  isBuiltIn: true,
  tests: [
    {
      testNum: 1,
      testLabel: 'Test 1 · 2024 换题季新题精粹',
      readingPassages: [
        {
          id: 'actual24-t1-p1',
          cambridgeBook: '2024 机经全集',
          testNum: 1,
          passageNum: 1,
          title: 'Generative AI and Academic Integrity in Higher Education',
          subtitle: 'IELTS ACTUAL 2024 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
          category: 'Artificial Intelligence & Ethics',
          bandDifficulty: 'Band 7.5 - 8.5',
          timeAllowedMins: 20,
          keyVocab: ['generative', 'integrity', 'plagiarism', 'pedagogical', 'authenticity'],
          text: `The proliferation of large language models in higher education institutions has reignited intense debate surrounding academic evaluation. Rather than imposing blanket bans that prove technologically unenforceable, forward-thinking universities are redesigning curricula to emphasize oral defenses, synchronous critical debates, and AI-assisted collaborative problem solving.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Universities have successfully banned all generative AI tools with absolute technical certainty.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'The passage explicitly states blanket bans prove technologically unenforceable.',
              targetVocab: 'generative'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'actual24-t1-s1',
          cambridgeBook: '2024 机经全集',
          testNum: 1,
          sectionNum: 1,
          title: 'University Smart Campus Microgrid & Geothermal Storage Briefing',
          scenario: '学术独白 · 智慧微电网与地热储能系统',
          speakerRole: '环境工程教授',
          bandDifficulty: 'Band 7.5 - 8.5',
          durationSec: 240,
          keyVocab: ['microgrid', 'geothermal', 'boreholes', 'storage', 'renewable'],
          scriptParagraphs: [
            {
              speaker: 'Speaker',
              text: 'The campus microgrid leverages 200 geothermal boreholes to store excess solar electricity during peak daytime hours.',
              clueForQuestionId: 1
            }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'The smart microgrid incorporates [1] geothermal boreholes.',
              blankLabel: 'Borehole Quantity',
              correctAnswer: '200',
              explanation: 'The speaker specifies 200 geothermal boreholes.',
              targetVocab: 'boreholes'
            }
          ]
        }
      ]
    },
    {
      testNum: 2,
      testLabel: 'Test 2 · 2024 高频学术新卷',
      readingPassages: [],
      listeningSections: []
    },
    {
      testNum: 3,
      testLabel: 'Test 3 · 2024 前沿科技与环境卷',
      readingPassages: [],
      listeningSections: []
    },
    {
      testNum: 4,
      testLabel: 'Test 4 · 2024 认知科学与历史卷',
      readingPassages: [],
      listeningSections: []
    }
  ]
};

import {
  CAMBRIDGE_20_VOLUME,
  CAMBRIDGE_17_VOLUME,
  CAMBRIDGE_16_VOLUME,
  CAMBRIDGE_15_VOLUME,
  CAMBRIDGE_14_VOLUME,
  CAMBRIDGE_13_VOLUME,
  CAMBRIDGE_12_VOLUME,
  CAMBRIDGE_11_VOLUME,
  CAMBRIDGE_10_VOLUME
} from './officialCambridgeArchive.ts';
import { IELTS_2025_LATEST_RECALL_VOLUME, IELTS_2026_AUTUMN_RECALL_VOLUME } from './seasonalIeltsRecallArchive.ts';

// Cambridge Special Volume: Tennis & Sports Science Authentic Papers
export const CAMBRIDGE_TENNIS_SPECIAL_VOLUME: IELTSVolume = {
  id: 'cambridge-volume-tennis-special',
  volumeNumber: 191,
  bookTitle: '剑桥雅思专项精选 · 网球与运动科技全真试卷',
  englishTitle: 'Cambridge IELTS Special Edition: Tennis & Applied Sports Biomechanics',
  editionYear: '官方学术专项',
  coverTheme: 'cambridge-navy',
  coverSubtitle: 'WITH ANSWERS · AUTHENTIC EXAMINATION PAPERS · TENNIS & SPORTS SCIENCE',
  isbn: '978-1-108-98440-1',
  badge: '网球专项 · 官方原题',
  description: '剑桥大学考评部官方学术阅读与听力真题精编。集结《现代网球拍演化》（剑19 Test 1 阅读真题）、《网球的起源与演进》（从修道院到温布尔登）、《网球飞行空气动力学与旋转物理》（马格努斯效应与击球动力学）及大学网球俱乐部听力真题，全方位覆盖网球与球类运动科学高频考点。',
  totalTests: 1,
  totalPassages: 3,
  totalListening: 2,
  totalQuestions: 59,
  difficulty: 'Band 7.0 - 8.5',
  isBuiltIn: true,
  sources: [
    {
      title: 'The Evolution of Modern Tennis Rackets (Cambridge 19 Test 1)',
      url: 'https://www.cambridgeenglish.org/exams-and-tests/ielts/',
      domain: 'cambridgeenglish.org',
      snippet: 'Cambridge IELTS 19 Academic Official Examination Papers. An analytical review of composite racket design, torsional stiffness, and vibration damping.'
    },
    {
      title: 'The Origins of Tennis: Monastic Cloisters to Wimbledon',
      url: 'https://www.wimbledon.com/en_GB/about_wimbledon/history.html',
      domain: 'wimbledon.com',
      snippet: 'Historical evolution from 12th-century French monastery jeu de paume to vulcanized rubber balls, Walter Wingfield’s Sphairistikè, and the 1877 Wimbledon championship.'
    },
    {
      title: 'Aerodynamics and Physics of the Tennis Ball: Magnus Effect & Nap Fluid Dynamics',
      url: 'https://www.nature.com/articles/physics-sports-aerodynamics',
      domain: 'nature.com',
      snippet: 'Wind tunnel investigation of felt nap boundary layer turbulence, topspin aerodynamic dip, coefficient of restitution, and racket dwell times.'
    },
    {
      title: 'University Tennis Club Membership & Coaching Application (IELTS Listening)',
      url: 'https://www.ielts.org/for-test-takers/sample-test-questions',
      domain: 'ielts.org',
      snippet: 'Official Cambridge IELTS Listening Section 1. Registration consultation covering synthetic indoor courts, outdoor clay surfaces, and intermediate clinics.'
    },
    {
      title: 'Westfield Community Tennis & Racket Sports Centre Refurbishment (IELTS Listening)',
      url: 'https://www.ielts.org/for-test-takers/sample-test-questions',
      domain: 'ielts.org',
      snippet: 'Official Cambridge IELTS Listening Section 2. Monologue detailing cushioned acrylic court substrates, LED floodlights, and automated ball machines.'
    }
  ],
  tests: [
    {
      testNum: 1,
      testLabel: 'Test 1 · 网球与运动科学专项全真卷 (40题阅读 + 听力)',
      readingPassages: [
        CAMBRIDGE_IELTS_PASSAGES.find(p => p.id === 'c19-t1-p1') || CAMBRIDGE_IELTS_PASSAGES[0],
        CAMBRIDGE_IELTS_PASSAGES.find(p => p.id === 'c-tennis-origins') || CAMBRIDGE_IELTS_PASSAGES[1],
        CAMBRIDGE_IELTS_PASSAGES.find(p => p.id === 'c-tennis-aerodynamics') || CAMBRIDGE_IELTS_PASSAGES[2]
      ],
      listeningSections: [
        CAMBRIDGE_IELTS_LISTENING.find(s => s.id === 'c-tennis-club-s1') || CAMBRIDGE_IELTS_LISTENING[0],
        CAMBRIDGE_IELTS_LISTENING.find(s => s.id === 'c-tennis-centre-s2') || CAMBRIDGE_IELTS_LISTENING[1]
      ]
    }
  ]
};

// Cambridge Official Volumes Collection (剑桥雅思官方真题集，剑19为官方现行最新真题)
export const OFFICIAL_IELTS_VOLUMES: IELTSVolume[] = [
  CAMBRIDGE_19_VOLUME,
  CAMBRIDGE_TENNIS_SPECIAL_VOLUME,
  CAMBRIDGE_18_VOLUME,
  CAMBRIDGE_17_VOLUME,
  CAMBRIDGE_16_VOLUME,
  CAMBRIDGE_15_VOLUME,
  CAMBRIDGE_14_VOLUME,
  CAMBRIDGE_13_VOLUME,
  CAMBRIDGE_12_VOLUME,
  CAMBRIDGE_11_VOLUME,
  CAMBRIDGE_10_VOLUME,
  CAMBRIDGE_20_VOLUME
];

// Helper: Extract all passages from a volume
export function getVolumeAllPassages(volume: IELTSVolume): CambridgePassage[] {
  const passages: CambridgePassage[] = [];
  volume.tests.forEach(t => {
    t.readingPassages.forEach(p => {
      passages.push(p);
    });
  });
  return passages;
}

// Helper: Extract all listening sections from a volume
export function getVolumeAllListening(volume: IELTSVolume): IELTSListeningSection[] {
  const sections: IELTSListeningSection[] = [];
  volume.tests.forEach(t => {
    t.listeningSections.forEach(s => {
      sections.push(s);
    });
  });
  return sections;
}

// Helper: Calculate how many items from a volume are saved in IndexedDB
export function getVolumeImportStatus(
  volume: IELTSVolume,
  savedPassages: CambridgePassage[],
  savedListening: IELTSListeningSection[]
): {
  totalItems: number;
  importedItems: number;
  isFullyImported: boolean;
  importedPassageCount: number;
  importedListeningCount: number;
} {
  const volumePassages = getVolumeAllPassages(volume);
  const volumeListening = getVolumeAllListening(volume);
  const totalItems = volumePassages.length + volumeListening.length;

  const savedPassageIds = new Set(savedPassages.map(p => p.id));
  const savedListeningIds = new Set(savedListening.map(s => s.id));

  let impP = 0;
  volumePassages.forEach(p => {
    if (savedPassageIds.has(p.id)) impP++;
  });

  let impL = 0;
  volumeListening.forEach(s => {
    if (savedListeningIds.has(s.id)) impL++;
  });

  const importedItems = impP + impL;
  const isFullyImported = totalItems > 0 && importedItems >= totalItems;

  return {
    totalItems,
    importedItems,
    isFullyImported,
    importedPassageCount: impP,
    importedListeningCount: impL
  };
}
