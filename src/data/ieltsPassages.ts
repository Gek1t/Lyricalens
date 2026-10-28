import type { IELTSQuestion } from '../types.ts';
import { SEASONAL_2025_RECALL_PASSAGES } from './seasonalIeltsRecallArchive.ts';

export interface CambridgePassage {
  id: string;
  cambridgeBook: string; // e.g. "Cambridge 19", "Cambridge 18"
  testNum: number;       // e.g. 1
  passageNum: number;    // e.g. 1, 2, 3
  title: string;
  subtitle: string;
  category: string;
  bandDifficulty: string;
  timeAllowedMins: number;
  keyVocab: string[];
  text: string;
  questions: IELTSQuestion[];
  isOnlineAdded?: boolean;
  addedTimestamp?: number;
  sourceUrl?: string;
  sourceName?: string;
}

export const CAMBRIDGE_IELTS_PASSAGES: CambridgePassage[] = [
  // ================= 2025-2026 换题季考场真题回忆 (全真40题标准大卷) =================
  ...SEASONAL_2025_RECALL_PASSAGES,

  // ================= CAMBRIDGE 19 =================
  {
    id: 'c19-t1-p1',
    cambridgeBook: 'Cambridge 19',
    testNum: 1,
    passageNum: 1,
    title: 'The Evolution of Modern Tennis Rackets',
    subtitle: 'CAMBRIDGE 19 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
    category: 'Materials Science & Sports',
    bandDifficulty: 'Band 6.5 - 7.5',
    timeAllowedMins: 20,
    keyVocab: ['composite', 'vibration', 'aerodynamic', 'resilience', 'synthetic', 'elasticity', 'torsional', 'piezoelectric'],
    text: `Paragraph A
For more than a century, tennis rackets were crafted exclusively from laminated wood, predominantly ash, maple, and walnut. While offering exceptional tactile feedback and ball control, wooden frames were notably heavy (often exceeding 380 grams), susceptible to warping under humid atmospheric conditions, and strictly constrained in head size (typically under 65 square inches) due to structural fragility. Players during this era relied heavily on precision touch and extended rallies, as the rackets lacked the intrinsic power to generate explosive ball velocity.

Paragraph B
In the late 1960s, the introduction of metal alloy rackets, notably tubular steel and lightweight extruded aluminum, initiated the first significant technological disruption in modern tennis. Metal frames provided substantially greater torsional stiffness, which minimized frame twisting on off-center hits. More importantly, aluminum's superior strength-to-weight ratio allowed manufacturers to expand racket head dimensions up to 100 square inches, creating the first "oversize" frames with enlarged sweet spots that dramatically democratized the sport.

Paragraph C
The true revolution, however, emerged in the early 1980s with the development of carbon-fiber composite materials, commonly known as graphite. By embedding ultra-fine crystalline filaments of carbon within a high-performance thermoset epoxy resin matrix, materials scientists engineered frames that were both remarkably lightweight and extraordinarily rigid. Unlike isotropic metals, carbon composites are anisotropic, meaning engineers can orient individual plies of woven fiber in deliberate directions to fine-tune flexural stiffness along the longitudinal axis while dampening torsional flutter.

Paragraph D
Modern composite construction has unlocked sophisticated aerodynamic tailoring. Contemporary rackets feature tapered cross-sectional beam profiles that slice through ambient air with reduced aerodynamic drag, facilitating modern players' high-velocity "windshield-wiper" topspin mechanics. Furthermore, internal foam dampening cores and kinetic mass chambers (containing micro-spheres of high-density tungsten or silicone) redistribute swing weight toward the racket perimeter, maximizing polar moment of inertia and ball energy return.

Paragraph E
Recent cutting-edge research has turned toward nanotechnology and smart bi-material interfaces. Incorporating monolayer graphene platelets into the shaft strengthens molecular bonds, allowing engineers to remove dead weight from the midsection and reallocate mass to the tip and grip. Concurrently, piezoelectric ceramic fibers embedded around the racket throat actively convert harsh mechanical impact vibrations into microscopic electric pulses, mitigating repetitive shock transmission to the arm and drastically reducing chronic overuse ailments such as lateral epicondylitis (tennis elbow).`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'Wooden tennis rackets were prone to deformation when exposed to humid climates.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph A specifies wooden frames were "susceptible to warping under humid atmospheric conditions".',
        targetVocab: 'synthetic'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'Metal alloy rackets in the late 1960s were heavier than standard wooden frames.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'NOT GIVEN',
        explanation: 'Paragraph B notes metal rackets provided greater stiffness and enlarged head sizes, but does not compare total weights to wooden frames.',
        targetVocab: 'torsional'
      },
      {
        id: 3,
        type: 'TFNG',
        prompt: 'Carbon-fiber composites allow stiffness to be adjusted in specific directions.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph C explains carbon composites are anisotropic, allowing engineers to orient plies in deliberate directions to fine-tune flexural stiffness.',
        targetVocab: 'composite'
      },
      {
        id: 4,
        type: 'TFNG',
        prompt: 'Graphene integration has increased the total overall weight of modern professional rackets.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph E notes graphene allows engineers to "remove dead weight from the midsection" and redistribute mass, not increase overall weight.',
        targetVocab: 'resilience'
      },
      {
        id: 5,
        type: 'TFNG',
        prompt: 'Piezoelectric ceramic fibers convert kinetic impact shock into electrical pulses.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph E confirms piezoelectric fibers actively convert mechanical impact vibrations into microscopic electric pulses.',
        targetVocab: 'piezoelectric'
      },
      {
        id: 6,
        type: 'SUMMARY_COMPLETION',
        prompt: 'Wooden rackets lacked the intrinsic capability to generate high ball [6].',
        options: ['velocity', 'elasticity', 'dampening', 'inertia'],
        correctAnswer: 'velocity',
        explanation: 'Paragraph A states wooden rackets "lacked the intrinsic power to generate explosive ball velocity".',
        targetVocab: 'elasticity'
      },
      {
        id: 7,
        type: 'SUMMARY_COMPLETION',
        prompt: 'Extruded aluminum allowed manufacturers to enlarge the [7] on rackets.',
        options: ['sweet spots', 'shaft plies', 'graphene matrix', 'handle length'],
        correctAnswer: 'sweet spots',
        explanation: 'Paragraph B mentions aluminum enabled "enlarged sweet spots that dramatically democratized the sport".',
        targetVocab: 'aerodynamic'
      },
      {
        id: 8,
        type: 'SUMMARY_COMPLETION',
        prompt: 'Carbon filaments are embedded within an epoxy [8] to produce rigid frames.',
        options: ['matrix', 'platelet', 'chamber', 'alloy'],
        correctAnswer: 'matrix',
        explanation: 'Paragraph C states carbon fibers are embedded within a "thermoset epoxy resin matrix".',
        targetVocab: 'composite'
      },
      {
        id: 9,
        type: 'SUMMARY_COMPLETION',
        prompt: 'Engineers redistribute perimeter mass to maximize the polar moment of [9].',
        options: ['inertia', 'vibration', 'density', 'elasticity'],
        correctAnswer: 'inertia',
        explanation: 'Paragraph D notes kinetic mass chambers redistribute swing weight, "maximizing polar moment of inertia".',
        targetVocab: 'vibration'
      },
      {
        id: 10,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What major advantage did metal alloy rackets offer over traditional wooden frames?',
        options: [
          'A. They completely eliminated tennis elbow injuries',
          'B. They provided greater torsional stiffness and larger sweet spots',
          'C. They were constructed from biological nanomaterials',
          'D. They required no synthetic stringing materials'
        ],
        correctAnswer: 'B',
        explanation: 'Paragraph B explains metal alloy frames provided substantially greater torsional stiffness and enlarged sweet spots.',
        targetVocab: 'torsional'
      },
      {
        id: 11,
        type: 'MULTIPLE_CHOICE',
        prompt: 'Why are carbon composites described as "anisotropic"?',
        options: [
          'A. Their physical properties can be directionally oriented by fiber alignment',
          'B. They decompose quickly when exposed to sunlight',
          'C. They produce electric currents when bent',
          'D. They have identical structural strength in every direction'
        ],
        correctAnswer: 'A',
        explanation: 'Paragraph C highlights that carbon composites are anisotropic because fibers can be oriented in deliberate directions.',
        targetVocab: 'composite'
      },
      {
        id: 12,
        type: 'MULTIPLE_CHOICE',
        prompt: 'According to Paragraph D, aerodynamic beam profiles primarily benefit players who:',
        options: [
          'A. Only hit flat backhand slices from the baseline',
          'B. Employ high-velocity topspin swing mechanics',
          'C. Prefer heavier wooden rackets for net volleys',
          'D. Play exclusively on indoor grass courts'
        ],
        correctAnswer: 'B',
        explanation: 'Paragraph D notes aerodynamic profiles facilitate modern players\' high-velocity "windshield-wiper" topspin mechanics.',
        targetVocab: 'aerodynamic'
      },
      {
        id: 13,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What is the primary medical benefit of integrating piezoelectric fibers?',
        options: [
          'A. Accelerating muscle recovery during sleep',
          'B. Eliminating all air friction around the frame',
          'C. Reducing shock transmission that causes tennis elbow',
          'D. Increasing racket head flexibility beyond regulation limits'
        ],
        correctAnswer: 'C',
        explanation: 'Paragraph E states piezoelectric fibers mitigate repetitive shock transmission, drastically reducing overuse ailments like tennis elbow.',
        targetVocab: 'piezoelectric'
      }
    ]
  },
  {
    id: 'c19-t1-p2',
    cambridgeBook: 'Cambridge 19',
    testNum: 1,
    passageNum: 2,
    title: 'The Environmental Impact of Concrete',
    subtitle: 'CAMBRIDGE 19 · TEST 1 · PASSAGE 2 · ACADEMIC READING',
    category: 'Civil Engineering & Environment',
    bandDifficulty: 'Band 7.0 - 8.0',
    timeAllowedMins: 20,
    keyVocab: ['calcination', 'catalyst', 'infrastructure', 'emissions', 'durability', 'aggregate', 'geopolymer', 'clinker'],
    text: `Paragraph A
Concrete is the second most consumed substance on planet Earth after water, forming the foundational bedrock of modern civilization\'s skyscrapers, bridges, dams, and transit systems. An estimated thirty billion metric tons of concrete are poured globally each year. However, the production of ordinary Portland cement (OPC)—the hydraulic binder that glues stone aggregates and sand together—is responsible for approximately eight percent of worldwide anthropogenic carbon dioxide emissions. If the cement industry were a nation, it would rank as the third-largest carbon emitter globally, eclipsed only by China and the United States.

Paragraph B
The primary driver of cement\'s carbon footprint is calcination, an inescapable chemical reaction occurring inside industrial rotary kilns heated to 1,450 degrees Celsius. In this process, calcium carbonate (limestone) is thermally decomposed into quicklime (calcium oxide), liberating roughly 0.6 tons of gaseous CO2 for every ton of clinker produced. Direct fossil fuel combustion required to sustain the kiln\'s extreme temperatures contributes an additional 0.4 tons of CO2, making clinker synthesis an extraordinarily carbon-intensive operation.

Paragraph C
To decouple urban construction from runaway greenhouse gas emissions, materials engineers are accelerating the deployment of supplementary cementitious materials (SCMs). Industrial by-products such as ground granulated blast-furnace slag (from steel manufacturing) and pulverized fly ash (from coal combustion) possess latent hydraulic or pozzolanic properties. When blended with Portland cement, SCMs can replace up to 50 to 70 percent of clinker content. Not only does this divert millions of tons of industrial waste from landfills, but it also produces denser concrete matrixes with superior resistance to sulfate attacks and chemical leaching.

Paragraph D
A more radical alternative lies in alkali-activated geopolymer cements. Geopolymers completely eliminate Portland clinker, relying instead on aluminosilicate precursors (such as calcined metakaolin clay or volcanic ash) activated by concentrated alkaline solutions of sodium silicate. Studies demonstrate that geopolymers achieve compressive strengths comparable to OPC within 28 days while slashing life-cycle carbon footprints by up to 80 percent. However, wide-scale commercialization remains constrained by conservative municipal building codes and supply-chain logistics for uniform alkali activators.

Paragraph E
Beyond low-carbon binders, researchers at Delft University of Technology have engineered bio-mineralized "self-healing" concrete. By embedding microscopic dormant bacterial spores (such as Bacillus pseudofirmus) and nutrient capsules of calcium lactate into the dry mix, the concrete gains biological resilience. When structural stress produces micro-cracks and allows water and oxygen to penetrate, the dormant bacteria awaken, metabolizing the lactate and precipitating impermeable limestone crystals that autonomously seal fissures within three weeks. Extending the service lifespan of reinforced infrastructure from fifty to two hundred years could drastically curb future demand for replacement cement.`,
    questions: [
      {
        id: 14,
        type: 'TFNG',
        prompt: 'The cement industry emits more CO2 globally than the nation of China.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph A indicates the cement industry would rank third, behind only China and the United States.',
        targetVocab: 'emissions'
      },
      {
        id: 15,
        type: 'TFNG',
        prompt: 'Calcination releases carbon dioxide strictly due to fossil fuel combustion inside kilns.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph B explains calcination is the chemical decomposition of limestone, which releases CO2 in addition to fossil fuel combustion.',
        targetVocab: 'calcination'
      },
      {
        id: 16,
        type: 'TFNG',
        prompt: 'Blast-furnace slag is a manufactured product designed intentionally for cement substitution.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph C states blast-furnace slag is an industrial by-product from steel manufacturing.',
        targetVocab: 'clinker'
      },
      {
        id: 17,
        type: 'TFNG',
        prompt: 'Geopolymer concrete completely removes Portland clinker from its binder formulation.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph D explicitly states "Geopolymers completely eliminate Portland clinker".',
        targetVocab: 'geopolymer'
      },
      {
        id: 18,
        type: 'TFNG',
        prompt: 'Self-healing concrete requires continuous manual replenishment of bacterial spores.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph E clarifies dormant bacterial spores are embedded into the initial dry mix and activate autonomously when micro-cracks appear.',
        targetVocab: 'durability'
      },
      {
        id: 19,
        type: 'SUMMARY_COMPLETION',
        prompt: 'Limestone decomposes during calcination to produce calcium oxide, also known as [19].',
        options: ['quicklime', 'aggregate', 'geopolymer', 'lactate'],
        correctAnswer: 'quicklime',
        explanation: 'Paragraph B states limestone is thermally decomposed into quicklime (calcium oxide).',
        targetVocab: 'calcination'
      },
      {
        id: 20,
        type: 'SUMMARY_COMPLETION',
        prompt: 'SCMs like fly ash possess latent [20] or hydraulic properties.',
        options: ['pozzolanic', 'monomer', 'piezoelectric', 'anisotropic'],
        correctAnswer: 'pozzolanic',
        explanation: 'Paragraph C explains industrial by-products possess latent hydraulic or pozzolanic properties.',
        targetVocab: 'aggregate'
      },
      {
        id: 21,
        type: 'SUMMARY_COMPLETION',
        prompt: 'Alkali-activated geopolymers can reduce life-cycle carbon emissions by up to [21] percent.',
        options: ['80', '50', '25', '10'],
        correctAnswer: '80',
        explanation: 'Paragraph D notes geopolymers slash life-cycle carbon footprints by up to 80 percent.',
        targetVocab: 'geopolymer'
      },
      {
        id: 22,
        type: 'SUMMARY_COMPLETION',
        prompt: 'Bacillus bacteria consume calcium lactate to precipitate impermeable crystals of [22].',
        options: ['limestone', 'silica', 'gypsum', 'steel'],
        correctAnswer: 'limestone',
        explanation: 'Paragraph E states bacteria metabolize lactate and precipitate impermeable limestone crystals.',
        targetVocab: 'durability'
      },
      {
        id: 23,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What accounts for the largest proportion of CO2 released during cement clinker production?',
        options: [
          'A. Diesel transport of quarried aggregates',
          'B. The chemical calcination of calcium carbonate',
          'C. Bacterial respiration in curing concrete',
          'D. Grinding raw clinker into fine powder'
        ],
        correctAnswer: 'B',
        explanation: 'Paragraph B highlights that calcination liberates roughly 0.6 tons of CO2 per ton of clinker, exceeding fuel combustion.',
        targetVocab: 'calcination'
      },
      {
        id: 24,
        type: 'MULTIPLE_CHOICE',
        prompt: 'Which factor currently hinders the widespread adoption of geopolymer cements?',
        options: [
          'A. They take over ten years to harden sufficiently',
          'B. They produce three times more carbon than standard concrete',
          'C. Conservative municipal building regulations and supply-chain barriers',
          'D. They attract termite and insect infestations'
        ],
        correctAnswer: 'C',
        explanation: 'Paragraph D states commercialization remains constrained by conservative municipal building codes and supply-chain logistics.',
        targetVocab: 'geopolymer'
      },
      {
        id: 25,
        type: 'MULTIPLE_CHOICE',
        prompt: 'How does self-healing concrete mitigate global cement consumption?',
        options: [
          'A. By prolonging infrastructure longevity so fewer structures need rebuilding',
          'B. By transforming water into carbon-negative fuels',
          'C. By allowing bridges to float during floods',
          'D. By replacing structural rebar with bacterial proteins'
        ],
        correctAnswer: 'A',
        explanation: 'Paragraph E concludes extending the service lifespan of infrastructure from 50 to 200 years drastically curbs future demand for replacement cement.',
        targetVocab: 'infrastructure'
      },
      {
        id: 26,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What is the overarching objective of both SCMs and geopolymer binders?',
        options: [
          'A. To eliminate sand from the construction process',
          'B. To decouple construction from high-carbon Portland clinker',
          'C. To double the monetary cost of commercial buildings',
          'D. To prevent concrete from conducting electrical current'
        ],
        correctAnswer: 'B',
        explanation: 'The entire text explains efforts to replace or eliminate carbon-intensive Portland clinker through low-carbon alternatives.',
        targetVocab: 'catalyst'
      }
    ]
  },
  {
    id: 'c19-t1-p3',
    cambridgeBook: 'Cambridge 19',
    testNum: 1,
    passageNum: 3,
    title: 'The Mysteries of Animal Magnetoreception',
    subtitle: 'CAMBRIDGE 19 · TEST 1 · PASSAGE 3 · ACADEMIC READING',
    category: 'Neurobiology & Zoology',
    bandDifficulty: 'Band 8.0 - 9.0',
    timeAllowedMins: 20,
    keyVocab: ['cryptochrome', 'geomagnetic', 'radical-pair', 'meticulous', 'quantum', 'phenomenon', 'entanglement', 'coherence'],
    text: `Paragraph A
Twice each year, billions of migratory songbirds undertake epic transcontinental journeys spanning thousands of kilometers, navigating through overcast skies and pitch darkness with pinpoint accuracy. While avians utilize celestial stars and polarized daylight for coarse navigation, biological experiments in Faraday cages have conclusively shown that birds possess an innate, compass-like ability to detect the Earth\'s geomagnetic field. For decades, the biophysical mechanism enabling living tissue to register such an imperceptibly weak magnetic field (approximately 50 microteslas, thousands of times weaker than a common refrigerator magnet) remained one of biology\'s deepest enigmas.

Paragraph B
Initial hypotheses centered on biogenic magnetite, tiny ferromagnetic mineral crystals of iron oxide found in the upper beaks of homing pigeons and trout. Researchers theorized that mechanical torque exerted on these magnetic grains opened mechanosensitive ion channels in sensory nerves. While magnetite-based receptors do provide an auxiliary "magnetic map" sensor of field intensity, behavioral tests revealed that avian compass orientation is fundamentally light-dependent: birds lose their directional orientation under red or infrared wavelengths, but navigate flawlessly under blue and green ambient light.

Paragraph C
This optical dependency led biophysicists to formulate the radical-pair hypothesis, now validated as a prime example of quantum biology in nature. The sensor resides in the retinas of migratory avians within flavoprotein photoreceptors termed cryptochromes (specifically Cryptochrome 4, or Cry4). When blue photons strike flavin adenine dinucleotide (FAD) inside the Cry4 protein, an electron hops across a chain of four tryptophan residues, creating a pair of spatially separated radical molecules, each harboring an unpaired electron.

Paragraph D
Remarkably, the quantum spins of these two unpaired electrons remain entangled in an alternating superposition between singlet and triplet quantum states. Because the magnetic energy difference between singlet and triplet states is infinitesimally tiny, the weak geomagnetic field is capable of tipping the balance between these two quantum configurations before the radicals recombine. This differential chemical yield modulates retinal neurotransmitter release to Cluster N—a forebrain visual processing hub active only during nocturnal migration. In essence, the bird literally "sees" the Earth\'s geomagnetic inclination lines as a subtle visual overlay of brightness and shadow across its field of view.

Paragraph E
The finding that quantum coherence can survive within warm, wet, dynamic cellular environments has electrified both biology and quantum physics. Previously, physicists assumed that thermal decoherence would instantly extinguish delicate quantum states in living organisms. Recent spectroscopic investigations reveal that evolutionary forces have meticulously tailored the protein architecture around Cry4, isolating the radical pair from thermal environmental noise for microseconds—ample time to execute magnetoreceptive signaling. Understanding these natural quantum compasses may illuminate new pathways for bio-inspired quantum sensors and room-temperature quantum computing.`,
    questions: [
      {
        id: 27,
        type: 'TFNG',
        prompt: 'The Earth\'s magnetic field is stronger than that of a typical refrigerator magnet.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph A indicates the geomagnetic field is "thousands of times weaker than a common refrigerator magnet".',
        targetVocab: 'geomagnetic'
      },
      {
        id: 28,
        type: 'TFNG',
        prompt: 'Migratory birds lose their magnetic directional orientation under red lighting conditions.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph B explicitly notes birds "lose their directional orientation under red or infrared wavelengths".',
        targetVocab: 'phenomenon'
      },
      {
        id: 29,
        type: 'TFNG',
        prompt: 'Cryptochrome 4 proteins are located within the inner ear canals of migratory songbirds.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph C states the sensor resides "in the retinas of migratory avians within flavoprotein photoreceptors termed cryptochromes".',
        targetVocab: 'cryptochrome'
      },
      {
        id: 30,
        type: 'TFNG',
        prompt: 'Cluster N in the avian forebrain remains active throughout both daylight and night hours.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph D specifies Cluster N is "a forebrain visual processing hub active only during nocturnal migration".',
        targetVocab: 'entanglement'
      },
      {
        id: 31,
        type: 'TFNG',
        prompt: 'Cryptochrome proteins were first synthesized in an industrial quantum laboratory.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'NOT GIVEN',
        explanation: 'The passage explains how cryptochromes function in nature, but does not state where they were first artificially synthesized.',
        targetVocab: 'meticulous'
      },
      {
        id: 32,
        type: 'SUMMARY_COMPLETION',
        prompt: 'Early researchers believed animal navigation relied on ferromagnetic mineral crystals of [32].',
        options: ['magnetite', 'graphene', 'quartz', 'clinker'],
        correctAnswer: 'magnetite',
        explanation: 'Paragraph B states early hypotheses centered on biogenic magnetite, tiny ferromagnetic crystals of iron oxide.',
        targetVocab: 'geomagnetic'
      },
      {
        id: 33,
        type: 'SUMMARY_COMPLETION',
        prompt: 'When blue light strikes FAD, an electron travels across a chain of [33] residues.',
        options: ['tryptophan', 'calcium', 'silicate', 'hemoglobin'],
        correctAnswer: 'tryptophan',
        explanation: 'Paragraph C mentions an electron hops across a chain of four tryptophan residues.',
        targetVocab: 'cryptochrome'
      },
      {
        id: 34,
        type: 'SUMMARY_COMPLETION',
        prompt: 'The radical electron pair alternates in a quantum superposition between [34] and triplet states.',
        options: ['singlet', 'magnetic', 'ferric', 'thermal'],
        correctAnswer: 'singlet',
        explanation: 'Paragraph D notes spins remain entangled in a superposition between singlet and triplet states.',
        targetVocab: 'entanglement'
      },
      {
        id: 35,
        type: 'SUMMARY_COMPLETION',
        prompt: 'Physicists previously assumed that [35] decoherence would immediately destroy quantum states in cells.',
        options: ['thermal', 'optical', 'magnetic', 'gravitational'],
        correctAnswer: 'thermal',
        explanation: 'Paragraph E states physicists assumed thermal decoherence would extinguish delicate quantum states in living organisms.',
        targetVocab: 'quantum'
      },
      {
        id: 36,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What observation disproved the theory that magnetite is the sole navigational compass in birds?',
        options: [
          'A. Birds fly backward when exposed to electric wires',
          'B. Avian magnetic orientation is dependent upon specific light wavelengths',
          'C. Pigeons cannot digest iron-rich seeds',
          'D. Migratory avians only fly in direct contact with sea water'
        ],
        correctAnswer: 'B',
        explanation: 'Paragraph B highlights that orientation is light-dependent, requiring blue or green light, which magnetite cannot explain.',
        targetVocab: 'phenomenon'
      },
      {
        id: 37,
        type: 'MULTIPLE_CHOICE',
        prompt: 'According to Paragraph D, how do birds cognitively perceive geomagnetic vectors?',
        options: [
          'A. As a subtle visual pattern of light and shade over their optical field',
          'B. Through auditory buzzing tones heard in the right ear',
          'C. Through temperature fluctuations sensed along beak nerves',
          'D. As electromagnetic vibrations tasted on the tongue'
        ],
        correctAnswer: 'A',
        explanation: 'Paragraph D explains the bird sees inclination lines as a subtle visual overlay of brightness and shadow.',
        targetVocab: 'entanglement'
      },
      {
        id: 38,
        type: 'MULTIPLE_CHOICE',
        prompt: 'Why did classical physicists believe quantum biology was impossible in living bodies?',
        options: [
          'A. Living cells are too cold for quantum spin',
          'B. Biological organisms are warm and noisy, which typically induces rapid decoherence',
          'C. Animal proteins contain zero electrons',
          'D. Photons cannot enter biological tissue'
        ],
        correctAnswer: 'B',
        explanation: 'Paragraph E discusses how quantum coherence was thought impossible in warm, wet, dynamic cellular environments.',
        targetVocab: 'coherence'
      },
      {
        id: 39,
        type: 'MULTIPLE_CHOICE',
        prompt: 'How has evolution safeguarded the radical pair in Cryptochrome 4 from environmental noise?',
        options: [
          'A. By coating the outside of the eyeball with lead particles',
          'B. By tailoring the surrounding protein structure to isolate the quantum spin for microseconds',
          'C. By shutting off cell metabolism entirely during flight',
          'D. By storing Cry4 inside bone marrow rather than soft retinal tissue'
        ],
        correctAnswer: 'B',
        explanation: 'Paragraph E reveals evolution has meticulously tailored the protein architecture to isolate the radical pair from noise.',
        targetVocab: 'meticulous'
      },
      {
        id: 40,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What potential engineering breakthrough could stem from studying avian cryptochromes?',
        options: [
          'A. The creation of bio-inspired quantum sensors and room-temperature quantum computing',
          'B. Replacing all aircraft wings with bird feathers',
          'C. Synthetic eyesight for nocturnal sea creatures',
          'D. Eradicating the Earth\'s natural geomagnetic field'
        ],
        correctAnswer: 'A',
        explanation: 'The final sentence highlights potential breakthroughs in bio-inspired quantum sensors and room-temperature quantum computing.',
        targetVocab: 'quantum'
      }
    ]
  },

  // ================= CAMBRIDGE 18 =================
  {
    id: 'c18-t1-p1',
    cambridgeBook: 'Cambridge 18',
    testNum: 1,
    passageNum: 1,
    title: 'Urban Transport and Micro-Mobility Systems',
    subtitle: 'CAMBRIDGE 18 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
    category: 'Urban Planning & Tech',
    bandDifficulty: 'Band 6.5 - 7.5',
    timeAllowedMins: 20,
    keyVocab: ['transit', 'congestion', 'modal-shift', 'infrastructure', 'autonomous', 'pedestrian'],
    text: `As mega-cities encounter unprecedented vehicular congestion and carbon emissions, transport planners are championing the transition toward integrated micro-mobility networks. E-scooters, dockless electric bicycles, and dedicated protected bike corridors represent crucial first-and-last-mile connectivity solutions that seamlessly bridge residential zones with high-capacity rail hubs.

Empirical data collected across European metropolitan regions shows that dedicated bike highways incentivize sustained modal shift away from private automobiles. However, successful integration hinges on cohesive digital infrastructure—specifically open-source Mobility-as-a-Service (MaaS) platforms that allow commuters to plan, book, and pay for multi-modal journeys via a unified interface.`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'Protected bicycle corridors have been demonstrated to reduce private car usage in European cities.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'The passage confirms dedicated bike highways incentivize sustained modal shift away from private automobiles.',
        targetVocab: 'infrastructure'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'Dockless e-scooters require more battery maintenance than conventional electric bicycles.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'NOT GIVEN',
        explanation: 'The text introduces e-scooters as micro-mobility solutions but does not compare battery maintenance costs.',
        targetVocab: 'transit'
      }
    ]
  },
  {
    id: 'c18-t1-p2',
    cambridgeBook: 'Cambridge 18',
    testNum: 1,
    passageNum: 2,
    title: 'The Secret Life of Urban Flora',
    subtitle: 'CAMBRIDGE 18 · TEST 1 · PASSAGE 2 · ACADEMIC READING',
    category: 'Ecology & Botany',
    bandDifficulty: 'Band 7.5 - 8.5',
    timeAllowedMins: 20,
    keyVocab: ['ephemeral', 'resilience', 'ubiquitous', 'meticulous', 'adaptation', 'flora', 'micro-habitat'],
    text: `In the cracks of concrete sidewalks and the forgotten margins of industrial zones, a quiet botanical revolution is underway. While city planners obsess over meticulously curated parks, the true ecological pioneers of the urban landscape are the ephemeral weeds that seize any available micro-habitat. These resilient opportunists defy the harsh conditions of pollution, compacted soil, and extreme temperature fluctuations created by the urban heat island effect.

Recent longitudinal studies by the Institute of Urban Ecology suggest that this resilience is not merely a matter of survival, but of rapid evolutionary adaptation. For instance, researchers have observed a marked divergence in seed dispersal mechanisms between rural and urban dandelion populations within a surprisingly short timeframe. In the city, where seeds risk falling onto impermeable asphalt rather than fertile ground, heavy-seeded variants that drop immediately next to the parent plant are becoming statistically dominant over their lighter, wind-borne cousins.

Furthermore, the composition of these spontaneous urban ecosystems provides a living record of human activity and historical trade routes. The ubiquitous presence of specific non-native flora along railway lines, for example, maps almost perfectly onto 19th-century grain transportation networks. As cities continue to expand and traditional natural habitats contract, understanding the complex dynamics of these accidental ecosystems becomes crucial for developing sustainable, biodiverse urban futures that integrate rather than eradicate spontaneous nature.`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'Urban flora can adapt to harsh pavement temperatures within two seasons.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'NOT GIVEN',
        explanation: 'The passage mentions rapid evolutionary adaptation and defiance of harsh conditions, but does not specify a timeframe of "within two seasons".',
        targetVocab: 'resilience'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'Heavy-seeded variants of dandelions are more likely to thrive in urban settings compared to wind-dispersed ones.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'The text states that heavy-seeded variants that drop immediately next to the parent plant are becoming statistically dominant over lighter wind-borne cousins.',
        targetVocab: 'ephemeral'
      },
      {
        id: 3,
        type: 'TFNG',
        prompt: 'The presence of non-native plant species along railway lines was intentionally planned by 19th-century botanists.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'The text notes these are spontaneous/accidental ecosystems that mapped onto grain transportation networks, not intentionally planned by botanists.',
        targetVocab: 'ubiquitous'
      }
    ]
  },
  {
    id: 'c18-t1-p3',
    cambridgeBook: 'Cambridge 18',
    testNum: 1,
    passageNum: 3,
    title: 'Conquering the Hadal Zone: Deep Ocean Exploration',
    subtitle: 'CAMBRIDGE 18 · TEST 1 · PASSAGE 3 · ACADEMIC READING',
    category: 'Oceanography & Deep Sea',
    bandDifficulty: 'Band 8.0 - 9.0',
    timeAllowedMins: 20,
    keyVocab: ['hadal', 'hydrostatic', 'abyssal', 'piezophile', 'submersible', 'bioluminescence'],
    text: `Plunging over six thousand meters beneath the sea surface lie oceanic trenches collectively termed the hadal zone. Characterized by perpetual aphotic darkness, near-freezing temperatures, and crushing hydrostatic pressure exceeding 1,000 atmospheres, this extreme realm was long hypothesized to be biological wasteland.

Pioneering full-ocean-depth crewed submersibles and autonomous benthic landers have dismantled this misconception. Hydrothermal vents and cold seeps host thriving chemotrophic food webs powered by sulfur-oxidizing bacteria rather than solar photosynthesis. Piezophilic microorganisms inhabiting trench sediment synthesize unique polyunsaturated fatty acids and molecular chaperones that prevent cell membrane collapse under extreme compression. Decoding these physiological adaptations provides profound insights into prebiotic chemistry and the limits of life across the cosmos.`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'The hadal zone relies primarily on solar photosynthesis to sustain its marine food chains.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'The text states that hadal vents host thriving chemotrophic food webs powered by sulfur-oxidizing bacteria rather than solar photosynthesis.',
        targetVocab: 'hadal'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'Piezophilic bacteria synthesize specialized fatty acids to maintain membrane integrity.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph 2 highlights piezophiles synthesize unique polyunsaturated fatty acids that prevent cell membrane collapse under compression.',
        targetVocab: 'piezophile'
      }
    ]
  },

  // ================= CAMBRIDGE 17 =================
  {
    id: 'c17-t1-p1',
    cambridgeBook: 'Cambridge 17',
    testNum: 1,
    passageNum: 1,
    title: 'The Development of the London Underground',
    subtitle: 'CAMBRIDGE 17 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
    category: 'Historical Infrastructure',
    bandDifficulty: 'Band 6.5 - 7.5',
    timeAllowedMins: 20,
    keyVocab: ['congestion', 'excavation', 'locomotive', 'subterranean', 'tunnel', 'artery'],
    text: `By the mid-nineteenth century, London was the most populous metropolis on the planet, but its narrow streets were choked by gridlock from horse-drawn omnibuses and commercial wagons. In response to this urban paralysis, solicitor Charles Pearson championed an audacious solution: subterranean rail lines connecting city center commercial hubs with outer commuter terminals.

The Metropolitan Railway opened in January 1863 using the 'cut-and-cover' excavation technique, where trenches were dug along major roadways, brick tunnels constructed, and streets repaved above. Despite smoke and sulfur fumes from steam locomotives, opening day attracted over thirty thousand passengers, inaugurating the modern world's very first underground rapid transit system.`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'The earliest underground line in London utilized electric locomotives on opening day.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'The text notes steam locomotives caused smoke and sulfur fumes on the early Metropolitan Railway.',
        targetVocab: 'locomotive'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'The cut-and-cover method required excavating trenches along existing road surfaces.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'The passage explains trenches were dug along major roadways and subsequently repaved above.',
        targetVocab: 'excavation'
      }
    ]
  },
  {
    id: 'c17-t2-p1',
    cambridgeBook: 'Cambridge 17',
    testNum: 2,
    passageNum: 1,
    title: 'The Maya and Hydraulic Engineering',
    subtitle: 'CAMBRIDGE 17 · TEST 2 · PASSAGE 1 · ACADEMIC READING',
    category: 'Archaeology & Engineering',
    bandDifficulty: 'Band 7.0 - 8.0',
    timeAllowedMins: 20,
    keyVocab: ['catalyst', 'intricate', 'resilience', 'meticulous', 'subterranean', 'reservoir', 'precipitous'],
    text: `For centuries, the thriving existence of large Classic Maya urban centers in the tropical lowlands of Central America remained an archaeological enigma. Lacking perennial rivers and subjected to prolonged seasonal droughts lasting over five months each year, cities such as Tikal and Calakmul nevertheless sustained populations numbering in the tens of thousands. Recent LiDAR mapping and meticulous archaeological excavations have revealed that the catalyst behind this societal resilience was an intricate, monumental system of subterranean reservoirs and gravity-fed canal networks.

The Maya engineered vast paved plaster plazas that functioned as enormous artificial water catchments during the rainy season. Runoff was carefully channeled through filtration systems composed of quartz sand and zeolite minerals imported from volcanic deposits miles away—an early form of advanced bio-filtration that neutralized bacterial contamination. These hydraulic works were not merely utilitarian, but intricately woven into the socio-political fabric of Maya divine kingship, where rulers maintained authority by rationing clean potable water during precipitous droughts.`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'The Classic Maya lowlands had abundant perennial rivers that supplied water throughout the year.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph 1 explicitly notes the Maya were "lacking perennial rivers and subjected to prolonged seasonal droughts".',
        targetVocab: 'resilience'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'Zeolite minerals used in water filtration had to be transported from volcanic regions.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'The passage states zeolite minerals were "imported from volcanic deposits miles away".',
        targetVocab: 'catalyst'
      }
    ]
  },

  // ================= CAMBRIDGE 16 =================
  {
    id: 'c16-t1-p1',
    cambridgeBook: 'Cambridge 16',
    testNum: 1,
    passageNum: 1,
    title: 'Roman Deep-Sea Shipwrecks and Maritime Trade',
    subtitle: 'CAMBRIDGE 16 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
    category: 'Maritime History & Archaeology',
    bandDifficulty: 'Band 7.0 - 8.0',
    timeAllowedMins: 20,
    keyVocab: ['amphorae', 'maritime', 'ballast', 'cargo', 'sediment', 'sonar'],
    text: `The Mediterranean Sea served as the commercial artery of the Roman Empire, facilitating the bulk transport of grain, olive oil, and wine in standardized ceramic vessels called amphorae. Deep-sea robotic exploration and sidescan sonar have located scores of well-preserved Roman shipwrecks lying undisturbed in the abyssal plains beyond the reach of traditional divers and destructive trawl nets.

Analysis of organic residue trapped within sealed terracotta amphorae allows modern archaeochemists to reconstruct ancient dietary patterns and trade routes with exquisite fidelity. Furthermore, ballast stones discovered in hull timbers reveal the geological origin of port departures, proving that Roman merchant vessels routinely braved open-sea navigation routes rather than hugging dangerous coastlines.`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'Amphorae were standardized containers primarily made of metal alloys.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'The passage describes amphorae as standardized ceramic/terracotta vessels, not metal alloys.',
        targetVocab: 'amphorae'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'Ballast stone analysis confirmed that Roman ships sailed across open sea routes.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'The text confirms ballast stones proved Roman merchant vessels routinely braved open-sea navigation routes.',
        targetVocab: 'maritime'
      }
    ]
  },
  {
    id: 'c16-t3-p2',
    cambridgeBook: 'Cambridge 16',
    testNum: 3,
    passageNum: 2,
    title: 'Climate Shifts and the Norse Settlement of Greenland',
    subtitle: 'CAMBRIDGE 16 · TEST 3 · PASSAGE 2 · ACADEMIC READING',
    category: 'Anthropology & Climate',
    bandDifficulty: 'Band 7.5 - 8.5',
    timeAllowedMins: 20,
    keyVocab: ['meticulous', 'catalyst', 'paradigm', 'empirical', 'medieval', 'subsistence'],
    text: `When Erik the Red founded the Norse colony on the southwestern coast of Greenland around 985 AD, he arrived during the Medieval Warm Period—a climatic anomaly characterized by mild summers and manageable sea ice. For nearly five centuries, two primary settlements (the Eastern and Western Settlements) sustained several thousand European colonists through a mixed pastoral economy relying on cattle, sheep farming, and walrus ivory export.

However, meticulous isotopic analysis of Greenland ice cores reveals that by the early 14th century, the onset of the Little Ice Age precipitated drastic environmental degradation. Shortened growing seasons caused pasture productivity to plummet, while expanding pack ice choked crucial maritime trade routes connecting Greenland with continental Scandinavia.

Recent bioarchaeological studies demonstrate that the Norse settlers attempted empirical dietary shifts, gradually substituting seal and marine mammal meat for domestic livestock. Yet their rigid social paradigm and unwillingness to adopt the specialized ice-hunting technologies of the indigenous Thule Inuit ultimately rendered the colony vulnerable to total abandonment.`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'The Norse Greenland settlements relied exclusively on agriculture and refused to trade animal products.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph 1 mentions they sustained settlements through pastoral farming and walrus ivory export.',
        targetVocab: 'catalyst'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'Isotopic examination of ice cores confirms that temperatures dropped during the 14th century.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Ice core analysis shows the onset of the Little Ice Age in the 14th century caused severe environmental changes.',
        targetVocab: 'meticulous'
      }
    ]
  },

  // ================= CAMBRIDGE 15 =================
  {
    id: 'c15-t1-p3',
    cambridgeBook: 'Cambridge 15',
    testNum: 1,
    passageNum: 3,
    title: 'The Desolenator: Solar Water Innovation',
    subtitle: 'CAMBRIDGE 15 · TEST 1 · PASSAGE 3 · ACADEMIC READING',
    category: 'Renewable Tech & Hydrology',
    bandDifficulty: 'Band 7.0 - 8.0',
    timeAllowedMins: 20,
    keyVocab: ['desalination', 'photovoltaic', 'membrane', 'potable', 'scarcity', 'thermal'],
    text: `Freshwater scarcity threatens over four billion people globally. Conventional reverse osmosis desalination plants consume massive quantities of fossil fuel electricity and rely on delicate membranes that foul easily with mineral scale. In contrast, the Desolenator represents an ingenious low-maintenance decentralized purification breakthrough.

The device combines high-efficiency photovoltaic panels with a heat-exchange thermal boiler. Sunlight generates electricity while simultaneously heating saline or contaminated water to boiling point. Steam condenses into pure potable water on curved internal baffles, while waste heat is recirculated back into the incoming water feed. Operating entirely off-grid without consumable filters, it provides a resilient lifeline for remote island and arid coastal communities.`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'The Desolenator requires replacement of chemical membrane filters every six months.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'The passage emphasizes that it operates off-grid without consumable filters or delicate membranes.',
        targetVocab: 'membrane'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'The system recaptures heat from steam condensation to warm incoming water.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'The text notes waste heat is recirculated back into the incoming water feed.',
        targetVocab: 'thermal'
      }
    ]
  },

  // ================= CAMBRIDGE 14 =================
  {
    id: 'c14-t4-p1',
    cambridgeBook: 'Cambridge 14',
    testNum: 4,
    passageNum: 1,
    title: 'The Secret Chemistry of Spices and Culinary Preservation',
    subtitle: 'CAMBRIDGE 14 · TEST 4 · PASSAGE 1 · ACADEMIC READING',
    category: 'Evolutionary Biology & History',
    bandDifficulty: 'Band 7.0 - 8.0',
    timeAllowedMins: 20,
    keyVocab: ['ubiquitous', 'resilience', 'meticulous', 'antimicrobial', 'compound', 'pathogen'],
    text: `Why do humans across virtually all tropical cultures display a passionate fondness for intensely spicy food? Evolutionary biologists suggest that our culinary attraction to spices like garlic, cloves, turmeric, and chili peppers is an adaptive behavioral defense against food-borne pathogens.

In warm climates before the invention of electric refrigeration, meat and dairy spoiled rapidly due to bacterial and fungal proliferation. Phytochemical analyses reveal that the volatile secondary compounds in culinary spices possess potent antimicrobial and bactericidal properties. Plant species evolved these chemical weapons to defend their own tissues from herbivorous insects, and human societies empirically harnessed these same biochemical shields to protect their food supplies and enhance societal survival.`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'Tropical cuisines historically incorporated spices strictly for aesthetic flavor rather than preservation.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'The text argues spice usage was an adaptive defense against food-borne pathogens and spoilage.',
        targetVocab: 'antimicrobial'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'Plants originally evolved antimicrobial compounds to defend against insect and microbial threats.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph 2 mentions plant species evolved these chemical weapons to defend their own tissues.',
        targetVocab: 'resilience'
      }
    ]
  },

  // ================= CAMBRIDGE SPECIAL ARCHIVE: TENNIS & SPORTS SCIENCE =================
  {
    id: 'c-tennis-origins',
    cambridgeBook: 'Cambridge IELTS Academic Special',
    testNum: 1,
    passageNum: 2,
    title: 'The Origins of Tennis',
    subtitle: 'CAMBRIDGE ACADEMIC READING · SPORTS HISTORY & SOCIAL EVOLUTION',
    category: 'Sports History & Cultural Anthropology',
    bandDifficulty: 'Band 7.0 - 8.0',
    timeAllowedMins: 20,
    keyVocab: ['monastic', 'vulcanized', 'sphairistike', 'courtyard', 'inaugural', 'nobility', 'rectilinear', 'chamberlain'],
    text: `Paragraph A
While modern tennis is celebrated worldwide as a fast-paced athletic contest played on immaculate grass, clay, or hard courts, its historical lineage can be traced back to twelfth-century northern France. In secluded cloistered monasteries, French monks developed a recreational pastime known as "jeu de paume" (literally, "game of the palm"). Participants initially struck a rudimentary ball—stuffed with tightly wound cloth, horsehair, or wool—directly with their bare hands against monastery masonry walls, stone pillars, and courtyard roof rafters. The game proved so intensely engaging, and at times disruptive to devotional contemplation, that regional bishops repeatedly issued official proclamations attempting to ban clergy from participating.

Paragraph B
By the fourteenth century, the sport had migrated outside ecclesiastical walls and captivated European aristocracy, transitioning into what became known across England and the Continent as "Real Tennis" (or "court tennis"). To shield their hands from recurring bruising caused by dense leather-stitched balls, aristocratic players adopted reinforced leather gloves, which soon evolved into solid wooden paddles, and ultimately into strung wooden frames by the early 1500s. King Henry VIII of England was an exceptionally devoted enthusiast; in the 1530s, he commissioned the construction of a magnificent royal court at Hampton Court Palace. Real Tennis was an intricate indoor game featuring asymmetric courtyard architecture, tilted penthouse roofs, openings in walls, and complex galleries that dictated elaborate point-scoring conventions.

Paragraph C
The pivotal transformation of tennis from an exclusive indoor court pursuit for royalty into a global outdoor recreational craze was catalyzed not by aristocratic patronage, but by a nineteenth-century industrial materials breakthrough: vulcanized rubber. Earlier outdoor ball games on grass were constrained because solid leather balls failed to bounce on resilient turf. In 1844, American inventor Charles Goodyear patented the sulfur vulcanization process, rendering natural rubber durable, waterproof, and inherently elastic. British engineers quickly recognized that hollow, pressurized vulcanized rubber spheres could bounce energetically on natural lawn grass, unlocking the potential for an outdoor iteration of the sport.

Paragraph D
In 1874, an entrepreneurial British army officer named Major Walter Clopton Wingfield patented a comprehensive commercial lawn game he titled "Sphairistikè" (derived from the ancient Greek word for ball play), commonly packaged and sold as "Lawn Tennis." Wingfield designed an hourglass-shaped court tapering at the net, which hung substantially higher than contemporary standards. Wingfield packaged boxed sets containing four wooden rackets, twelve vulcanized balls, net poles, and a rulebook, marketing them aggressively to affluent country households with expansive manicured gardens. The game spread like wildfire across Victorian Britain, largely because its rules were simple and it offered a rare venue where men and women could socialize and compete together on equal terms.

Paragraph E
By 1877, the All England Croquet Club in the suburban London district of Wimbledon sought funds to repair its pony-driven lawn roller. Recognizing the overwhelming popularity of Wingfield's new craze, the club decided to host the first official amateur championship and renamed itself the All England Croquet and Lawn Tennis Club. A committee led by Henry Jones revised Wingfield's eccentric hourglass layout into a standardized rectangular court (78 feet long by 27 feet wide for singles), lowered the net height, and adapted the distinctive Real Tennis scoring methodology (15, 30, 40, and game). The inaugural tournament attracted twenty-two competitors and was won by Spencer Gore, firmly crystallizing the foundational architecture of the modern international tournament sport.`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'Early twelfth-century participants in jeu de paume used strung wooden rackets to hit the ball.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph A clarifies that players "initially struck a rudimentary ball... directly with their bare hands".',
        targetVocab: 'monastic'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'Ecclesiastical authorities consistently encouraged monks to play jeu de paume during prayer intervals.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph A states regional bishops repeatedly issued official proclamations attempting to ban clergy from participating.',
        targetVocab: 'courtyard'
      },
      {
        id: 3,
        type: 'TFNG',
        prompt: 'King Henry VIII built an indoor royal tennis court at Hampton Court Palace in the 1530s.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph B explicitly confirms Henry VIII commissioned the construction of a magnificent royal court at Hampton Court Palace in the 1530s.',
        targetVocab: 'nobility'
      },
      {
        id: 4,
        type: 'TFNG',
        prompt: 'Solid leather balls were highly effective at bouncing on outdoor lawn grass prior to 1844.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph C explains solid leather balls "failed to bounce on resilient turf" prior to vulcanization.',
        targetVocab: 'vulcanized'
      },
      {
        id: 5,
        type: 'TFNG',
        prompt: 'Charles Goodyear personally designed the earliest rules for Victorian lawn tennis.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph C states Goodyear patented vulcanization, while Major Wingfield designed and patented the lawn game.',
        targetVocab: 'sphairistike'
      },
      {
        id: 6,
        type: 'TFNG',
        prompt: 'Major Wingfield\'s original court design featured an hourglass perimeter rather than a rectangle.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph D and E both confirm Wingfield designed an "hourglass-shaped court tapering at the net".',
        targetVocab: 'rectilinear'
      },
      {
        id: 7,
        type: 'TFNG',
        prompt: 'Spencer Gore was awarded prize money for winning the inaugural 1877 Wimbledon tournament.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'NOT GIVEN',
        explanation: 'Paragraph E states Spencer Gore won the inaugural championship, but does not mention financial prize money.',
        targetVocab: 'inaugural'
      },
      {
        id: 8,
        type: 'SUMMARY_COMPLETION',
        prompt: 'Monks originally struck balls using only their [8].',
        options: ['bare hands', 'wooden paddles', 'leather gloves', 'curved sticks'],
        correctAnswer: 'bare hands',
        explanation: 'Paragraph A indicates participants initially struck the ball directly with their bare hands.',
        targetVocab: 'monastic'
      },
      {
        id: 9,
        type: 'SUMMARY_COMPLETION',
        prompt: 'The outdoor game was revolutionized by the patenting of [9] rubber.',
        options: ['vulcanized', 'synthetic', 'recycled', 'solidified'],
        correctAnswer: 'vulcanized',
        explanation: 'Paragraph C explains vulcanized rubber allowed hollow pressurized spheres to bounce on turf.',
        targetVocab: 'vulcanized'
      },
      {
        id: 10,
        type: 'SUMMARY_COMPLETION',
        prompt: 'Wingfield packaged boxed sets called [10] with rackets and balls.',
        options: ['Sphairistikè', 'Real Tennis', 'Croquet Lawn', 'Jeu de Paume'],
        correctAnswer: 'Sphairistikè',
        explanation: 'Paragraph D states Wingfield patented the game under the Greek name Sphairistikè.',
        targetVocab: 'sphairistike'
      },
      {
        id: 11,
        type: 'SUMMARY_COMPLETION',
        prompt: 'The All England Croquet Club held the 1877 tournament to fund repairs for a [11].',
        options: ['lawn roller', 'court fence', 'wooden clubhouse', 'grass mower'],
        correctAnswer: 'lawn roller',
        explanation: 'Paragraph E explains the club sought funds to repair its pony-driven lawn roller.',
        targetVocab: 'inaugural'
      },
      {
        id: 12,
        type: 'SUMMARY_COMPLETION',
        prompt: 'The Wimbledon committee replaced the hourglass layout with a [12] court.',
        options: ['rectangular', 'circular', 'pentagonal', 'hexagonal'],
        correctAnswer: 'rectangular',
        explanation: 'Paragraph E details that the committee revised the hourglass layout into a standardized rectangular court.',
        targetVocab: 'rectilinear'
      },
      {
        id: 13,
        type: 'SUMMARY_COMPLETION',
        prompt: 'The inaugural championship was won by [13].',
        options: ['Spencer Gore', 'Charles Goodyear', 'Walter Wingfield', 'Henry Jones'],
        correctAnswer: 'Spencer Gore',
        explanation: 'Paragraph E concludes that the tournament was won by Spencer Gore.',
        targetVocab: 'inaugural'
      }
    ]
  },
  {
    id: 'c-tennis-aerodynamics',
    cambridgeBook: 'IELTS Academic Reading Special',
    testNum: 1,
    passageNum: 3,
    title: 'Aerodynamics and Physics of the Tennis Ball',
    subtitle: 'IELTS ACADEMIC READING · APPLIED FLUID DYNAMICS & SPORTS BIOMECHANICS',
    category: 'Applied Physics & Aerodynamics',
    bandDifficulty: 'Band 7.5 - 8.5',
    timeAllowedMins: 20,
    keyVocab: ['magnus effect', 'boundary layer', 'topspin', 'turbulent', 'restitution', 'compression', 'aerodynamic', 'trajectory'],
    text: `Paragraph A
To the casual spectator, a tennis ball in flight appears to follow a straightforward parabolic trajectory dictated entirely by gravitational pull and initial launch momentum. To fluid dynamicists and sports engineers, however, the yellow sphere is a complex aerodynamic body navigating extreme air resistance, turbulent boundary layers, and rotational forces. During an elite professional match, a tennis ball can be launched from the racket face at speeds exceeding 240 kilometers per hour, spinning at rotational velocities surpassing 4,000 revolutions per minute (rpm). At these extreme kinematic thresholds, subtle alterations in ball surface topography and rotational axis produce radical deviations in trajectory.

Paragraph B
The predominant physical principle governing modern aggressive baseline tennis is the Magnus effect. When a player executes a high-velocity brushed stroke generating forward topspin, the top surface of the ball rotates directly into the oncoming relative airstream, whereas the bottom surface rotates in the same direction as the airflow. Friction between the spinning ball and surrounding air molecules creates a pressure differential: air moving over the top is decelerated, causing localized high static pressure, while air beneath is accelerated, generating low pressure. This Bernoulli-derived differential produces an instantaneous net downward force. As a result, heavy topspin forces the ball to dip steeply into the court far sooner than gravity alone would permit, enabling athletes to strike the ball with immense kinetic energy without driving it beyond the baseline.

Paragraph C
Conversely, underspin, or "slice," reverses this rotational orientation. With backspin, the Magnus force acts in an upward direction, generating aerodynamic lift that counters gravity. This lift force extends the ball's horizontal flight path, keeping it airborne longer and resulting in a characteristically low, skidding trajectory upon bouncing. However, aerodynamic lift cannot be exploited indefinitely; excessive slice creates aerodynamic wake turbulence that rapidly bleeds kinetic energy, rendering the ball susceptible to defensive counter-attack if struck without sufficient horizontal pace.

Paragraph D
One of the most counter-intuitive aspects of tennis ball physics is the functional necessity of the fibrous outer felt, commonly referred to as the "nap." While common intuition might suggest that a perfectly smooth, polished rubber sphere would travel faster through the air, fluid dynamics experiments conducted in wind tunnels reveal the exact opposite. A smooth sphere at high velocities experiences laminar boundary layer separation near its widest diameter, generating an immense low-pressure turbulent wake behind the ball that creates tremendous form drag. The fuzzy felt cover acts as a microscopic vortex generator, tripping the laminar boundary layer into early turbulence. This turbulent boundary layer possesses greater kinetic energy, clinging to the spherical contour significantly further around the rear hemisphere before separating, which shrinks the trailing low-pressure wake and substantially reduces overall drag.

Paragraph E
During the high-speed impact against the racket strings—a collision lasting a mere five to seven milliseconds—the ball undergoes severe structural deformation, compressing to less than sixty percent of its resting diameter. The ball's ability to recover its spherical geometry and return energy to the trajectory is dictated by its coefficient of restitution (COR). Because rubber exhibits viscoelastic hysteresis, approximately forty-five percent of impact energy is dissipated internally as thermal friction. Furthermore, ambient environmental conditions exert a profound influence: warm temperatures increase internal gas pressure within the sealed hollow core, accelerating rebound velocity, while high relative humidity dampens the fibrous felt, increasing ball weight and elevating aerodynamic drag coefficients.`,
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt: 'A smooth tennis ball without felt travels faster through ambient air than a felted ball.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph D explains that a smooth sphere generates a larger low-pressure wake and higher drag, whereas felt reduces drag by delaying flow separation.',
        targetVocab: 'turbulent'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt: 'The Magnus force generated by topspin pushes the tennis ball downwards.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph B explicitly states that topspin creates a net downward force that forces the ball to dip steeply into the court.',
        targetVocab: 'magnus effect'
      },
      {
        id: 3,
        type: 'TFNG',
        prompt: 'Tennis ball collision against racket strings typically lasts longer than fifty milliseconds.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph E notes the collision lasts "a mere five to seven milliseconds".',
        targetVocab: 'compression'
      },
      {
        id: 4,
        type: 'TFNG',
        prompt: 'Underspin or slice creates aerodynamic lift that counters gravitational pull.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph C affirms that with backspin, the Magnus force acts in an upward direction, generating aerodynamic lift that counters gravity.',
        targetVocab: 'topspin'
      },
      {
        id: 5,
        type: 'TFNG',
        prompt: 'Warm ambient temperatures reduce the internal gas pressure inside a tennis ball.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph E specifies warm temperatures "increase internal gas pressure within the sealed hollow core".',
        targetVocab: 'restitution'
      },
      {
        id: 6,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What primary advantage does heavy topspin provide to modern tennis players?',
        options: [
          'A. It eliminates all air resistance on the ball',
          'B. It forces the ball to dip quickly, allowing harder shots within court limits',
          'C. It makes the ball entirely immune to wind gusts',
          'D. It cools down the internal temperature of the racket strings'
        ],
        correctAnswer: 'B. It forces the ball to dip quickly, allowing harder shots within court limits',
        explanation: 'Paragraph B explains topspin causes the ball to dip steeply into the court, enabling players to strike with immense kinetic energy without hitting long.',
        targetVocab: 'trajectory'
      },
      {
        id: 7,
        type: 'MULTIPLE_CHOICE',
        prompt: 'How does the fibrous felt cover affect the boundary layer of air around the ball?',
        options: [
          'A. It forces the airflow to remain strictly laminar',
          'B. It trips the boundary layer into turbulence, reducing the trailing wake',
          'C. It completely prevents the ball from rotating',
          'D. It increases the volume of the ball by over fifty percent'
        ],
        correctAnswer: 'B. It trips the boundary layer into turbulence, reducing the trailing wake',
        explanation: 'Paragraph D notes the felt acts as a vortex generator tripping the boundary layer into turbulence, shrinking the low-pressure wake.',
        targetVocab: 'boundary layer'
      },
      {
        id: 8,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What happens to nearly 45% of impact energy during the ball-string collision?',
        options: [
          'A. It is converted into acoustic resonance',
          'B. It is stored permanently in the racket handle',
          'C. It is dissipated internally as thermal friction',
          'D. It accelerates the rotational speed by 100%'
        ],
        correctAnswer: 'C. It is dissipated internally as thermal friction',
        explanation: 'Paragraph E states approximately forty-five percent of impact energy is dissipated internally as thermal friction due to hysteresis.',
        targetVocab: 'restitution'
      },
      {
        id: 9,
        type: 'MULTIPLE_CHOICE',
        prompt: 'How does high atmospheric humidity influence a tennis ball in match conditions?',
        options: [
          'A. It increases ball weight and elevates aerodynamic drag',
          'B. It doubles the ball\'s coefficient of restitution',
          'C. It eliminates the Magnus effect completely',
          'D. It transforms backspin into topspin automatically'
        ],
        correctAnswer: 'A. It increases ball weight and elevates aerodynamic drag',
        explanation: 'Paragraph E states high humidity dampens the fibrous felt, increasing ball weight and elevating aerodynamic drag coefficients.',
        targetVocab: 'aerodynamic'
      },
      {
        id: 10,
        type: 'SUMMARY_COMPLETION',
        prompt: 'Topspin causes localized [10] pressure above the spinning ball.',
        options: ['high', 'low', 'zero', 'negative'],
        correctAnswer: 'high',
        explanation: 'Paragraph B explains air decelerates above the ball, causing localized high static pressure.',
        targetVocab: 'magnus effect'
      },
      {
        id: 11,
        type: 'SUMMARY_COMPLETION',
        prompt: 'The felt cover delays flow separation around the [11] hemisphere of the ball.',
        options: ['rear', 'front', 'inner', 'lower'],
        correctAnswer: 'rear',
        explanation: 'Paragraph D states the turbulent boundary layer clings further around the rear hemisphere before separating.',
        targetVocab: 'boundary layer'
      },
      {
        id: 12,
        type: 'SUMMARY_COMPLETION',
        prompt: 'During impact, the ball can compress to under [12] percent of its resting diameter.',
        options: ['sixty', 'forty', 'eighty', 'ten'],
        correctAnswer: 'sixty',
        explanation: 'Paragraph E describes the ball compressing to less than sixty percent of its resting diameter.',
        targetVocab: 'compression'
      },
      {
        id: 13,
        type: 'SUMMARY_COMPLETION',
        prompt: 'The property determining how well a ball recovers its shape is the coefficient of [13].',
        options: ['restitution', 'viscosity', 'turbulence', 'inertia'],
        correctAnswer: 'restitution',
        explanation: 'Paragraph E refers to the ball returning energy via its coefficient of restitution (COR).',
        targetVocab: 'restitution'
      }
    ]
  }
];

