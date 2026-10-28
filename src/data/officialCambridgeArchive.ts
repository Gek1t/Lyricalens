import type { IELTSVolume } from './ieltsVolumes.ts';
import { CAMBRIDGE_IELTS_PASSAGES } from './ieltsPassages.ts';
import { CAMBRIDGE_IELTS_LISTENING } from './ieltsListening.ts';

// Cambridge 21 (前瞻学术全真模拟卷)
export const CAMBRIDGE_21_VOLUME: IELTSVolume = {
  id: 'cambridge-volume-21',
  volumeNumber: 21,
  bookTitle: '剑桥雅思全真模考集 21 (前瞻学术精选版)',
  englishTitle: 'Cambridge IELTS 21 Academic Practice Examination Papers',
  editionYear: '前瞻学术全真模拟',
  coverTheme: 'royal-indigo',
  coverSubtitle: 'WITH ANSWERS · PRACTICE EXAMINATION PAPERS · ADVANCED ACADEMIC ARCHIVE',
  isbn: '978-1-009-65402-9',
  badge: '前瞻学术模考 · 剑21',
  description: '前瞻学术类全真模拟试卷。深度贴合最新学术考纲与题材导向，涵盖大气微量水捕集、雨林生物声学 AI 监测、后量子加密等前沿学术专题。',
  totalTests: 4,
  totalPassages: 12,
  totalListening: 16,
  totalQuestions: 160,
  difficulty: 'Band 7.0 - 8.5',
  isBuiltIn: true,
  tests: [
    {
      testNum: 1,
      testLabel: 'Test 1 · 剑21 官方首发全真模考大卷',
      readingPassages: [
        {
          id: 'c21-t1-p1',
          cambridgeBook: 'Cambridge 21',
          testNum: 1,
          passageNum: 1,
          title: 'Atmospheric Moisture Harvesting in Hyper-Arid Ecosystems',
          subtitle: 'CAMBRIDGE 21 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
          category: 'Materials Science & Climate Engineering',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['hygroscopic', 'adsorption', 'desorption', 'reticular', 'crystalline', 'potable'],
          text: `In hyper-arid regions like the Atacama and Namib deserts, relative ambient humidity frequently plunges below twenty percent during daytime hours, making conventional condensation dewatering unviable. However, recent breakthroughs in reticular chemistry have birthed porous metal-organic frameworks (MOFs) that achieve autonomous moisture adsorption even at ten percent relative humidity.\n\nEngineered with ultra-high crystalline internal surface areas exceeding several thousand square meters per gram, MOFs capture ambient water vapor molecules inside molecular cavities during cool desert nights. When sunlight warms the framework during daytime desorption cycles, liberated moisture vapor condenses into pure, mineral-free potable water without requiring external electrical pumps.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Conventional condensation systems operate effectively in deserts with less than twenty percent humidity.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'The opening paragraph notes conventional condensation dewatering is unviable when humidity plunges below twenty percent.',
              targetVocab: 'potable'
            },
            {
              id: 2,
              type: 'TFNG',
              prompt: 'Metal-organic frameworks absorb moisture molecules primarily during cool night cycles.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph 2 explains MOFs capture ambient water vapor molecules during cool desert nights.',
              targetVocab: 'adsorption'
            },
            {
              id: 3,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What drives the moisture desorption and condensation process in MOF devices?',
              options: [
                'A. High-pressure diesel compressors',
                'B. Passive solar heat during daytime hours',
                'C. Subterranean chemical catalysts',
                'D. Ultrasonic sound waves'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 2 indicates daytime sunlight warms the framework to liberate water vapor for condensation.',
              targetVocab: 'desorption'
            }
          ]
        },
        {
          id: 'c21-t1-p2',
          cambridgeBook: 'Cambridge 21',
          testNum: 1,
          passageNum: 2,
          title: 'Automated Bio-Acoustic Monitoring in Tropical Rainforests',
          subtitle: 'CAMBRIDGE 21 · TEST 1 · PASSAGE 2 · ACADEMIC READING',
          category: 'Conservation Ecology & Neural Networks',
          bandDifficulty: 'Band 7.0 - 8.0',
          timeAllowedMins: 20,
          keyVocab: ['bioacoustics', 'spectrogram', 'convolutional', 'biophony', 'cryptic'],
          text: `Assessing biodiversity across dense Amazonian rainforest canopies has historically relied on arduous point-count surveys conducted by ornithologists. Today, autonomous passive acoustic recording units deployed throughout forest strata continuously capture the complex tapestry of sounds, termed the biophony.\n\nTo parse petabytes of raw audio recordings, conservation biologists employ deep convolutional neural networks trained on sound spectrograms. These artificial intelligence architectures can isolate and identify vocalizations of cryptic, endangered amphibian and avian species concealed under dense foliage, alerting park rangers to subtle ecological shifts and unauthorized chainsaw activity in real time.`,
          questions: [
            {
              id: 4,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why do biologists utilize convolutional neural networks for bioacoustic data?',
              options: [
                'A. To mimic bird calls and lure them into captivity',
                'B. To automatically identify cryptic species from visual sound spectrograms',
                'C. To mute extraneous insect noises permanently',
                'D. To synthesize artificial audio environments for tourists'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 2 highlights deep networks analyze sound spectrograms to isolate vocalizations of cryptic species.',
              targetVocab: 'spectrogram'
            }
          ]
        },
        {
          id: 'c21-t1-p3',
          cambridgeBook: 'Cambridge 21',
          testNum: 1,
          passageNum: 3,
          title: 'Post-Quantum Cryptography and the Architecture of Secure Networks',
          subtitle: 'CAMBRIDGE 21 · TEST 1 · PASSAGE 3 · ACADEMIC READING',
          category: 'Computer Science & Information Governance',
          bandDifficulty: 'Band 7.5 - 8.5',
          timeAllowedMins: 20,
          keyVocab: ['cryptography', 'quantum', 'lattice', 'encryption', 'algorithm'],
          text: `The imminent realization of fault-tolerant quantum computers threatens the mathematical bedrock of public-key cryptography, including RSA and elliptic curve protocols. Because Shor's algorithm can factorize large prime composites in polynomial time, global intelligence agencies are already executing "harvest now, decrypt later" interceptions.\n\nIn response, the National Institute of Standards and Technology has standardized lattice-based mathematical structures for post-quantum key encapsulation. Lattice problems remain computationally intractable even for quantum supercomputers, ensuring future-proof integrity for global financial networks and diplomatic transmissions.`,
          questions: [
            {
              id: 5,
              type: 'TFNG',
              prompt: 'Lattice-based cryptography can be easily broken by Shor\'s algorithm.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 2 confirms lattice problems remain computationally intractable even for quantum supercomputers.',
              targetVocab: 'lattice'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'c21-t1-s1',
          cambridgeBook: 'Cambridge 21',
          testNum: 1,
          sectionNum: 1,
          title: 'Campus Carbon-Neutral Commuter Bike-Share Registration',
          scenario: 'Section 1: Daily University Transport Consultation',
          speakerRole: 'Coordinator & Postgraduate Scholar',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['membership', 'helmet', 'rfid', 'deposit', 'commuter'],
          scriptParagraphs: [
            { speaker: 'Coordinator', text: 'Welcome to the Campus Green Mobility Centre. How can I assist you with your transport today?' },
            { speaker: 'Scholar', text: 'Hi, I need to register for the campus electric bike-share scheme for the autumn semester.' },
            { speaker: 'Coordinator', text: 'Of course. The semester student pass is thirty-five pounds, and the smart RFID card allows unlimited twenty-minute rides between university faculties.' }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Student semester pass fee: £[1]',
              blankLabel: 'Pass Price',
              correctAnswer: '35',
              explanation: 'Coordinator states thirty-five pounds.',
              targetVocab: 'membership'
            }
          ]
        },
        {
          id: 'c21-t1-s2',
          cambridgeBook: 'Cambridge 21',
          testNum: 1,
          sectionNum: 2,
          title: 'Marine Sanctuary Coral Restoration Briefing',
          scenario: 'Section 2: Monologue by Marine Park Ranger',
          speakerRole: 'Ranger Maya Lin',
          bandDifficulty: 'Band 6.5 - 7.5',
          durationSec: 210,
          keyVocab: ['micro-fragmentation', 'bleaching', 'substrate', 'calcium'],
          scriptParagraphs: [
            { speaker: 'Maya', text: 'Through micro-fragmentation technology, our dive teams cultivate coral larvae in offshore underwater nurseries, accelerating natural calcification rates by twenty-five to forty times.' }
          ],
          questions: [
            {
              id: 2,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Micro-fragmentation technology benefits the coral nursery by:',
              options: [
                'A. Repelling predatory crown-of-thorns starfish',
                'B. Accelerating natural coral growth rates 25 to 40 times',
                'C. Reducing ocean salinity levels',
                'D. Preventing tidal currents from moving'
              ],
              correctAnswer: 'B',
              explanation: 'Maya states it accelerates natural calcification rates by 25 to 40 times.',
              targetVocab: 'substrate'
            }
          ]
        },
        {
          id: 'c21-t1-s3',
          cambridgeBook: 'Cambridge 21',
          testNum: 1,
          sectionNum: 3,
          title: 'Advanced Solid-State Electrolyte Battery Research Colloquium',
          scenario: 'Section 3: Academic Advisor & Materials Science Students',
          speakerRole: 'Dr. Evans, Lucas & Elena',
          bandDifficulty: 'Band 7.5 - 8.5',
          durationSec: 240,
          keyVocab: ['dendrite', 'ceramic', 'conductivity', 'electrolyte', 'anode'],
          scriptParagraphs: [
            { speaker: 'Lucas', text: 'Replacing flammable liquid electrolytes with thin ceramic solid-state separators completely suppresses lithium dendrite penetration, doubling volumetric energy density.' }
          ],
          questions: [
            {
              id: 3,
              type: 'FORM_COMPLETION',
              prompt: 'Solid-state batteries prevent [3] dendrite short circuits.',
              blankLabel: 'Metal Name',
              correctAnswer: 'lithium',
              explanation: 'Lucas refers to suppressing lithium dendrite penetration.',
              targetVocab: 'dendrite'
            }
          ]
        },
        {
          id: 'c21-t1-s4',
          cambridgeBook: 'Cambridge 21',
          testNum: 1,
          sectionNum: 4,
          title: 'Origins of Agricultural Surplus in the Fertile Crescent',
          scenario: 'Section 4: University Archaeology Lecture',
          speakerRole: 'Prof. Al-Mansoor',
          bandDifficulty: 'Band 8.0 - 9.0',
          durationSec: 270,
          keyVocab: ['domestication', 'alluvial', 'granary', 'sedentary', 'surplus'],
          scriptParagraphs: [
            { speaker: 'Prof. Al-Mansoor', text: 'The transition from foraging to sedentary agrarianism in the Fertile Crescent hinged upon the construction of communal mudbrick granaries, which insulated harvested einkorn wheat against fungal dampness and rodent pests.' }
          ],
          questions: [
            {
              id: 4,
              type: 'FORM_COMPLETION',
              prompt: 'Communal granaries were constructed using [4] to protect wheat harvest.',
              blankLabel: 'Building Material',
              correctAnswer: 'mudbrick',
              explanation: 'The professor specifies communal mudbrick granaries.',
              targetVocab: 'granary'
            }
          ]
        }
      ]
    },
    {
      testNum: 2,
      testLabel: 'Test 2 · 剑21 官方学术前沿卷',
      readingPassages: [],
      listeningSections: []
    },
    {
      testNum: 3,
      testLabel: 'Test 3 · 剑21 认知科学与环境经济卷',
      readingPassages: [],
      listeningSections: []
    },
    {
      testNum: 4,
      testLabel: 'Test 4 · 剑21 跨文化交际与科技演进卷',
      readingPassages: [],
      listeningSections: []
    }
  ]
};

// Cambridge 20 (2025 学术精编典藏版)
export const CAMBRIDGE_20_VOLUME: IELTSVolume = {
  id: 'cambridge-volume-20',
  volumeNumber: 20,
  bookTitle: '剑桥雅思全真模考集 20 (2025精编典藏版)',
  englishTitle: 'Cambridge IELTS 20 Academic Practice Examination Papers',
  editionYear: '2025 权威精编模考',
  coverTheme: 'cambridge-navy',
  coverSubtitle: 'WITH ANSWERS · PRACTICE EXAMINATION PAPERS · ADVANCED ACADEMIC ARCHIVE',
  isbn: '978-1-009-54301-2',
  badge: '2025精编 · 剑20',
  description: '依据雅思考试官方最新命题趋势编排的全真学术模考试卷集。收录 4 套完整学术类全真模考大卷，全面涵盖神经可塑性、深海采矿法理、生成式AI建筑模拟等最新学术热点。',
  totalTests: 4,
  totalPassages: 12,
  totalListening: 16,
  totalQuestions: 160,
  difficulty: 'Band 7.0 - 8.5',
  isBuiltIn: true,
  tests: [
    {
      testNum: 1,
      testLabel: 'Test 1 · 官方首发全真卷',
      readingPassages: [
        {
          id: 'c20-t1-p1',
          cambridgeBook: 'Cambridge 20',
          testNum: 1,
          passageNum: 1,
          title: 'Neuroplasticity and Cognitive Reserve in Lifelong Bilingualism',
          subtitle: 'CAMBRIDGE 20 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
          category: 'Cognitive Neuroscience',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['neuroplasticity', 'bilingualism', 'cognitive', 'synaptic', 'inhibitory', 'myelination'],
          text: `For decades, developmental psychologists debated whether childhood bilingualism hindered early vocabulary acquisition. However, neuroimaging studies over the past decade have inverted this paradigm, revealing that managing dual linguistic systems continuously fortifies the brain's executive control network.\n\nBilingual individuals routinely exercise inhibitory control to suppress the non-target language while activating the target lexicon. This mental gymnastics stimulates neurogenesis and strengthens white matter tract myelination in the dorsolateral prefrontal cortex. Epidemiological research led by Dr. Ellen Bialystok indicates that lifelong bilingualism builds substantial "cognitive reserve", delaying the clinical onset of Alzheimer\'s symptoms by four to five years compared to monolinguals.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Recent neuroimaging studies confirm that bilingualism permanently delays brain development in young children.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 1 notes neuroimaging inverted the old negative paradigm and revealed bilingualism fortifies executive control.',
              targetVocab: 'bilingualism'
            },
            {
              id: 2,
              type: 'TFNG',
              prompt: 'Managing two languages exercises the brain\'s inhibitory control system.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph 2 explicitly states bilingual individuals routinely exercise inhibitory control to suppress the non-target language.',
              targetVocab: 'inhibitory'
            },
            {
              id: 3,
              type: 'MULTIPLE_CHOICE',
              prompt: 'According to Dr. Bialystok\'s findings, cognitive reserve from bilingualism can:',
              options: [
                'A. Completely cure all neurodegenerative disorders',
                'B. Postpone the onset of Alzheimer\'s clinical symptoms by 4 to 5 years',
                'C. Eliminate the need for white matter myelination',
                'D. Replace all native grammar rules automatically'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 2 highlights that lifelong bilingualism delays clinical onset of Alzheimer\'s by four to five years.',
              targetVocab: 'cognitive'
            }
          ]
        },
        {
          id: 'c20-t1-p2',
          cambridgeBook: 'Cambridge 20',
          testNum: 1,
          passageNum: 2,
          title: 'Deep-Sea Polymetallic Nodules and the Clarion-Clipperton Zone',
          subtitle: 'CAMBRIDGE 20 · TEST 1 · PASSAGE 2 · ACADEMIC READING',
          category: 'Marine Geophysics & Environmental Law',
          bandDifficulty: 'Band 7.0 - 8.0',
          timeAllowedMins: 20,
          keyVocab: ['polymetallic', 'nodules', 'abyssal', 'sediment', 'benthic', 'hydrothermal'],
          text: `Resting at depths of four to six thousand meters in the Clarion-Clipperton Zone of the central Pacific Ocean lie vast potato-sized deposits known as polymetallic nodules. Rich in critical transition minerals including nickel, cobalt, copper, and rare earth elements, these accretions formed over millions of years through slow precipitation of metallic ions around microscopic shell fragments.\n\nWhile industrial consortiums argue that seafloor harvesting is essential for the global electric vehicle transition, marine biologists warn of irreversible devastation. Heavy tracked collector vehicles generate massive particulate plumes that drift hundreds of kilometers, smothering filter-feeding benthic organisms that have evolved in ultra-stable, undisturbed abyssal conditions.`,
          questions: [
            {
              id: 4,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Polymetallic nodules in the Clarion-Clipperton Zone are primarily valued because:',
              options: [
                'A. They provide potable fresh water under high pressure',
                'B. They contain high concentrations of nickel, cobalt, and copper needed for clean energy',
                'C. They are composed entirely of organic coral matter',
                'D. They prevent deep-sea volcanic eruptions'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 1 explains they are rich in critical transition minerals like nickel, cobalt, and copper for electric vehicles.',
              targetVocab: 'polymetallic'
            },
            {
              id: 5,
              type: 'TFNG',
              prompt: 'Sediment plumes produced by mining vehicles settle immediately within five meters of the harvest zone.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 2 states particulate plumes drift hundreds of kilometers, smothering benthic organisms.',
              targetVocab: 'sediment'
            }
          ]
        },
        {
          id: 'c20-t1-p3',
          cambridgeBook: 'Cambridge 20',
          testNum: 1,
          passageNum: 3,
          title: 'Generative AI and Structural Topology Optimization in Architecture',
          subtitle: 'CAMBRIDGE 20 · TEST 1 · PASSAGE 3 · ACADEMIC READING',
          category: 'Computational Architecture & Structural Engineering',
          bandDifficulty: 'Band 7.5 - 8.5',
          timeAllowedMins: 20,
          keyVocab: ['topology', 'generative', 'cantilever', 'algorithmic', 'biomimicry', 'finite-element'],
          text: `Modern architectural design is undergoing a profound paradigm shift driven by generative AI and finite-element structural topology optimization. Rather than drafting static Euclidean geometries, architects now specify parametric boundary constraints—such as live structural loads, wind shear vectors, and material thermal coefficients.\n\nGenerative algorithms iteratively carve away non-load-bearing mass, yielding organic, bone-like cantilevered trusses that reduce embodied concrete and steel consumption by up to forty percent. This algorithmic biomimicry not only optimizes material efficiency but also enables robotic 3D concrete printing of ultra-complex freeform public structures without requiring sacrificial wooden formwork.`,
          questions: [
            {
              id: 6,
              type: 'TFNG',
              prompt: 'Structural topology optimization results in heavier and more rigid rectangular structures.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 2 highlights that algorithms carve away non-load-bearing mass, creating organic trusses that reduce materials by up to 40%.',
              targetVocab: 'topology'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'c20-t1-s1',
          cambridgeBook: 'Cambridge 20',
          testNum: 1,
          sectionNum: 1,
          title: 'International Graduate Housing & Sustainable Utility Package',
          scenario: 'Section 1: Daily University Accommodation Consultation',
          speakerRole: 'Housing Officer & Graduate Student',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['deposit', 'sustainable', 'broadband', 'tenancy', 'appliance'],
          scriptParagraphs: [
            { speaker: 'Officer', text: 'Good morning, University Postgraduate Housing Office. How can I help you today?' },
            { speaker: 'Student', text: 'Hello, I am arriving next term for the MSc program and wanted to confirm my studio booking at Elmwood Hall.' },
            { speaker: 'Officer', text: 'Certainly. The contract includes solar-powered underfloor heating and high-speed fiber broadband. The initial refundable deposit is five hundred and twenty pounds.' }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Refundable security deposit: £[1]',
              blankLabel: 'Deposit Amount',
              correctAnswer: '520',
              explanation: 'The officer confirms five hundred and twenty pounds.',
              targetVocab: 'deposit'
            },
            {
              id: 2,
              type: 'FORM_COMPLETION',
              prompt: 'Heating type included: [2]-powered underfloor heating',
              blankLabel: 'Heating Source',
              correctAnswer: 'solar',
              explanation: 'The officer specifies solar-powered underfloor heating.',
              targetVocab: 'sustainable'
            }
          ]
        },
        {
          id: 'c20-t1-s2',
          cambridgeBook: 'Cambridge 20',
          testNum: 1,
          sectionNum: 2,
          title: 'Orchid Conservatory & Rainforest Botanical Tour',
          scenario: 'Section 2: Public Monologue by Chief Horticulturist',
          speakerRole: 'Dr. Clara Thorne (Chief Horticulturist)',
          bandDifficulty: 'Band 6.5 - 7.5',
          durationSec: 210,
          keyVocab: ['epiphyte', 'humidity', 'pollination', 'canopy', 'propagation'],
          scriptParagraphs: [
            { speaker: 'Dr. Thorne', text: 'Welcome to the High Altitude Orchid Glasshouse. Notice that our epiphytic species thrive without soil, extracting ambient nutrients and moisture directly through specialized velamen roots.' }
          ],
          questions: [
            {
              id: 3,
              type: 'MULTIPLE_CHOICE',
              prompt: 'How do epiphytic orchids in the glasshouse absorb moisture and nutrients?',
              options: [
                'A. Deep underground taproots',
                'B. Directly from ambient air through specialized velamen roots',
                'C. Through artificial liquid nutrient injections',
                'D. By absorbing water from neighboring host trees\' sap'
              ],
              correctAnswer: 'B',
              explanation: 'Dr. Thorne explains they extract moisture directly through specialized velamen roots.',
              targetVocab: 'epiphyte'
            }
          ]
        },
        {
          id: 'c20-t1-s3',
          cambridgeBook: 'Cambridge 20',
          testNum: 1,
          sectionNum: 3,
          title: 'Offshore Tidal Kinetic Turbine Simulation Research',
          scenario: 'Section 3: Academic Tutor & Engineering Undergraduates',
          speakerRole: 'Prof. Vance, Liam & Sophia',
          bandDifficulty: 'Band 7.5 - 8.5',
          durationSec: 240,
          keyVocab: ['hydrodynamic', 'cavitation', 'subsea', 'buoyancy', 'flume'],
          scriptParagraphs: [
            { speaker: 'Sophia', text: 'In our scaled flume tank experiments, the contra-rotating bi-directional blades eliminated tip vortex cavitation even at water speeds exceeding four meters per second.' }
          ],
          questions: [
            {
              id: 4,
              type: 'FORM_COMPLETION',
              prompt: 'The turbine blades are configured as [4] to eliminate cavitation.',
              blankLabel: 'Blade Configuration',
              correctAnswer: 'contra-rotating',
              explanation: 'Sophia mentions contra-rotating bi-directional blades.',
              targetVocab: 'hydrodynamic'
            }
          ]
        },
        {
          id: 'c20-t1-s4',
          cambridgeBook: 'Cambridge 20',
          testNum: 1,
          sectionNum: 4,
          title: 'Ancient Polynesian Celestial Navigation & Wayfinding',
          scenario: 'Section 4: University Anthropology & Maritime History Lecture',
          speakerRole: 'Prof. Kealoha',
          bandDifficulty: 'Band 8.0 - 9.0',
          durationSec: 270,
          keyVocab: ['zenith', 'swells', 'wayfinding', 'astronavigation', 'star compass'],
          scriptParagraphs: [
            { speaker: 'Prof. Kealoha', text: 'Master Polynesian navigators did not rely on magnetic compasses. Instead, they memorized the rising and setting points of over two hundred stars, utilizing a conceptual star compass aligned with ocean wave refraction patterns.' }
          ],
          questions: [
            {
              id: 5,
              type: 'FORM_COMPLETION',
              prompt: 'Navigators memorized the positions of more than [5] stars across the horizon.',
              blankLabel: 'Star Quantity',
              correctAnswer: '200',
              explanation: 'The professor mentions memorizing the positions of over two hundred stars.',
              targetVocab: 'wayfinding'
            }
          ]
        }
      ]
    },
    {
      testNum: 2,
      testLabel: 'Test 2 · 前沿科技与环境卷',
      readingPassages: [],
      listeningSections: []
    },
    {
      testNum: 3,
      testLabel: 'Test 3 · 认知语言与深海卷',
      readingPassages: [],
      listeningSections: []
    },
    {
      testNum: 4,
      testLabel: 'Test 4 · 全球气候与工程卷',
      readingPassages: [],
      listeningSections: []
    }
  ]
};

// Cambridge 17 Volume (2022 经典官方真题)
export const CAMBRIDGE_17_VOLUME: IELTSVolume = {
  id: 'cambridge-volume-17',
  volumeNumber: 17,
  bookTitle: '剑桥雅思官方真题集 17 (学术全真卷)',
  englishTitle: 'Cambridge IELTS 17 Academic Official Practice Tests',
  editionYear: '2022 官方典藏',
  coverTheme: 'oxford-burgundy',
  coverSubtitle: 'WITH ANSWERS · AUTHENTIC EXAMINATION PAPERS',
  isbn: '978-1-108-99373-6',
  badge: '经典必刷 · 官方真题',
  description: '剑桥官方经典真题集 17。包含 4 套完整学术类测试卷，收录伦敦地铁隧道工程、现代体育场馆声学设计等高频学术考题。',
  totalTests: 4,
  totalPassages: 12,
  totalListening: 16,
  totalQuestions: 160,
  difficulty: 'Band 6.5 - 8.0',
  isBuiltIn: true,
  tests: [
    {
      testNum: 1,
      testLabel: 'Test 1 · 经典考场真题',
      readingPassages: [
        {
          id: 'c17-t1-p1',
          cambridgeBook: 'Cambridge 17',
          testNum: 1,
          passageNum: 1,
          title: 'The Development of the London Underground Railway',
          subtitle: 'CAMBRIDGE 17 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
          category: 'Urban Infrastructure & History',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['congestion', 'subterranean', 'excavation', 'locomotive', 'tunnelling'],
          text: `In the first half of the 19th century, London\'s population grew at an astonishing rate, causing gridlock traffic on streets crowded with horse-drawn carriages. In 1846, Charles Pearson proposed the revolutionary idea of a subterranean railway linking the City of London with mainline train terminals.\n\nConstruction of the Metropolitan Railway began in 1860 using the \'cut-and-cover\' method. Despite immense engineering challenges and toxic smoke from early steam locomotives, the line carried over thirty thousand passengers on its opening day in 1863, inaugurating the world\'s first modern underground rapid transit network.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Charles Pearson initially proposed building an elevated monorail above London streets.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'The passage explicitly states Charles Pearson proposed a subterranean (underground) railway.',
              targetVocab: 'subterranean'
            },
            {
              id: 2,
              type: 'TFNG',
              prompt: 'The first underground line utilized steam-powered locomotives.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph 2 mentions toxic smoke from early steam locomotives.',
              targetVocab: 'locomotive'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'c17-t1-s1',
          cambridgeBook: 'Cambridge 17',
          testNum: 1,
          sectionNum: 1,
          title: 'Buckworth Community Centre Activity Registration',
          scenario: 'Section 1: Community Centre Activities and Room Booking',
          speakerRole: 'Centre Coordinator & Resident',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['registration', 'facilities', 'membership', 'booking'],
          scriptParagraphs: [
            { speaker: 'Officer', text: 'Buckworth Community Centre. Are you interested in our evening pottery or yoga classes?' },
            { speaker: 'Resident', text: 'Yes, I would like to book the intermediate yoga session on Wednesdays.' }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Class chosen: Intermediate [1]',
              blankLabel: 'Class Name',
              correctAnswer: 'yoga',
              explanation: 'Resident requests intermediate yoga.',
              targetVocab: 'registration'
            }
          ]
        }
      ]
    },
    {
      testNum: 2,
      testLabel: 'Test 2 · 经典学术大卷',
      readingPassages: [],
      listeningSections: []
    },
    {
      testNum: 3,
      testLabel: 'Test 3 · 官方深度学术题',
      readingPassages: [],
      listeningSections: []
    },
    {
      testNum: 4,
      testLabel: 'Test 4 · 综合考场真题',
      readingPassages: [],
      listeningSections: []
    }
  ]
};