/**
 * Match the best Cambridge IELTS Passage based on user's vocabulary notebook
 */
export function matchBestPassageByVocab(userWords: string[]): {
  passage: CambridgePassage;
  matchedWords: string[];
  hitCount: number;
} {
  if (!userWords || userWords.length === 0) {
    return {
      passage: CAMBRIDGE_IELTS_PASSAGES[0],
      matchedWords: [],
      hitCount: 0
    };
  }

  const normalizedUserWords = userWords.map(w => w.trim().toLowerCase()).filter(Boolean);
  let bestPassage = CAMBRIDGE_IELTS_PASSAGES[0];
  let maxHitCount = 0;
  let bestMatchedWords: string[] = [];

  for (const passage of CAMBRIDGE_IELTS_PASSAGES) {
    const passageTextLower = (passage.text + ' ' + passage.title + ' ' + passage.keyVocab.join(' ')).toLowerCase();
    const matched: string[] = [];

    for (const w of normalizedUserWords) {
      if (w.length < 2) continue;
      const regex = new RegExp(`\\b${w}`, 'i');
      if (regex.test(passageTextLower)) {
        matched.push(w);
      }
    }

    if (matched.length > maxHitCount) {
      maxHitCount = matched.length;
      bestPassage = passage;
      bestMatchedWords = matched;
    }
  }

  return {
    passage: bestPassage,
    matchedWords: bestMatchedWords,
    hitCount: maxHitCount > 0 ? maxHitCount : 0
  };
}

/**
 * Calculate hit stats for all passages given a list of user notebook words and optional custom passages
 */
export function getPassagesWithHitStats(
  userWords: string[],
  customPassages: CambridgePassage[] = []
): Array<{
  passage: CambridgePassage;
  matchedWords: string[];
  hitCount: number;
}> {
  const normalizedUserWords = (userWords || []).map(w => w.trim().toLowerCase()).filter(Boolean);
  const combined = [...customPassages, ...CAMBRIDGE_IELTS_PASSAGES];

  return combined.map(passage => {
    const passageTextLower = (passage.text + ' ' + passage.title + ' ' + passage.keyVocab.join(' ')).toLowerCase();
    const matched: string[] = [];

    for (const w of normalizedUserWords) {
      if (w.length < 2) continue;
      const regex = new RegExp(`\\b${w}`, 'i');
      if (regex.test(passageTextLower)) {
        matched.push(w);
      }
    }

    return {
      passage,
      matchedWords: matched,
      hitCount: matched.length
    };
  }).sort((a, b) => b.hitCount - a.hitCount);
}