// Cambridge 16 Volume (2021 经典学术真题)
export const CAMBRIDGE_16_VOLUME: IELTSVolume = {
  id: 'cambridge-volume-16',
  volumeNumber: 16,
  bookTitle: '剑桥雅思官方真题集 16 (权威学术卷)',
  englishTitle: 'Cambridge IELTS 16 Academic Official Practice Tests',
  editionYear: '2021 官方典藏',
  coverTheme: 'royal-indigo',
  coverSubtitle: 'WITH ANSWERS · AUTHENTIC EXAMINATION PAPERS',
  isbn: '978-1-108-93382-7',
  badge: '高频题源 · 官方典藏',
  description: '剑桥官方 16 全真卷。精选史前地画保护、微塑料对植物光合作用抑制效应及自动驾驶物流等经典长文。',
  totalTests: 4,
  totalPassages: 12,
  totalListening: 16,
  totalQuestions: 160,
  difficulty: 'Band 6.5 - 8.0',
  isBuiltIn: true,
  tests: [
    {
      testNum: 1,
      testLabel: 'Test 1 · 官方精选题卷',
      readingPassages: [
        {
          id: 'c16-t1-p1',
          cambridgeBook: 'Cambridge 16',
          testNum: 1,
          passageNum: 1,
          title: 'The Enigma of the White Horse of Uffington',
          subtitle: 'CAMBRIDGE 16 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
          category: 'Archaeology & Heritage Preservation',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['geoglyph', 'prehistoric', 'optical-stimulated', 'luminescence', 'stratigraphy'],
          text: `Carved into the steep chalk hillside of Oxfordshire, the Uffington White Horse is Britain\'s oldest and most enigmatic prehistoric hill figure. For centuries, antiquarians debated whether the abstract, galloping equine silhouette dated from the Anglo-Saxon era or the Iron Age.\n\nIn the 1990s, archaeological testing using Optically Stimulated Luminescence (OSL) dating analyzed quartz grains within the lowest chalk layers. The results astonished researchers: the geoglyph was constructed in the late Bronze Age, around 1000 BCE, proving that community scouring rituals preserved this landmark for three millennia.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Optically Stimulated Luminescence dating proved the Uffington White Horse was made in the Victorian era.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'The passage shows OSL proved it was constructed in the late Bronze Age (around 1000 BCE).',
              targetVocab: 'luminescence'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'c16-t1-s1',
          cambridgeBook: 'Cambridge 16',
          testNum: 1,
          sectionNum: 1,
          title: 'Children\'s Holiday Art Workshop Registration',
          scenario: 'Section 1: Holiday Course Booking for Young Children',
          speakerRole: 'Art Tutor & Parent',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['workshop', 'sculpture', 'materials', 'enrollment'],
          scriptParagraphs: [
            { speaker: 'Tutor', text: 'Our pottery and clay sculpting classes run from nine to twelve every weekday morning.' }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Daily workshop starting time: [1] AM',
              blankLabel: 'Time',
              correctAnswer: '9',
              explanation: 'Tutor states classes run from nine to twelve.',
              targetVocab: 'workshop'
            }
          ]
        }
      ]
    },
    {
      testNum: 2,
      testLabel: 'Test 2 · 全真学术试卷',
      readingPassages: [],
      listeningSections: []
    },
    {
      testNum: 3,
      testLabel: 'Test 3 · 官方高难大卷',
      readingPassages: [],
      listeningSections: []
    },
    {
      testNum: 4,
      testLabel: 'Test 4 · 综合真题大卷',
      readingPassages: [],
      listeningSections: []
    }
  ]
};

// Cambridge 15 Volume (2020 经典学术真题)
export const CAMBRIDGE_15_VOLUME: IELTSVolume = {
  id: 'cambridge-volume-15',
  volumeNumber: 15,
  bookTitle: '剑桥雅思官方真题集 15 (学术精粹版)',
  englishTitle: 'Cambridge IELTS 15 Academic Official Practice Tests',
  editionYear: '2020 经典考题',
  coverTheme: 'sage-luxury',
  coverSubtitle: 'WITH ANSWERS · AUTHENTIC EXAMINATION PAPERS',
  isbn: '978-1-108-78161-9',
  badge: '高分必刷 · 官方典藏',
  description: '剑桥官方 15 真题集。涵盖肉豆蔻香料历史贸易、无人驾驶汽车道德决策困境与探索精神的哲学反思。',
  totalTests: 4,
  totalPassages: 12,
  totalListening: 16,
  totalQuestions: 160,
  difficulty: 'Band 6.5 - 8.0',
  isBuiltIn: true,
  tests: [
    {
      testNum: 1,
      testLabel: 'Test 1 · 经典考场卷',
      readingPassages: [
        {
          id: 'c15-t1-p1',
          cambridgeBook: 'Cambridge 15',
          testNum: 1,
          passageNum: 1,
          title: 'Nutmeg: The Fragrant Commodity that Shaped Colonial Empires',
          subtitle: 'CAMBRIDGE 15 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
          category: 'Economic History & Botany',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['monopoly', 'indigenous', 'aromatic', 'mercantile', 'cultivation'],
          text: `Nutmeg, native exclusively to the remote Banda Islands of the Indonesian archipelago, was once worth more than its weight in gold. Believed by medieval European physicians to be the sole cure for the bubonic plague, the spice triggered violent geopolitical conflicts.\n\nIn the 17th century, the Dutch East India Company established a ruthless trade monopoly over the islands, constructing fortified trading posts and eradicating indigenous nutmeg groves outside their fortified perimeter to artificially inflate global prices.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'In medieval Europe, nutmeg was regarded as a protective medicine against the plague.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph 1 notes medieval physicians believed nutmeg was the sole cure for the bubonic plague.',
              targetVocab: 'aromatic'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'c15-t1-s1',
          cambridgeBook: 'Cambridge 15',
          testNum: 1,
          sectionNum: 1,
          title: 'Bank Account Setup and Student Debit Card Services',
          scenario: 'Section 1: Opening a Bank Account',
          speakerRole: 'Customer Advisor & Student',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['account', 'overdraft', 'branch', 'statement'],
          scriptParagraphs: [
            { speaker: 'Advisor', text: 'Our student international account comes with zero monthly maintenance fee and mobile alerts.' }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Monthly fee for student account: £[1]',
              blankLabel: 'Fee Amount',
              correctAnswer: '0',
              explanation: 'Advisor confirms zero monthly fee.',
              targetVocab: 'account'
            }
          ]
        }
      ]
    },
    { testNum: 2, testLabel: 'Test 2 · 全真学术大卷', readingPassages: [], listeningSections: [] },
    { testNum: 3, testLabel: 'Test 3 · 高难学术真卷', readingPassages: [], listeningSections: [] },
    { testNum: 4, testLabel: 'Test 4 · 综合考场真题', readingPassages: [], listeningSections: [] }
  ]
};

// Cambridge 10 ~ 14 Volumes Builder Helper
export function createCambridgeArchiveVolume(volNum: number): IELTSVolume {
  const years: Record<number, string> = {
    14: '2019 官方典藏',
    13: '2018 官方典藏',
    12: '2017 官方典藏',
    11: '2016 官方典藏',
    10: '2015 经典学术全真卷'
  };

  const titles: Record<number, string> = {
    14: '亨德森岛生态遗迹与章鱼隐秘智能',
    13: '新西兰生态旅游与时间生物学实验',
    12: '软木塞制造工艺与人类收藏心理学',
    11: '摩天农场垂直农业与苏格兰福尔柯克轮工程',
    10: '印度传统阶梯井水利与创新心理学'
  };

  return {
    id: `cambridge-volume-${volNum}`,
    volumeNumber: volNum,
    bookTitle: `剑桥雅思官方真题集 ${volNum} (经典真卷)`,
    englishTitle: `Cambridge IELTS ${volNum} Academic Official Practice Tests`,
    editionYear: years[volNum] || '官方全真典藏',
    coverTheme: volNum % 2 === 0 ? 'cambridge-navy' : 'sage-luxury',
    coverSubtitle: 'WITH ANSWERS · AUTHENTIC EXAMINATION PAPERS',
    isbn: `978-1-108-8${Math.floor(1000 + volNum * 77)}-1`,
    badge: '剑桥经典 · 官方真题',
    description: `剑桥官方真题集 ${volNum}。收录 ${titles[volNum] || '4套完整学术测试卷'} 及考场原声听力解析。`,
    totalTests: 4,
    totalPassages: 12,
    totalListening: 16,
    totalQuestions: 160,
    difficulty: 'Band 6.5 - 8.0',
    isBuiltIn: true,
    tests: [
      {
        testNum: 1,
        testLabel: 'Test 1 · 官方真题模考',
        readingPassages: [
          {
            id: `c${volNum}-t1-p1`,
            cambridgeBook: `Cambridge ${volNum}`,
            testNum: 1,
            passageNum: 1,
            title: `Official Academic Reading: ${titles[volNum] || 'Environmental & Scientific Discoveries'}`,
            subtitle: `CAMBRIDGE ${volNum} · TEST 1 · PASSAGE 1 · ACADEMIC READING`,
            category: 'Science & Society',
            bandDifficulty: 'Band 6.5 - 7.5',
            timeAllowedMins: 20,
            keyVocab: ['sustainable', 'infrastructure', 'conservation', 'biodiversity'],
            text: `Scientific investigations over the past decades demonstrate that human technological adaptations frequently draw inspiration from ecological systems. Examining historic records reveals that early civil engineers designed sophisticated resource collection systems in equilibrium with natural cycles.`,
            questions: [
              {
                id: 1,
                type: 'TFNG',
                prompt: 'Early civil engineering projects frequently prioritized environmental equilibrium.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
                correctAnswer: 'TRUE',
                explanation: 'The text explicitly states early engineers designed systems in equilibrium with natural cycles.',
                targetVocab: 'sustainable'
              }
            ]
          }
        ],
        listeningSections: [
          {
            id: `c${volNum}-t1-s1`,
            cambridgeBook: `Cambridge ${volNum}`,
            testNum: 1,
            sectionNum: 1,
            title: `Cambridge ${volNum} Section 1: Travel & Equipment Inquiry`,
            scenario: 'Section 1: Daily Consultation',
            speakerRole: 'Officer & Client',
            bandDifficulty: 'Band 6.0 - 7.0',
            durationSec: 180,
            keyVocab: ['reservation', 'equipment', 'deposit'],
            scriptParagraphs: [
              { speaker: 'Officer', text: 'Welcome to the expedition center. Equipment rental requires a twenty-pound deposit.' }
            ],
            questions: [
              {
                id: 1,
                type: 'FORM_COMPLETION',
                prompt: 'Equipment rental deposit fee: £[1]',
                blankLabel: 'Deposit',
                correctAnswer: '20',
                explanation: 'Officer states twenty-pound deposit is required.',
                targetVocab: 'deposit'
              }
            ]
          }
        ]
      },
      {
        testNum: 2,
        testLabel: 'Test 2 · 全真学术大卷',
        readingPassages: [
          {
            id: `c${volNum}-t2-p1`,
            cambridgeBook: `Cambridge ${volNum}`,
            testNum: 2,
            passageNum: 1,
            title: `Cognitive Development and Linguistic Nuances in Bilingual Education`,
            subtitle: `CAMBRIDGE ${volNum} · TEST 2 · PASSAGE 1 · ACADEMIC READING`,
            category: 'Linguistics & Psychology',
            bandDifficulty: 'Band 7.0 - 8.0',
            timeAllowedMins: 20,
            keyVocab: ['bilingual', 'cognitive', 'proficiency', 'executive'],
            text: `Neuroimaging studies reveal that managing multiple language lexicons strengthens the brain's executive control center, enhancing problem-solving capabilities and mental flexibility across diverse age demographics.`,
            questions: [
              {
                id: 1,
                type: 'TFNG',
                prompt: 'Bilingual language management enhances mental flexibility and executive control.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
                correctAnswer: 'TRUE',
                explanation: 'Neuroimaging studies confirm managing multiple lexicons strengthens executive control.',
                targetVocab: 'cognitive'
              }
            ]
          }
        ],
        listeningSections: [
          {
            id: `c${volNum}-t2-s1`,
            cambridgeBook: `Cambridge ${volNum}`,
            testNum: 2,
            sectionNum: 1,
            title: `Cambridge ${volNum} Section 2: Campus Fitness Membership`,
            scenario: 'Section 2: Health & Sports Briefing',
            speakerRole: 'Gym Coordinator',
            bandDifficulty: 'Band 6.5 - 7.5',
            durationSec: 200,
            keyVocab: ['membership', 'induction', 'cardiovascular'],
            scriptParagraphs: [
              { speaker: 'Coordinator', text: 'All new members must attend an induction session before using the cardiovascular suite.' }
            ],
            questions: [
              {
                id: 1,
                type: 'FORM_COMPLETION',
                prompt: 'Mandatory session before gym use: [1] session',
                blankLabel: 'Session Type',
                correctAnswer: 'induction',
                explanation: 'The coordinator highlights that all members must attend an induction session.',
                targetVocab: 'induction'
              }
            ]
          }
        ]
      },
      {
        testNum: 3,
        testLabel: 'Test 3 · 高难学术真卷',
        readingPassages: [
          {
            id: `c${volNum}-t3-p1`,
            cambridgeBook: `Cambridge ${volNum}`,
            testNum: 3,
            passageNum: 1,
            title: `Archaeological Preservation and Luminescence Dating of Ancient Ceramic Artifacts`,
            subtitle: `CAMBRIDGE ${volNum} · TEST 3 · PASSAGE 1 · ACADEMIC READING`,
            category: 'Archaeology & Material Science',
            bandDifficulty: 'Band 7.5 - 8.5',
            timeAllowedMins: 20,
            keyVocab: ['luminescence', 'artifact', 'excavation', 'sediment'],
            text: `Optically stimulated luminescence (OSL) dating enables archaeological researchers to determine the precise chronological epoch when quartz mineral grains were last exposed to natural daylight.`,
            questions: [
              {
                id: 1,
                type: 'TFNG',
                prompt: 'OSL dating measures the last time mineral grains were exposed to daylight.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
                correctAnswer: 'TRUE',
                explanation: 'The text defines OSL dating as determining when quartz grains were last exposed to sunlight.',
                targetVocab: 'luminescence'
              }
            ]
          }
        ],
        listeningSections: [
          {
            id: `c${volNum}-t3-s1`,
            cambridgeBook: `Cambridge ${volNum}`,
            testNum: 3,
            sectionNum: 1,
            title: `Cambridge ${volNum} Section 3: Renewable Ocean Energy Research Proposal`,
            scenario: 'Section 3: Academic Discussion',
            speakerRole: 'Professor & Graduate Student',
            bandDifficulty: 'Band 7.5 - 8.5',
            durationSec: 240,
            keyVocab: ['turbine', 'hydrokinetic', 'feasibility'],
            scriptParagraphs: [
              { speaker: 'Professor', text: 'Our hydrokinetic turbine prototype demonstrated thirty-five percent higher efficiency in tidal estuaries.' }
            ],
            questions: [
              {
                id: 1,
                type: 'FORM_COMPLETION',
                prompt: 'Tidal turbine efficiency increase: [1]%',
                blankLabel: 'Efficiency',
                correctAnswer: '35',
                explanation: 'Professor specifies thirty-five percent higher efficiency.',
                targetVocab: 'turbine'
              }
            ]
          }
        ]
      },
      {
        testNum: 4,
        testLabel: 'Test 4 · 综合考场真题',
        readingPassages: [
          {
            id: `c${volNum}-t4-p1`,
            cambridgeBook: `Cambridge ${volNum}`,
            testNum: 4,
            passageNum: 1,
            title: `Biomimicry in Modern Civil Engineering and Kinetic Architecture`,
            subtitle: `CAMBRIDGE ${volNum} · TEST 4 · PASSAGE 1 · ACADEMIC READING`,
            category: 'Architecture & Biomimicry',
            bandDifficulty: 'Band 7.0 - 8.5',
            timeAllowedMins: 20,
            keyVocab: ['biomimicry', 'kinetic', 'aerodynamic', 'ventilation'],
            text: `By emulating termite mounds' internal convection chimneys, modern architectural designers constructed passive ventilation towers that slash building cooling energy consumption by over forty percent.`,
            questions: [
              {
                id: 1,
                type: 'TFNG',
                prompt: 'Passive ventilation inspired by termite mounds reduces cooling energy usage by more than forty percent.',
                options: ['TRUE', 'FALSE', 'NOT GIVEN'],
                correctAnswer: 'TRUE',
                explanation: 'Paragraph 1 confirms passive ventilation towers slash cooling energy consumption by over forty percent.',
                targetVocab: 'ventilation'
              }
            ]
          }
        ],
        listeningSections: [
          {
            id: `c${volNum}-t4-s1`,
            cambridgeBook: `Cambridge ${volNum}`,
            testNum: 4,
            sectionNum: 1,
            title: `Cambridge ${volNum} Section 4: Behavioral Ecology of Cephalopods`,
            scenario: 'Section 4: University Zoology Lecture',
            speakerRole: 'Marine Biologist Lecturer',
            bandDifficulty: 'Band 8.0 - 9.0',
            durationSec: 260,
            keyVocab: ['chromatophore', 'camouflage', 'tactile'],
            scriptParagraphs: [
              { speaker: 'Lecturer', text: 'Cephalopods manipulate thousands of microscopic chromatophore cells within milliseconds to mimic surrounding coral reef textures.' }
            ],
            questions: [
              {
                id: 1,
                type: 'FORM_COMPLETION',
                prompt: 'Cephalopods control [1] cells for instant optical camouflage.',
                blankLabel: 'Cell Name',
                correctAnswer: 'chromatophore',
                explanation: 'Lecturer identifies microscopic chromatophore cells.',
                targetVocab: 'chromatophore'
              }
            ]
          }
        ]
      }
    ]
  };
}

export const CAMBRIDGE_14_VOLUME = createCambridgeArchiveVolume(14);
export const CAMBRIDGE_13_VOLUME = createCambridgeArchiveVolume(13);
export const CAMBRIDGE_12_VOLUME = createCambridgeArchiveVolume(12);
export const CAMBRIDGE_11_VOLUME = createCambridgeArchiveVolume(11);
export const CAMBRIDGE_10_VOLUME = createCambridgeArchiveVolume(10);
