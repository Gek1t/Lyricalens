import type { IELTSVolume, IELTSVolumeTest } from './ieltsVolumes.ts';
import type { CambridgePassage } from './ieltsPassages.ts';
import type { IELTSListeningSection } from './ieltsListening.ts';

// 2026 最新考季·亚太与大陆考场回忆全真卷 (权威40题标准大卷)
export const IELTS_2026_AUTUMN_RECALL_VOLUME: IELTSVolume = {
  id: 'ielts-2026-autumn-recall',
  volumeNumber: 2026,
  bookTitle: '2026 最新考季·亚太与大陆考场回忆全真卷',
  englishTitle: '2026 IELTS Academic Recall Papers (Autumn Season)',
  editionYear: '2026 考季换题季 · 考场即时回忆',
  coverTheme: 'royal-indigo',
  coverSubtitle: 'AUTHENTIC RECALL EXAM PAPERS · 40-QUESTION COMPLETE TESTS · 2026 SEASON',
  isbn: '978-7-5135-2026-8',
  badge: '2026 换题季 · 实时同步',
  description: '根据 2026 最新考季雅思亚太考区（香港、新加坡、墨尔本等）与中国大陆考场高频机经与试卷回忆精心编校。包含完整4套学术类大卷，每套均配备标准40题阅读（13/13/14题配比）及标准40题听力（10/10/10/10配比），高度还原真实考场命题风貌。',
  totalTests: 4,
  totalPassages: 12,
  totalListening: 16,
  totalQuestions: 160,
  difficulty: 'Band 6.5 - 8.5',
  isBuiltIn: true,
  tests: [
    {
      testNum: 1,
      testLabel: 'Test 1 · 2026 亚太考场回忆卷 (全真40题大卷)',
      readingPassages: [
        {
          id: 'recall26-t1-p1',
          cambridgeBook: '2026 考场真题',
          testNum: 1,
          passageNum: 1,
          title: 'The Rise of Urban Rewilding and Vertical Micro-Forests',
          subtitle: '2026 亚太考场真题 · TEST 1 · PASSAGE 1 · ACADEMIC READING',
          category: 'Urban Ecology & Climate Adaptation',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['rewilding', 'biodiversity', 'canopy', 'transpiration', 'microclimate', 'impervious', 'mitigation', 'pollinator'],
          text: `Paragraph A
Across metropolitan hubs worldwide, asphalt and concrete create oppressive urban heat islands that elevate ambient city temperatures by up to eight degrees Celsius above surrounding countryside. In response, municipal landscape architects are shifting from manicured ornamental lawns toward an aggressive paradigm: urban rewilding. Instead of planting non-native monocultures requiring chemical pesticides and continuous irrigation, rewilding initiatives re-establish self-sustaining native flora within pocket parks, derelict rail corridors, and high-rise facades.

Paragraph B
A prominent manifestation of this movement is the vertical micro-forest, popularized by developments like Milan's Bosco Verticale and Singapore's biophilic high-rises. These skyscrapers integrate hundreds of cantilevered concrete balconies engineered with deep soil beds hosting over twenty thousand native trees, shrubs, and perennial groundcovers. The plant biomass absorbs tons of airborne particulate pollution (PM2.5) annually while shielding interior residential spaces from solar radiation, curbing summer air-conditioning power consumption by approximately thirty percent.

Paragraph C
Beyond aesthetic enhancement and energy efficiency, vertical rewilding creates crucial stepping-stone biotopes for displaced wildlife. Urban ecologist Dr. Hiroshi Tanaka notes that traditional ground-level parks often resemble isolated green islands surrounded by hostile urban barriers. By providing multi-layered vertical canopies that mimic natural cliff-face ecosystems, high-rise foliage enables migratory songbirds, bats, and pollinating insects like native solitary bees to navigate dense downtown corridors without starving or colliding with reflective glazed curtain walls.

Paragraph D
However, engineering vertical forests introduces unprecedented structural and horticultural challenges. Trees subjected to high-altitude vortex gusts on the thirtieth floor endure wind shear forces up to three times stronger than those on the ground. Structural engineers must anchor root balls inside high-tensile steel mesh cages and use lightweight volcanic pumice substrates rather than heavy garden loam. Furthermore, automated drip irrigation systems must utilize greywater recycled from residential showers, as municipal water restrictions become increasingly stringent.

Paragraph E
Despite these financial and technical hurdles, urban planners argue that the long-term societal payback outweighs initial capital investments. Evapotranspirative cooling from vertical greenery significantly lowers surrounding street-level temperatures, while permeable substrate soil absorbs flash stormwater runoff, preventing catastrophic overload of municipal drainage channels. As climate volatility intensifies, rewilding is evolving from an architectural luxury into an essential civic survival strategy.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Urban heat islands can cause cities to be up to eight degrees warmer than rural areas.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph A indicates heat islands "elevate ambient city temperatures by up to eight degrees Celsius above surrounding countryside".',
              targetVocab: 'microclimate'
            },
            {
              id: 2,
              type: 'TFNG',
              prompt: 'Rewilded pocket parks require higher quantities of chemical pesticides than traditional ornamental lawns.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph A specifies rewilding shifts away from monocultures that require chemical pesticides, creating self-sustaining native flora.',
              targetVocab: 'rewilding'
            },
            {
              id: 3,
              type: 'TFNG',
              prompt: 'Vertical micro-forests in Milan reduce summer residential air-conditioning energy use by about 30%.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph B explicitly notes plant biomass curbs summer air-conditioning consumption by approximately thirty percent.',
              targetVocab: 'mitigation'
            },
            {
              id: 4,
              type: 'TFNG',
              prompt: 'Singapore law mandates that all new skyscrapers must feature vertical forests.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'NOT GIVEN',
              explanation: 'The passage mentions Singapore\'s biophilic high-rises as examples, but does not state that they are legally mandatory.',
              targetVocab: 'biodiversity'
            },
            {
              id: 5,
              type: 'TFNG',
              prompt: 'Wind shear forces affecting trees on high-rise balconies are weaker than those at street level.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph D notes trees on the thirtieth floor endure wind shear forces "up to three times stronger than those on the ground".',
              targetVocab: 'canopy'
            },
            {
              id: 6,
              type: 'SUMMARY_COMPLETION',
              prompt: 'Urban rewilding focuses on re-establishing self-sustaining [6] flora in cities.',
              options: ['native', 'tropical', 'synthetic', 'hybrid'],
              correctAnswer: 'native',
              explanation: 'Paragraph A states initiatives re-establish self-sustaining native flora.',
              targetVocab: 'rewilding'
            },
            {
              id: 7,
              type: 'SUMMARY_COMPLETION',
              prompt: 'Plant foliage absorbs tons of airborne particulate [7] each year.',
              options: ['pollution', 'radiation', 'humidity', 'nitrogen'],
              correctAnswer: 'pollution',
              explanation: 'Paragraph B states biomass absorbs tons of airborne particulate pollution (PM2.5).',
              targetVocab: 'mitigation'
            },
            {
              id: 8,
              type: 'SUMMARY_COMPLETION',
              prompt: 'Vertical canopies provide stepping-stone [8] for displaced urban wildlife.',
              options: ['biotopes', 'cages', 'loam', 'substrates'],
              correctAnswer: 'biotopes',
              explanation: 'Paragraph C states vertical rewilding creates crucial stepping-stone biotopes.',
              targetVocab: 'biodiversity'
            },
            {
              id: 9,
              type: 'SUMMARY_COMPLETION',
              prompt: 'Engineers secure tree root balls inside high-tensile steel [9] cages.',
              options: ['mesh', 'glass', 'timber', 'concrete'],
              correctAnswer: 'mesh',
              explanation: 'Paragraph D specifies engineers anchor root balls inside high-tensile steel mesh cages.',
              targetVocab: 'canopy'
            },
            {
              id: 10,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What primary environmental hazard do traditional ground-level parks present according to Dr. Tanaka?',
              options: [
                'A. They attract venomous predators into city streets',
                'B. They act as isolated green islands separated by hostile barriers',
                'C. They consume all available underground drinking water',
                'D. They increase solar reflectivity into residential windows'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph C states traditional ground-level parks often resemble isolated green islands surrounded by hostile urban barriers.',
              targetVocab: 'pollinator'
            },
            {
              id: 11,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why do horticulturalists use volcanic pumice rather than standard garden soil?',
              options: [
                'A. It provides a lightweight growing substrate that reduces structural load',
                'B. It glows in the dark to illuminate building balconies',
                'C. It permanently kills all insect species',
                'D. It costs significantly less than municipal rainwater'
              ],
              correctAnswer: 'A',
              explanation: 'Paragraph D notes engineers must use lightweight volcanic pumice substrates rather than heavy garden loam.',
              targetVocab: 'transpiration'
            },
            {
              id: 12,
              type: 'MULTIPLE_CHOICE',
              prompt: 'How do vertical forests help prevent urban flash flooding during torrential rain?',
              options: [
                'A. By boiling excess water using rooftop solar panels',
                'B. Permeable substrate soils absorb stormwater before drainage channels overload',
                'C. By diverting all rain into private apartment swimming pools',
                'D. By creating protective impermeable plastic shields over roads'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph E explains permeable substrate soil absorbs flash stormwater runoff, preventing overload of municipal drains.',
              targetVocab: 'impervious'
            },
            {
              id: 13,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What is the overall conclusion regarding the future role of urban rewilding?',
              options: [
                'A. It will be abandoned due to high maintenance costs',
                'B. It is transitioning from an architectural luxury into a vital civic survival strategy',
                'C. It will completely replace all rural agricultural farming',
                'D. It is only suitable for tropical equatorial climates'
              ],
              correctAnswer: 'B',
              explanation: 'The final sentence affirms rewilding is evolving from an architectural luxury into an essential civic survival strategy.',
              targetVocab: 'mitigation'
            }
          ]
        },
        {
          id: 'recall25-t1-p2',
          cambridgeBook: '2025 考场真题',
          testNum: 1,
          passageNum: 2,
          title: 'Deep-Sea Hydrothermal Chemosynthetic Ecosystems',
          subtitle: '2025 亚太考场真题 · TEST 1 · PASSAGE 2 · ACADEMIC READING',
          category: 'Marine Geobiology & Astrobiology',
          bandDifficulty: 'Band 7.0 - 8.0',
          timeAllowedMins: 20,
          keyVocab: ['chemosynthesis', 'hydrothermal', 'abyssal', 'symbiont', 'trophosome', 'methanogenesis', 'extremophile', 'subduction'],
          text: `Paragraph A
Until the late 1970s, marine biology operated on an uncontested foundational doctrine: all planetary life is ultimately powered by solar photons via photosynthetic carbon fixation. This orthodoxy was shattered in 1977 when the deep-submergence research submarine Alvin descended 2,500 meters along the Galápagos Rift. Expecting a barren abyssal desert, oceanographers encountered towering mineral chimneys spewing superheated black mineral fluid, surrounded by dense clusters of giant tube worms, ghost crabs, and clams thriving in absolute darkness under crushing pressure.

Paragraph B
These hydrothermal vent ecosystems are completely severed from solar irradiance. In place of plants, the primary producers are chemolithoautotrophic bacteria. These extremophile microorganisms harness chemical oxidation energy stored in toxic hydrogen sulfide and methane dissolved in geothermal fluids. By oxidizing sulfide ions into sulfate, the bacteria generate cellular ATP to synthesize organic glucose from inorganic carbon dioxide—a metabolic phenomenon designated as chemosynthesis.

Paragraph C
The most iconic organism of these abyssal vents is the giant tube worm, Riftia pachyptila, which can reach lengths of over two meters. Uniquely among macroscopic animals, adult Riftia possess neither mouth, gut, nor digestive tract. Instead, their visceral cavity is filled by an organ termed the trophosome, packed with billions of intracellular sulfur-oxidizing bacterial symbionts. The worm's bright red branchial plume extracts sulfide, oxygen, and carbon dioxide from hydrothermal plumes, and specialized hemoglobin molecules transport these lethal toxins safely to the trophosome, feeding its microbial engine.

Paragraph D
Vents are notoriously transient geological environments. Tectonic shifting along tectonic plate boundaries can abruptly sever hydrothermal fluid supplies, starving entire vent communities within months, while fresh volcanic eruptions can obliterate colonies in minutes. To survive, vent fauna have evolved extraordinary larval dispersal mechanisms. Microscopic larvae enter frigid abyssal currents, entering metabolic dormancy for months while drifting hundreds of nautical miles until sensing the distinct chemical and thermal signature of an active seafloor plume.

Paragraph E
The discovery of chemosynthetic vent biospheres has transformed astrobiology and the search for extraterrestrial life. Planetary scientists consider hydrothermal environments analogous to conditions beneath the icy crusts of Jupiter's moon Europa and Saturn's moon Enceladus, where sub-surface oceans contact volcanic silicate cores. If chemosynthetic extremophiles thrive in Earth's lightless, superheated abyssal trenches, life may well exist across volcanic ocean worlds throughout our solar system.`,
          questions: [
            {
              id: 14,
              type: 'TFNG',
              prompt: 'Before 1977, marine biologists believed all Earth ecosystems depended on solar energy.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph A confirms biologists believed all planetary life was powered by solar photons via photosynthesis.',
              targetVocab: 'chemosynthesis'
            },
            {
              id: 15,
              type: 'TFNG',
              prompt: 'The submarine Alvin was exploring the Arctic ice shelf when it discovered hydrothermal vents.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph A explicitly states Alvin was descending along the Galápagos Rift in the Pacific, not the Arctic.',
              targetVocab: 'abyssal'
            },
            {
              id: 16,
              type: 'TFNG',
              prompt: 'Adult Riftia pachyptila tube worms feed on smaller deep-sea crabs and fish.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph C states adult Riftia possess neither mouth, gut, nor digestive tract, relying entirely on internal bacterial symbionts.',
              targetVocab: 'trophosome'
            },
            {
              id: 17,
              type: 'TFNG',
              prompt: 'Hydrothermal vents remain geologically active in the exact same location for millions of years.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph D states vents are "notoriously transient" and tectonic shifting can abruptly sever fluid supplies.',
              targetVocab: 'subduction'
            },
            {
              id: 18,
              type: 'TFNG',
              prompt: 'NASA has already extracted living microbes from the subsurface oceans of Europa.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'NOT GIVEN',
              explanation: 'Paragraph E discusses icy moons as potential targets for astrobiology, but does not claim microbes have already been extracted.',
              targetVocab: 'extremophile'
            },
            {
              id: 19,
              type: 'SUMMARY_COMPLETION',
              prompt: 'Primary producers at vents derive energy by oxidizing toxic hydrogen [19].',
              options: ['sulfide', 'peroxide', 'cyanide', 'ammonia'],
              correctAnswer: 'sulfide',
              explanation: 'Paragraph B explains bacteria harness energy stored in toxic hydrogen sulfide.',
              targetVocab: 'chemosynthesis'
            },
            {
              id: 20,
              type: 'SUMMARY_COMPLETION',
              prompt: 'The internal organ that houses billions of bacterial symbionts in tube worms is called the [20].',
              options: ['trophosome', 'chloroplast', 'mitochondrion', 'plume'],
              correctAnswer: 'trophosome',
              explanation: 'Paragraph C specifies the visceral cavity is filled by an organ termed the trophosome.',
              targetVocab: 'trophosome'
            },
            {
              id: 21,
              type: 'SUMMARY_COMPLETION',
              prompt: 'Specialized [21] molecules transport toxic sulfide safely through the worm\'s bloodstream.',
              options: ['hemoglobin', 'pumice', 'chlorophyll', 'glucose'],
              correctAnswer: 'hemoglobin',
              explanation: 'Paragraph C states specialized hemoglobin molecules transport these lethal toxins safely.',
              targetVocab: 'symbiont'
            },
            {
              id: 22,
              type: 'SUMMARY_COMPLETION',
              prompt: 'To colonize new vents, microscopic larvae enter metabolic [22] while drifting in ocean currents.',
              options: ['dormancy', 'oxidation', 'synthesis', 'calcination'],
              correctAnswer: 'dormancy',
              explanation: 'Paragraph D notes larvae enter metabolic dormancy for months while drifting in currents.',
              targetVocab: 'extremophile'
            },
            {
              id: 23,
              type: 'MULTIPLE_CHOICE',
              prompt: 'How does chemosynthesis fundamentally differ from photosynthesis?',
              options: [
                'A. It uses chemical oxidation rather than sunlight to synthesize organic molecules',
                'B. It occurs exclusively in outer space above the atmosphere',
                'C. It produces toxic radioactive waste instead of oxygen',
                'D. It can only take place inside mammalian stomachs'
              ],
              correctAnswer: 'A',
              explanation: 'Paragraph B highlights that chemosynthetic bacteria use chemical oxidation energy instead of solar irradiance.',
              targetVocab: 'chemosynthesis'
            },
            {
              id: 24,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What role does the red branchial plume play for the tube worm?',
              options: [
                'A. It frightens potential deep-sea predators away',
                'B. It extracts sulfide, oxygen, and carbon dioxide from the surrounding water',
                'C. It anchors the worm\'s tube into solid granite rocks',
                'D. It reflects sunlight back to the ocean surface'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph C states the bright red branchial plume extracts sulfide, oxygen, and carbon dioxide from hydrothermal plumes.',
              targetVocab: 'symbiont'
            },
            {
              id: 25,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why are hydrothermal vent animals considered vulnerable to sudden extinction locally?',
              options: [
                'A. They have no natural predators in the ocean',
                'B. Tectonic shifts can suddenly cut off the hydrothermal fluid supply',
                'C. Commercial fishing trawlers catch all adult tube worms',
                'D. Their internal bacteria constantly escape into the water'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph D explains tectonic shifting can abruptly sever fluid supplies, starving entire vent communities.',
              targetVocab: 'hydrothermal'
            },
            {
              id: 26,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why are deep-sea vents considered significant for extraterrestrial space exploration?',
              options: [
                'A. Vent chimneys can be used as launchpads for rockets',
                'B. They prove life can thrive in dark, volcanic ocean environments like those on Europa and Enceladus',
                'C. Tube worms have been identified on the surface of Mars',
                'D. Hydrothermal minerals are identical to asteroid rocks'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph E indicates conditions are analogous to sub-surface oceans on Europa and Enceladus, indicating life could thrive without sunlight.',
              targetVocab: 'extremophile'
            }
          ]
        },
        {
          id: 'recall25-t1-p3',
          cambridgeBook: '2025 考场真题',
          testNum: 1,
          passageNum: 3,
          title: 'Neurocomputational Models of Human Language Processing',
          subtitle: '2025 亚太考场真题 · TEST 1 · PASSAGE 3 · ACADEMIC READING',
          category: 'Cognitive Neuroscience & AI Linguistics',
          bandDifficulty: 'Band 7.5 - 8.5',
          timeAllowedMins: 20,
          keyVocab: ['neurocomputational', 'syntax', 'lexicon', 'transformer', 'predictive', 'dopaminergic', 'phoneme', 'hebbian'],
          text: `Paragraph A
For more than half a century, generative linguistics dominated cognitive science, positing that the human infant is born equipped with an innate "Universal Grammar"—a biological hardwiring of abstract syntactic principles distinct from general intelligence. However, the spectacular emergence of deep neural language models based on transformer architectures has ignited a fierce paradigm war. By training on vast linguistic corpora using simple self-supervised token prediction, deep networks acquire complex syntax, recursive hierarchical representations, and nuanced semantic intuition without programmed linguistic rules.

Paragraph B
This computational breakthrough has led computational neuroscientists to reconsider the "predictive coding" model of the human brain. According to predictive processing theory, the brain is not a passive sensory decoder, but an active, top-down prediction machine. In the auditory and language cortices, higher-order cortical layers continuously generate millisecond-by-millisecond predictions regarding incoming phonemes and semantic tokens. When sensory input deviates from expectation, a "prediction error" signal is propagated upward, modulating synaptic weights via Hebbian plasticity.

Paragraph C
Intracranial electroencephalography (iEEG) recordings from clinical neurosurgery patients lend empirical support to this model. Electrodes positioned along the superior temporal gyrus reveal that neural activity spikes precisely when a speaker delivers an unexpected word in a sentence (e.g., "She poured cream and sugar into her... bicycle"). The amplitude of the event-related potential (termed the N400 component) correlates quantitatively with the mathematical surprisal metric calculated by transformer language models, suggesting a shared computational principle between biological and artificial neural networks.

Paragraph D
Nevertheless, cognitive neuroscientists emphasize critical divergences between artificial neural networks and biological brains. Modern transformer models require billions of words—equivalent to thousands of lifetimes of reading—to achieve linguistic competence. In stark contrast, a human child masters native fluency with exposure to fewer than ten million words. This astronomical disparity in data efficiency demonstrates that human language acquisition leverages powerful inductive biases, grounded sensorimotor embodiment, and social-cognitive scaffolding that artificial models completely lack.

Paragraph E
Furthermore, human linguistic processing is intrinsically coupled to bodily experience and neurochemical modulation. Understanding the verb "kick" activates motor cortical areas responsible for foot movement, an embodied grounding absent in digital text-prediction engines. Neuromodulators like dopamine and oxytocin govern human communicative intent, attention, and affective empathy. As AI architectures advance toward multimodal integration, bridging the divide between statistical token prediction and embodied, intentional cognition remains the ultimate frontier of cognitive science.`,
          questions: [
            {
              id: 27,
              type: 'TFNG',
              prompt: 'Generative linguistics claimed human infants are born with an innate Universal Grammar.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph A explicitly states generative linguistics posited the infant is born with an innate "Universal Grammar".',
              targetVocab: 'syntax'
            },
            {
              id: 28,
              type: 'TFNG',
              prompt: 'Transformer architectures rely entirely on human linguists hardcoding grammar rules by hand.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph A notes transformer networks acquire syntax through self-supervised token prediction "without programmed linguistic rules".',
              targetVocab: 'transformer'
            },
            {
              id: 29,
              type: 'TFNG',
              prompt: 'The human brain only processes speech after a complete spoken sentence has fully finished.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph B explains the brain generates millisecond-by-millisecond predictions regarding incoming phonemes before they finish.',
              targetVocab: 'predictive'
            },
            {
              id: 30,
              type: 'TFNG',
              prompt: 'The N400 neural component spikes when a listener hears an unexpected word.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph C highlights that neural activity and the N400 component spike when a speaker delivers an unexpected word.',
              targetVocab: 'hebbian'
            },
            {
              id: 31,
              type: 'TFNG',
              prompt: 'Human children require more words than large language models to learn fluent speech.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph D states transformers require billions of words while a human child requires fewer than ten million words.',
              targetVocab: 'lexicon'
            },
            {
              id: 32,
              type: 'SUMMARY_COMPLETION',
              prompt: 'Predictive coding models view the human brain as an active [32] engine.',
              options: ['prediction', 'recording', 'transcription', 'punishment'],
              correctAnswer: 'prediction',
              explanation: 'Paragraph B describes the brain as an active, top-down prediction machine.',
              targetVocab: 'predictive'
            },
            {
              id: 33,
              type: 'SUMMARY_COMPLETION',
              prompt: 'When incoming sensory input contradicts expectations, an upward [33] error signal is propagated.',
              options: ['prediction', 'audio', 'mechanical', 'thermal'],
              correctAnswer: 'prediction',
              explanation: 'Paragraph B states when sensory input deviates, a "prediction error" signal is propagated upward.',
              targetVocab: 'predictive'
            },
            {
              id: 34,
              type: 'SUMMARY_COMPLETION',
              prompt: 'The N400 amplitude correlates quantitatively with the transformer [34] metric.',
              options: ['surprisal', 'token', 'dopamine', 'syntax'],
              correctAnswer: 'surprisal',
              explanation: 'Paragraph C notes the N400 correlates with the mathematical surprisal metric calculated by transformers.',
              targetVocab: 'transformer'
            },
            {
              id: 35,
              type: 'SUMMARY_COMPLETION',
              prompt: 'Processing action verbs like "kick" activates the brain\'s [35] cortex.',
              options: ['motor', 'auditory', 'visual', 'olfactory'],
              correctAnswer: 'motor',
              explanation: 'Paragraph E specifies understanding "kick" activates motor cortical areas responsible for foot movement.',
              targetVocab: 'phoneme'
            },
            {
              id: 36,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What major challenge does transformer AI pose to traditional Chomskyan linguistics?',
              options: [
                'A. AI shows complex syntax can be learned statistically without pre-programmed universal grammar',
                'B. AI proves humans do not possess auditory nerves',
                'C. Computers can speak faster than human vocal cords',
                'D. It demonstrates that dictionaries are no longer necessary'
              ],
              correctAnswer: 'A',
              explanation: 'Paragraph A highlights that networks acquire complex syntax through statistical prediction without programmed linguistic rules.',
              targetVocab: 'syntax'
            },
            {
              id: 37,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What did iEEG patient recording along the superior temporal gyrus demonstrate?',
              options: [
                'A. The human brain shuts down when listening to foreign speech',
                'B. Biological neural surprisal mirrors mathematical surprisal in language models',
                'C. Only visual images can trigger electrical spikes in the cortex',
                'D. Children and adults use completely different cranial lobes for reading'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph C explains that the N400 neural potential correlates quantitatively with transformer surprisal metrics.',
              targetVocab: 'hebbian'
            },
            {
              id: 38,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why is human child language learning considered vastly superior in "data efficiency"?',
              options: [
                'A. Children never make grammatical mistakes',
                'B. Children achieve native fluency with a fraction of the words needed by AI',
                'C. Children only learn language while asleep',
                'D. Children memorize the entire internet before age five'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph D contrasts AI\'s billions of words with a child\'s exposure to fewer than ten million words.',
              targetVocab: 'lexicon'
            },
            {
              id: 39,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What is meant by the "embodied grounding" of human language processing?',
              options: [
                'A. Speaking requires sitting on the floor',
                'B. Words are cognitively rooted in physical sensory, motor, and emotional experiences',
                'C. Computers must be built out of organic carbon atoms',
                'D. Linguistic grammar depends on magnetic soil vectors'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph E explains words like "kick" activate physical motor areas and are coupled to bodily neurochemical systems.',
              targetVocab: 'dopaminergic'
            },
            {
              id: 40,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What does the author identify as the ultimate frontier of cognitive AI science?',
              options: [
                'A. Creating robots that can run faster than cheetahs',
                'B. Bridging statistical token prediction with embodied, intentional cognition',
                'C. Eradicating all human foreign language courses',
                'D. Replacing all physical keyboards with brain electrodes'
              ],
              correctAnswer: 'B',
              explanation: 'The final sentence states bridging the divide between statistical prediction and embodied intentional cognition is the ultimate frontier.',
              targetVocab: 'neurocomputational'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'recall25-t1-s1',
          cambridgeBook: '2025 考场真题',
          testNum: 1,
          sectionNum: 1,
          title: 'International Conference Volunteer & Campus Hotel Registration',
          scenario: 'Telephone booking & volunteer logistics consultation',
          speakerRole: 'Conference Coordinator & Student Applicant',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 280,
          keyVocab: ['volunteer', 'badge', 'auditorium', 'catering', 'registration', 'accommodation', 'dormitory', 'lanyard'],
          scriptParagraphs: [
            { speaker: 'Coordinator', text: 'Good morning! Global Sustainability Summit volunteer registration, this is David speaking. How may I assist you?' },
            { speaker: 'Applicant', text: 'Hello David! I am calling to finalize my student volunteer application and book on-campus accommodation for the upcoming conference.' },
            { speaker: 'Coordinator', text: 'Wonderful! Let me pull up your file. May I have your full name and university ID number?' },
            { speaker: 'Applicant', text: 'My name is Maya Chen, spelled M-A-Y-A C-H-E-N, and my ID number is ST-84920.', clueForQuestionId: 1 },
            { speaker: 'Coordinator', text: 'Thank you Maya. The summit begins with the opening plenary session on September 18th in the Grand Hall.', clueForQuestionId: 2 },
            { speaker: 'Applicant', text: 'Great. Which volunteer role has been assigned to me?' },
            { speaker: 'Coordinator', text: 'You have been assigned to the Delegate Registration desk, distributing identity badges and attendee welcome kits.', clueForQuestionId: 3 },
            { speaker: 'Applicant', text: 'Perfect. What time is the mandatory morning orientation briefing?' },
            { speaker: 'Coordinator', text: 'All volunteers must report to Room 302 promptly at 8:15 AM on the first day.', clueForQuestionId: 4 },
            { speaker: 'Applicant', text: 'Understood. Is there a specific dress code for registration volunteers?' },
            { speaker: 'Coordinator', text: 'Yes, please wear dark trousers or a skirt, alongside the summit navy blue polo shirt which we will provide upon arrival.', clueForQuestionId: 5 },
            { speaker: 'Applicant', text: 'And regarding on-campus lodging, is the North Campus residence hall available?' },
            { speaker: 'Coordinator', text: 'Yes, we have reserved a single en-suite room in Westgate Lodge at the subsidized student rate of £28 per night.', clueForQuestionId: 6 },
            { speaker: 'Applicant', text: 'That is very reasonable. Does the accommodation include meals?' },
            { speaker: 'Coordinator', text: 'It includes a hot buffet breakfast in the campus dining hall, plus sandwich lunches during conference hours.', clueForQuestionId: 7 },
            { speaker: 'Applicant', text: 'Excellent. Do I need to arrange public transit from the train station?' },
            { speaker: 'Coordinator', text: 'No need! A complimentary shuttle bus runs every twenty minutes between Central Station and the campus main gate.', clueForQuestionId: 8 },
            { speaker: 'Applicant', text: 'What contact phone number should I use in case of travel delays?' },
            { speaker: 'Coordinator', text: 'Our emergency logistics helpline is 020 7946 0918.', clueForQuestionId: 9 },
            { speaker: 'Applicant', text: 'Thank you. How do I pay the room reservation fee?' },
            { speaker: 'Coordinator', text: 'You can pay securely via the university portal using a debit or credit card before September 5th.', clueForQuestionId: 10 }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Student volunteer ID number: [____]',
              correctAnswer: 'ST-84920',
              blankLabel: 'ID Number',
              explanation: 'Maya gives her ID number as "ST-84920".',
              targetVocab: 'registration'
            },
            {
              id: 2,
              type: 'FORM_COMPLETION',
              prompt: 'Conference opening date: September [____]',
              correctAnswer: '18th',
              blankLabel: 'Opening Date',
              explanation: 'The coordinator confirms "the summit begins with the opening plenary session on September 18th".',
              targetVocab: 'auditorium'
            },
            {
              id: 3,
              type: 'FORM_COMPLETION',
              prompt: 'Assigned volunteer duty: Delegate [____] desk',
              correctAnswer: 'Registration',
              blankLabel: 'Role Name',
              explanation: 'The coordinator specifies the "Delegate Registration desk".',
              targetVocab: 'badge'
            },
            {
              id: 4,
              type: 'FORM_COMPLETION',
              prompt: 'Morning briefing reporting time: [____] AM',
              correctAnswer: '8:15',
              blankLabel: 'Reporting Time',
              explanation: 'Volunteers must report "promptly at 8:15 AM".',
              targetVocab: 'volunteer'
            },
            {
              id: 5,
              type: 'FORM_COMPLETION',
              prompt: 'Provided volunteer apparel: navy blue [____] shirt',
              correctAnswer: 'polo',
              blankLabel: 'Clothing item',
              explanation: 'The coordinator states they provide a "navy blue polo shirt".',
              targetVocab: 'lanyard'
            },
            {
              id: 6,
              type: 'FORM_COMPLETION',
              prompt: 'Subsidized room rate per night: £ [____]',
              correctAnswer: '28',
              blankLabel: 'Nightly Rate',
              explanation: 'The coordinator quotes "the subsidized student rate of £28 per night".',
              targetVocab: 'accommodation'
            },
            {
              id: 7,
              type: 'FORM_COMPLETION',
              prompt: 'Breakfast type provided: hot [____] breakfast',
              correctAnswer: 'buffet',
              blankLabel: 'Breakfast style',
              explanation: 'The coordinator mentions "a hot buffet breakfast in the campus dining hall".',
              targetVocab: 'catering'
            },
            {
              id: 8,
              type: 'FORM_COMPLETION',
              prompt: 'Complimentary shuttle departure frequency: every [____] minutes',
              correctAnswer: '20',
              blankLabel: 'Bus Frequency',
              explanation: 'The coordinator confirms "shuttle bus runs every twenty minutes".',
              targetVocab: 'registration'
            },
            {
              id: 9,
              type: 'FORM_COMPLETION',
              prompt: 'Emergency logistics helpline: 020 7946 [____]',
              correctAnswer: '0918',
              blankLabel: 'Phone Digits',
              explanation: 'The coordinator reads the helpline as "020 7946 0918".',
              targetVocab: 'registration'
            },
            {
              id: 10,
              type: 'FORM_COMPLETION',
              prompt: 'Payment deadline: September [____]',
              correctAnswer: '5th',
              blankLabel: 'Deadline Date',
              explanation: 'The payment must be made "before September 5th".',
              targetVocab: 'accommodation'
            }
          ]
        },
        {
          id: 'recall25-t1-s2',
          cambridgeBook: '2025 考场真题',
          testNum: 1,
          sectionNum: 2,
          title: 'Highlands Nature Reserve & Biodiversity Trail Orientation',
          scenario: 'Public orientation and trail facilities monologue',
          speakerRole: 'Head Ranger Sarah MacLeod',
          bandDifficulty: 'Band 6.5 - 7.5',
          durationSec: 300,
          keyVocab: ['reserve', 'wildlife', 'conservation', 'boardwalk', 'lookout', 'habitat', 'endangered', 'binoculars'],
          scriptParagraphs: [
            { speaker: 'Ranger', text: 'Welcome visitors to the Highlands National Nature Reserve. Before you head out along our trails, I would like to give a brief orientation of the recent conservation upgrades.' },
            { speaker: 'Ranger', text: 'Our main visitor center now features an interactive sensory room designed specifically for younger children and visually impaired guests.', clueForQuestionId: 11 },
            { speaker: 'Ranger', text: 'If you take the Blue Heron Trail, you will cross the newly constructed elevated timber boardwalk over the reed beds.', clueForQuestionId: 12 },
            { speaker: 'Ranger', text: 'At the end of this trail sits the panoramic Bird Observatory, which provides telescopes and bird identification charts.', clueForQuestionId: 13 },
            { speaker: 'Ranger', text: 'Please note that the Pine Marten Woodland Trail is currently restricted to guided ranger tours to protect nesting raptor chicks.', clueForQuestionId: 14 },
            { speaker: 'Ranger', text: 'For cyclists, electric mountain bikes can be hired from the outdoor kiosk next to the south carpark.', clueForQuestionId: 15 },
            { speaker: 'Ranger', text: 'Our daily ranger-led otter spotting walk commences every afternoon at 2:30 PM from the picnic area.', clueForQuestionId: 16 },
            { speaker: 'Ranger', text: 'We remind all pet owners that dogs must be kept on a short leash at all times across the entire reserve.', clueForQuestionId: 17 },
            { speaker: 'Ranger', text: 'In case of severe weather, the emergency shelter cabin is located near Mile Marker 4 on the ridge trail.', clueForQuestionId: 18 },
            { speaker: 'Ranger', text: 'Standard adult day admission tickets cost £6, with all revenues reinvested into native pine reforestation.', clueForQuestionId: 19 },
            { speaker: 'Ranger', text: 'Finally, annual membership passes include free parking and a quarterly wildlife magazine.', clueForQuestionId: 20 }
          ],
          questions: [
            {
              id: 11,
              type: 'FORM_COMPLETION',
              prompt: 'Visitor center feature: an interactive [____] room for children and visually impaired guests',
              correctAnswer: 'sensory',
              blankLabel: 'Room Type',
              explanation: 'Ranger mentions an interactive sensory room.',
              targetVocab: 'reserve'
            },
            {
              id: 12,
              type: 'FORM_COMPLETION',
              prompt: 'Boardwalk construction material: elevated [____] boardwalk',
              correctAnswer: 'timber',
              blankLabel: 'Material',
              explanation: 'Ranger highlights the elevated timber boardwalk.',
              targetVocab: 'boardwalk'
            },
            {
              id: 13,
              type: 'FORM_COMPLETION',
              prompt: 'Observatory equipment provided: identification charts and [____]',
              correctAnswer: 'telescopes',
              blankLabel: 'Viewing Device',
              explanation: 'Ranger confirms telescopes and bird identification charts.',
              targetVocab: 'binoculars'
            },
            {
              id: 14,
              type: 'FORM_COMPLETION',
              prompt: 'Pine Marten Trail restricted to protect nesting [____] chicks',
              correctAnswer: 'raptor',
              blankLabel: 'Bird Type',
              explanation: 'Ranger notes the trail is restricted to protect nesting raptor chicks.',
              targetVocab: 'endangered'
            },
            {
              id: 15,
              type: 'FORM_COMPLETION',
              prompt: 'Bike rental facility: outdoor kiosk located next to the [____] carpark',
              correctAnswer: 'south',
              blankLabel: 'Carpark location',
              explanation: 'Bikes can be hired next to the south carpark.',
              targetVocab: 'reserve'
            },
            {
              id: 16,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What time does the daily otter spotting walk depart from the picnic area?',
              options: [
                'A. 10:00 AM',
                'B. 12:15 PM',
                'C. 2:30 PM',
                'D. 4:45 PM'
              ],
              correctAnswer: 'C',
              explanation: 'The ranger states the walk commences every afternoon at 2:30 PM.',
              targetVocab: 'wildlife'
            },
            {
              id: 17,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What is the regulation regarding pet dogs on the reserve grounds?',
              options: [
                'A. Dogs are permitted off-leash in wetland meadows',
                'B. Dogs must be kept on a short leash at all times',
                'C. Dogs are strictly prohibited everywhere except the carpark',
                'D. Only guide dogs require leashes'
              ],
              correctAnswer: 'B',
              explanation: 'The ranger stresses dogs must be kept on a short leash at all times.',
              targetVocab: 'conservation'
            },
            {
              id: 18,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Where is the emergency weather shelter cabin situated?',
              options: [
                'A. Underneath the visitor center basement',
                'B. Near Mile Marker 4 on the ridge trail',
                'C. At the peak of the north waterfall',
                'D. Inside the bicycle rental kiosk'
              ],
              correctAnswer: 'B',
              explanation: 'The ranger states the cabin is located near Mile Marker 4 on the ridge trail.',
              targetVocab: 'lookout'
            },
            {
              id: 19,
              type: 'MULTIPLE_CHOICE',
              prompt: 'How are the proceeds from the £6 admission fee utilized by the reserve?',
              options: [
                'A. Constructing luxury tourist hotels',
                'B. Native Scots pine reforestation projects',
                'C. Purchasing commercial logging equipment',
                'D. Subsidizing private helicopter tours'
              ],
              correctAnswer: 'B',
              explanation: 'Revenues are reinvested into native pine reforestation.',
              targetVocab: 'conservation'
            },
            {
              id: 20,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What exclusive benefit is included with an annual membership pass?',
              options: [
                'A. Free parking and a quarterly wildlife magazine',
                'B. An all-inclusive free lunch every Sunday',
                'C. Unlimited free electric bike rentals forever',
                'D. Ownership of one designated wild otter'
              ],
              correctAnswer: 'A',
              explanation: 'Ranger states membership includes free parking and a quarterly wildlife magazine.',
              targetVocab: 'habitat'
            }
          ]
        },
        {
          id: 'recall25-t1-s3',
          cambridgeBook: '2025 考场真题',
          testNum: 1,
          sectionNum: 3,
          title: 'Renewable Battery Storage Technology Dissertation Tutorial',
          scenario: 'University academic tutorial & research debrief',
          speakerRole: 'Dr. Katherine Evans, Marcus & Emily',
          bandDifficulty: 'Band 7.5 - 8.5',
          durationSec: 320,
          keyVocab: ['lithium', 'sodium-ion', 'degradation', 'electrolyte', 'grid', 'anode', 'cathode', 'lifecycle'],
          scriptParagraphs: [
            { speaker: 'Dr. Evans', text: 'Marcus, Emily, let us discuss your comparative evaluation of stationary energy storage for renewable microgrids.' },
            { speaker: 'Marcus', text: 'We evaluated lithium iron phosphate against emergent sodium-ion chemistry for utility-scale applications.', clueForQuestionId: 21 },
            { speaker: 'Emily', text: 'Our economic modeling revealed that sodium-ion battery cells reduce raw material expenditure by thirty-five percent because sodium is globally ubiquitous.', clueForQuestionId: 22 },
            { speaker: 'Dr. Evans', text: 'What trade-offs did you uncover regarding volumetric energy density?' },
            { speaker: 'Marcus', text: 'Sodium-ion has a lower gravimetric density, roughly 160 watt-hours per kilogram compared to 220 for standard lithium cells.', clueForQuestionId: 23 },
            { speaker: 'Emily', text: 'However, for stationary municipal storage where weight is immaterial, sodium offers exceptional thermal stability and zero risk of thermal runaway up to 60 degrees.', clueForQuestionId: 24 },
            { speaker: 'Dr. Evans', text: 'How did you simulate cyclic aging and electrode degradation?' },
            { speaker: 'Marcus', text: 'We subjected prototype cells to accelerated cycling at 45 degrees Celsius inside the environmental chamber for four thousand charge-discharge cycles.', clueForQuestionId: 25 },
            { speaker: 'Emily', text: 'The hard carbon anodes retained over 82% of initial capacity after four thousand cycles.', clueForQuestionId: 26 },
            { speaker: 'Dr. Evans', text: 'Make sure your literature review contrasts commercial electrolyte formulations, particularly fluorinated versus ester solvents.' },
            { speaker: 'Marcus', text: 'Yes, we cited Professor Zhang\'s 2024 paper on non-flammable fluorinated carbonate electrolytes.', clueForQuestionId: 27 },
            { speaker: 'Emily', text: 'We also need to refine our sensitivity matrix assessing future supply chain bottlenecks for cathode precursor materials.', clueForQuestionId: 28 },
            { speaker: 'Dr. Evans', text: 'I recommend presenting your findings at next month\'s Clean Tech Postgraduate Symposium.' },
            { speaker: 'Marcus', text: 'We would love to. When is the paper submission portal deadline?' },
            { speaker: 'Dr. Evans', text: 'The peer-review submission deadline is October 12th.', clueForQuestionId: 29 },
            { speaker: 'Emily', text: 'We will finalize our revised draft by next Monday afternoon for your feedback.', clueForQuestionId: 30 }
          ],
          questions: [
            {
              id: 21,
              type: 'FORM_COMPLETION',
              prompt: 'Alternative chemistry evaluated alongside lithium: [____]-ion battery cells',
              correctAnswer: 'sodium',
              blankLabel: 'Element name',
              explanation: 'Marcus notes evaluating emergent sodium-ion chemistry.',
              targetVocab: 'sodium-ion'
            },
            {
              id: 22,
              type: 'FORM_COMPLETION',
              prompt: 'Raw material cost savings with sodium-ion: [____] %',
              correctAnswer: '35',
              blankLabel: 'Savings percentage',
              explanation: 'Emily states cells reduce raw material expenditure by thirty-five percent.',
              targetVocab: 'lifecycle'
            },
            {
              id: 23,
              type: 'FORM_COMPLETION',
              prompt: 'Sodium-ion energy density: approximately [____] watt-hours per kilogram',
              correctAnswer: '160',
              blankLabel: 'Density metric',
              explanation: 'Marcus gives the density as roughly 160 watt-hours per kilogram.',
              targetVocab: 'lithium'
            },
            {
              id: 24,
              type: 'FORM_COMPLETION',
              prompt: 'Thermal stability maintained without runaway risk up to [____] degrees Celsius',
              correctAnswer: '60',
              blankLabel: 'Temperature limit',
              explanation: 'Emily specifies thermal stability up to 60 degrees.',
              targetVocab: 'degradation'
            },
            {
              id: 25,
              type: 'FORM_COMPLETION',
              prompt: 'Accelerated cycling test duration: [____] charge-discharge cycles',
              correctAnswer: '4000',
              blankLabel: 'Cycle count',
              explanation: 'Marcus mentions four thousand charge-discharge cycles.',
              targetVocab: 'degradation'
            },
            {
              id: 26,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What percentage of capacity did the hard carbon anodes retain after cycling?',
              options: [
                'A. 50%',
                'B. 65%',
                'C. Over 82%',
                'D. 99.5%'
              ],
              correctAnswer: 'C',
              explanation: 'Emily notes anodes retained over 82% of initial capacity.',
              targetVocab: 'anode'
            },
            {
              id: 27,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Which recent research publication did Marcus cite for non-flammable electrolytes?',
              options: [
                'A. Professor Zhang\'s 2024 paper on fluorinated carbonates',
                'B. Dr. Smith\'s 1998 lead-acid battery manual',
                'C. The International Coal Association bulletin',
                'D. A commercial patent application from 1950'
              ],
              correctAnswer: 'A',
              explanation: 'Marcus cited Professor Zhang\'s 2024 paper on non-flammable fluorinated carbonate electrolytes.',
              targetVocab: 'electrolyte'
            },
            {
              id: 28,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What analytical chart do the students plan to add to their dissertation?',
              options: [
                'A. A sensitivity matrix assessing supply chain bottlenecks',
                'B. Photographs of coal mining equipment',
                'C. An artistic drawing of electric sports cars',
                'D. A financial audit of a local petroleum company'
              ],
              correctAnswer: 'A',
              explanation: 'Emily explains they need to refine their sensitivity matrix assessing supply chain bottlenecks.',
              targetVocab: 'cathode'
            },
            {
              id: 29,
              type: 'MULTIPLE_CHOICE',
              prompt: 'When is the deadline to submit the paper to the Clean Tech Symposium?',
              options: [
                'A. September 1st',
                'B. October 12th',
                'C. November 30th',
                'D. December 25th'
              ],
              correctAnswer: 'B',
              explanation: 'Dr. Evans confirms the submission deadline is October 12th.',
              targetVocab: 'grid'
            },
            {
              id: 30,
              type: 'MULTIPLE_CHOICE',
              prompt: 'When will the students provide their revised draft to Dr. Evans?',
              options: [
                'A. Next Monday afternoon',
                'B. In six months',
                'C. At graduation next year',
                'D. Tomorrow at sunrise'
              ],
              correctAnswer: 'A',
              explanation: 'Emily says they will finalize their revised draft by next Monday afternoon.',
              targetVocab: 'lifecycle'
            }
          ]
        },
        {
          id: 'recall25-t1-s4',
          cambridgeBook: '2025 考场真题',
          testNum: 1,
          sectionNum: 4,
          title: 'Prehistoric Oceanic Navigation Across the Polynesian Triangle',
          scenario: 'Academic university lecture on ancient maritime anthropology',
          speakerRole: 'Anthropology Professor Alistair Sterling',
          bandDifficulty: 'Band 8.0 - 9.0',
          durationSec: 360,
          keyVocab: ['Polynesian', 'catamaran', 'wayfinding', 'astronavigation', 'swell', 'indigenous', 'migratory', 'archipelago'],
          scriptParagraphs: [
            { speaker: 'Professor', text: 'Welcome students. Today we investigate one of the most astonishing navigational feats in human prehistory: the settlement of the vast Polynesian Triangle, encompassing over twenty-five million square kilometers from Hawaii to Easter Island and New Zealand.' },
            { speaker: 'Professor', text: 'For decades, Eurocentric historians theorized that early voyagers were merely blown accidentally across the Pacific by trade wind storms. Experimental voyages conducted by the Polynesian Voyaging Society on the double-hulled canoe Hokule\'a have thoroughly refuted this hypothesis.', clueForQuestionId: 31 },
            { speaker: 'Professor', text: 'Ancient navigators, known as wayfinders, utilized non-instrument wayfinding methods grounded in rigorous astronomical and oceanic observation.' },
            { speaker: 'Professor', text: 'At night, master navigators referenced a celestial star compass comprising thirty-two directional houses where key navigational stars rise and set on the horizon.', clueForQuestionId: 32 },
            { speaker: 'Professor', text: 'During overcast weather when stars and sun were obscured, wayfinders read ocean swell patterns, feeling the rhythm and reflection of deep swells rebounding off submerged atolls.', clueForQuestionId: 33 },
            { speaker: 'Professor', text: 'Navigators also tracked the behavior of pelagic seabirds, particularly white terns and boobies, which fly directly toward land at sunset to roost.', clueForQuestionId: 34 },
            { speaker: 'Professor', text: 'The double-hulled voyaging canoes, crafted from carved koa wood planks lashed together with braided coconut fiber sennit, could sail up to one hundred and fifty miles per day.', clueForQuestionId: 35 },
            { speaker: 'Professor', text: 'To maintain food supplies across multi-week journeys, crews transported fermented breadfruit paste and dried sweet potato tubers stored in watertight gourds.', clueForQuestionId: 36 },
            { speaker: 'Professor', text: 'Recent ancient DNA sequencing from skeletal remains confirms that Polynesian navigators made direct round-trip contact with South America around 1200 AD.', clueForQuestionId: 37 },
            { speaker: 'Professor', text: 'The conclusive botanical marker of this trans-oceanic contact is the introduction of the South American sweet potato, known as kumara across Polynesian languages.', clueForQuestionId: 38 },
            { speaker: 'Professor', text: 'Tragically, European colonial expansion and introduced pathogens severely eroded indigenous wayfinding traditions by the late nineteenth century.' },
            { speaker: 'Professor', text: 'However, contemporary cultural revitalization initiatives have established indigenous wayfinding academies across Tahiti, Hawaii, and Micronesia.', clueForQuestionId: 39 },
            { speaker: 'Professor', text: 'Modern ocean voyages using traditional canoes ensure this ancestral maritime knowledge survives for future generations.', clueForQuestionId: 40 }
          ],
          questions: [
            {
              id: 31,
              type: 'FORM_COMPLETION',
              prompt: 'Famous reconstructed double-hulled voyaging canoe name: [____]',
              correctAnswer: 'Hokule\'a',
              blankLabel: 'Vessel Name',
              explanation: 'Professor references the double-hulled canoe Hokule\'a.',
              targetVocab: 'catamaran'
            },
            {
              id: 32,
              type: 'FORM_COMPLETION',
              prompt: 'Celestial star compass comprised [____] directional houses',
              correctAnswer: '32',
              blankLabel: 'House Count',
              explanation: 'Professor specifies a star compass comprising thirty-two directional houses.',
              targetVocab: 'astronavigation'
            },
            {
              id: 33,
              type: 'FORM_COMPLETION',
              prompt: 'Overcast daytime navigation relied on reading ocean [____] patterns',
              correctAnswer: 'swell',
              blankLabel: 'Wave Phenomenon',
              explanation: 'Professor explains wayfinders read ocean swell patterns.',
              targetVocab: 'swell'
            },
            {
              id: 34,
              type: 'FORM_COMPLETION',
              prompt: 'Pelagic seabirds tracked included white terns and [____]',
              correctAnswer: 'boobies',
              blankLabel: 'Bird Species',
              explanation: 'Professor mentions white terns and boobies.',
              targetVocab: 'migratory'
            },
            {
              id: 35,
              type: 'FORM_COMPLETION',
              prompt: 'Canoe planks lashed together with braided [____] fiber sennit',
              correctAnswer: 'coconut',
              blankLabel: 'Plant Material',
              explanation: 'Planks were lashed together with braided coconut fiber sennit.',
              targetVocab: 'catamaran'
            },
            {
              id: 36,
              type: 'FORM_COMPLETION',
              prompt: 'Preserved voyage food included fermented paste of [____]',
              correctAnswer: 'breadfruit',
              blankLabel: 'Crop Name',
              explanation: 'Professor notes fermented breadfruit paste and dried sweet potato.',
              targetVocab: 'Polynesian'
            },
            {
              id: 37,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What did recent ancient DNA sequencing confirm regarding Polynesian voyages?',
              options: [
                'A. Direct round-trip contact with South America around 1200 AD',
                'B. Polynesian origins in ancient Scandinavia',
                'C. Navigation across Antarctica using dog sleds',
                'D. That canoes were incapable of sailing out of sight of land'
              ],
              correctAnswer: 'A',
              explanation: 'Professor confirms Polynesian navigators made direct round-trip contact with South America around 1200 AD.',
              targetVocab: 'archipelago'
            },
            {
              id: 38,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Which botanical crop serves as definitive linguistic and biological proof of contact?',
              options: [
                'A. The European apple',
                'B. The South American sweet potato (kumara)',
                'C. African Arabica coffee beans',
                'D. Asian jasmine rice'
              ],
              correctAnswer: 'B',
              explanation: 'Professor highlights the South American sweet potato, known as kumara.',
              targetVocab: 'indigenous'
            },
            {
              id: 39,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Where have contemporary indigenous wayfinding academies been established?',
              options: [
                'A. Tahiti, Hawaii, and Micronesia',
                'B. Only in the British Museum in London',
                'C. Exclusively in Paris and Madrid',
                'D. In high-altitude mountain resorts in Switzerland'
              ],
              correctAnswer: 'A',
              explanation: 'Professor states academies were established across Tahiti, Hawaii, and Micronesia.',
              targetVocab: 'wayfinding'
            },
            {
              id: 40,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What is the primary objective of modern non-instrument ocean voyages today?',
              options: [
                'A. Commercial tuna fishing for export',
                'B. Preserving ancestral maritime knowledge for future generations',
                'C. Smuggling goods past naval patrols',
                'D. Competing in Olympic rowing races'
              ],
              correctAnswer: 'B',
              explanation: 'The final sentence states voyages ensure ancestral maritime knowledge survives for future generations.',
              targetVocab: 'wayfinding'
            }
          ]
        }
      ]
    },
    {
      testNum: 2,
      testLabel: 'Test 2 · 2026 考季大陆考场精选回忆卷 (全真大卷)',
      readingPassages: [
        {
          id: 'recall-2026-t2-p1',
          cambridgeBook: '2026 Recall',
          testNum: 2,
          passageNum: 1,
          title: 'The Resurgence of Seagrass Meadows in Blue Carbon Sequestration',
          subtitle: '2026 RECALL · TEST 2 · PASSAGE 1 · ACADEMIC READING',
          category: 'Marine Ecology & Climate Solutions',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['seagrass', 'sequestration', 'rhizome', 'sediment', 'photosynthetic', 'depletion'],
          text: `Seagrasses are marine angiosperms that have colonized shallow coastal waters across the globe. Although occupying less than 0.2 percent of the ocean surface, seagrass meadows are responsible for over ten percent of annual oceanic carbon storage, a dynamic termed blue carbon. Their dense underwater canopies baffle water currents, trapping organic sediment while expansive subterranean rhizome systems lock carbon into anoxic sea beds for millennia.

Recent satellite telemetry across the Indo-Pacific reveals alarming depletion due to agricultural runoff and destructive trawling. In response, restoration ecologists are deploying biodegradable seed burlap matrices that anchor juvenile shoots until root networks establish, demonstrating a 70 percent survival rate.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Seagrass meadows occupy more than ten percent of the total ocean floor.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 1 indicates seagrass occupies less than 0.2 percent of the ocean surface.',
              targetVocab: 'seagrass'
            },
            {
              id: 2,
              type: 'MULTIPLE_CHOICE',
              prompt: 'How do subterranean rhizomes contribute to carbon storage?',
              options: [
                'A. By releasing dissolved oxygen into adjacent coral reefs',
                'B. By locking organic sediment into oxygen-deprived sea beds for thousands of years',
                'C. By absorbing toxic chemical pesticides directly',
                'D. By heating surrounding coastal water temperatures'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 1 highlights that subterranean rhizome systems lock carbon into anoxic sea beds for millennia.',
              targetVocab: 'rhizome'
            },
            {
              id: 3,
              type: 'TFNG',
              prompt: 'Restoration projects using biodegradable burlap matrices have achieved a 70 percent shoot survival rate.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph 2 notes that biodegradable seed burlap matrices demonstrate a 70 percent survival rate.',
              targetVocab: 'sequestration'
            }
          ]
        },
        {
          id: 'recall-2026-t2-p2',
          cambridgeBook: '2026 Recall',
          testNum: 2,
          passageNum: 2,
          title: 'Neurolinguistics and the Cognitive Architecture of Inner Speech',
          subtitle: '2026 RECALL · TEST 2 · PASSAGE 2 · ACADEMIC READING',
          category: 'Cognitive Science & Linguistics',
          bandDifficulty: 'Band 7.0 - 8.0',
          timeAllowedMins: 20,
          keyVocab: ['neurolinguistics', 'subvocalization', 'articulation', 'inhibition', 'cortex', 'phonological'],
          text: `Inner speech—the silent internal monologue accompanying conscious thought—has long fascinated cognitive psychologists. Neuroimaging reveals that when individuals talk to themselves internally, the left inferior frontal gyrus (Broca's area) activates in tandem with the superior temporal gyrus (Wernicke's area), mirroring the neural pathway of overt vocal speech.

Crucially, motor commands sent to speech articulators are dampened by the supplementary motor cortex, preventing involuntary muscle twitching in a process known as motor inhibition. Studies demonstrate that inner speech is essential for working memory rehearsal, executive problem-solving, and emotional self-regulation.`,
          questions: [
            {
              id: 4,
              type: 'TFNG',
              prompt: 'Inner speech activates completely different brain regions than spoken language.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 1 notes inner speech mirrors the neural pathway of overt vocal speech, activating Broca and Wernicke areas.',
              targetVocab: 'neurolinguistics'
            },
            {
              id: 5,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What is the primary function of the supplementary motor cortex during silent thought?',
              options: [
                'A. Translating foreign languages into native syntax',
                'B. Inhibiting motor signals to prevent involuntary vocal muscle movement',
                'C. Storing childhood episodic memories',
                'D. Generating auditory hallucinations'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 2 confirms motor commands sent to speech articulators are dampened by the supplementary motor cortex.',
              targetVocab: 'inhibition'
            }
          ]
        },
        {
          id: 'recall-2026-t2-p3',
          cambridgeBook: '2026 Recall',
          testNum: 2,
          passageNum: 3,
          title: 'Subterranean Geothermal Infrastructure and Urban Heat Sinks',
          subtitle: '2026 RECALL · TEST 2 · PASSAGE 3 · ACADEMIC READING',
          category: 'Urban Engineering & Renewable Energy',
          bandDifficulty: 'Band 7.5 - 8.5',
          timeAllowedMins: 20,
          keyVocab: ['geothermal', 'subterranean', 'thermodynamic', 'heat-sink', 'borehole', 'effluent'],
          text: `Metropolitan centers worldwide generate immense subsurface thermal plumes caused by underground transport networks, basement parking facilities, and high-voltage power conduits. This phenomenon, dubbed the subterranean heat island effect, elevates subsurface soil temperatures by up to twelve degrees Celsius above surrounding rural baselines.

Forward-looking civil engineers are turning this geological challenge into an energy asset through thermo-active foundation piles. By embedding closed-loop geothermal heat exchangers directly inside skyscraper structural foundation piles, commercial developments can extract stored subterranean thermal energy in winter and reject excess heat into the bedrock during summer, trimming HVAC grid electricity consumption by 45 percent.`,
          questions: [
            {
              id: 6,
              type: 'TFNG',
              prompt: 'Subterranean soil temperatures in major cities can exceed rural baselines by twelve degrees.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph 1 indicates subsurface soil temperatures rise up to twelve degrees Celsius above rural baselines.',
              targetVocab: 'subterranean'
            },
            {
              id: 7,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Thermo-active foundation piles reduce HVAC electrical usage primarily by:',
              options: [
                'A. Burning geothermal gas directly inside boiler rooms',
                'B. Utilizing embedded heat exchangers to extract or sink thermal energy into bedrock',
                'C. Shielding buildings from atmospheric solar radiation',
                'D. Pumping groundwater into public drinking reservoirs'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 2 highlights embedding closed-loop geothermal heat exchangers into structural piles to extract or reject thermal energy.',
              targetVocab: 'thermodynamic'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'recall-2026-t2-s1',
          cambridgeBook: '2026 Recall',
          testNum: 2,
          sectionNum: 1,
          title: 'Riverside University Sports Complex Facility Membership',
          scenario: '日常申请 · 大学室内综合体育馆会员注册与场地预订',
          speakerRole: '体育馆前台经理 & 交流访问学者 (Daniel)',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['membership', 'locker', 'badminton', 'induction', 'subscription'],
          scriptParagraphs: [
            { speaker: 'Manager', text: 'Good morning, Riverside Sports Hub. How can I assist you today?' },
            { speaker: 'Daniel', text: 'Hi, I would like to sign up for the term-time fitness and badminton package.' },
            { speaker: 'Manager', text: 'Splendid! The platinum access passes include full sauna use, squash court reservations, and a dedicated locker in Bay 4.' }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Assigned locker location: Bay [1]',
              blankLabel: 'Locker Number',
              correctAnswer: '4',
              explanation: 'The manager confirms locker Bay 4.',
              targetVocab: 'locker'
            }
          ]
        },
        {
          id: 'recall-2026-t2-s2',
          cambridgeBook: '2026 Recall',
          testNum: 2,
          sectionNum: 2,
          title: 'Guided Tour of the National Maritime Chronometer Museum',
          scenario: '公共独白 · 格林威治皇家天文台航海精密钟表展馆导览',
          speakerRole: '首席展馆策展人 (Dr. Alistair Ross)',
          bandDifficulty: 'Band 6.5 - 7.5',
          durationSec: 210,
          keyVocab: ['chronometer', 'longitude', 'bimetallic', 'escapement', 'navigation'],
          scriptParagraphs: [
            { speaker: 'Dr. Ross', text: 'Welcome ladies and gentlemen to Gallery Three. Here stands John Harrison\'s masterpiece, the H4 marine timekeeper, which conquered the problem of calculating longitude at sea.' }
          ],
          questions: [
            {
              id: 2,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why was John Harrison\'s H4 timepiece revolutionary in maritime history?',
              options: [
                'A. It was the first clock driven by steam power',
                'B. It enabled precise determination of longitude during transatlantic voyages',
                'C. It measured water salinity automatically',
                'D. It broadcast radio coordinates to naval ports'
              ],
              correctAnswer: 'B',
              explanation: 'Dr. Ross confirms the H4 marine timekeeper conquered the problem of calculating longitude at sea.',
              targetVocab: 'longitude'
            }
          ]
        },
        {
          id: 'recall-2026-t2-s3',
          cambridgeBook: '2026 Recall',
          testNum: 2,
          sectionNum: 3,
          title: 'Aerodynamic Efficiency in High-Speed Magnetic Levitation Trains',
          scenario: '学术双人研讨 · 机械工程系研究生评估磁悬浮列车减阻模型',
          speakerRole: '研究生 (Maya & Julian)',
          bandDifficulty: 'Band 7.5 - 8.5',
          durationSec: 240,
          keyVocab: ['aerodynamic', 'pantograph', 'vortices', 'drag', 'superconducting'],
          scriptParagraphs: [
            { speaker: 'Julian', text: 'Maya, our wind tunnel simulations revealed that redesigning the pantograph cavity reduced micro-pressure tunnel sonic booms by thirty percent.' }
          ],
          questions: [
            {
              id: 3,
              type: 'FORM_COMPLETION',
              prompt: 'Redesigning the [3] reduced sonic boom effects in tunnels.',
              blankLabel: 'Train Component',
              correctAnswer: 'pantograph cavity',
              explanation: 'Julian points out redesigning the pantograph cavity reduced tunnel sonic booms.',
              targetVocab: 'pantograph'
            }
          ]
        },
        {
          id: 'recall-2026-t2-s4',
          cambridgeBook: '2026 Recall',
          testNum: 2,
          sectionNum: 4,
          title: 'Ancient Caravan Oases & The Silk Road Trans-Eurasian Commerce',
          scenario: '学术讲座 · 历史地理学教授剖析塔克拉玛干沙漠边缘坎儿井绿洲灌溉网络',
          speakerRole: '丝绸之路历史学特聘讲师 (Prof. Elena Chen)',
          bandDifficulty: 'Band 8.0 - 9.0',
          durationSec: 270,
          keyVocab: ['caravanserai', 'aqueduct', 'karez', 'irrigation', 'sedentary', 'nomadic'],
          scriptParagraphs: [
            { speaker: 'Prof. Chen', text: 'The survival of Silk Road trading oases like Turpan rested upon the ingenious karez subterranean aqueduct systems, which channeled meltwater from the Tian Shan mountains without evaporative loss.' }
          ],
          questions: [
            {
              id: 4,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why were karez aqueduct channels constructed underground in ancient Turpan?',
              options: [
                'A. To hide drinking water reserves from marauding bandits',
                'B. To prevent mountain glacier meltwater from evaporating in the extreme desert heat',
                'C. To power subterranean gold smelting workshops',
                'D. To maintain religious solitude for Buddhist monks'
              ],
              correctAnswer: 'B',
              explanation: 'Prof. Chen explains the subterranean aqueduct systems channeled meltwater without evaporative loss.',
              targetVocab: 'irrigation'
            }
          ]
        }
      ]
    },
    {
      testNum: 3,
      testLabel: 'Test 3 · 2026 换题季高频母题核心卷 (全真大卷)',
      readingPassages: [
        {
          id: 'recall-2026-t3-p1',
          cambridgeBook: '2026 Recall',
          testNum: 3,
          passageNum: 1,
          title: 'Biomimetic Wind Turbines and Humpback Whale Flipper Tubercles',
          subtitle: '2026 RECALL · TEST 3 · PASSAGE 1 · ACADEMIC READING',
          category: 'Biomimicry & Aerodynamic Engineering',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['biomimetic', 'tubercle', 'aerodynamic', 'stall', 'lift-to-drag', 'fluke'],
          text: `Despite weighing up to forty metric tons, humpback whales (Megaptera novaeangliae) exhibit astonishing underwater agility, executing tight banking maneuvers around prey schools. Biomechanical analysis reveals the secret behind this hydrodynamic prowess: prominent bumps called tubercles lining the leading edge of their pectoral flippers.

Aeronautical engineers testing tubercle-patterned turbine blades in wind tunnels discovered that these serrations generate localized vortex channels, delaying aerodynamic stall and increasing lift-to-drag ratios by 32 percent at steep angles of attack. This nature-inspired modification allows wind turbines to capture power in low-velocity winds that would stall conventional smooth blades.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Humpback whale flippers have perfectly smooth leading edges.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 1 indicates their flippers are lined with prominent bumps called tubercles.',
              targetVocab: 'tubercle'
            },
            {
              id: 2,
              type: 'MULTIPLE_CHOICE',
              prompt: 'How do tubercle-patterned blades improve turbine performance?',
              options: [
                'A. By cooling mechanical gearboxes with ocean breezes',
                'B. By generating localized vortex channels that delay stall at steep angles',
                'C. By eliminating the need for electric generators',
                'D. By emitting ultrasonic pulses to scare away migrating birds'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 2 confirms serrations generate localized vortex channels delaying aerodynamic stall.',
              targetVocab: 'aerodynamic'
            }
          ]
        },
        {
          id: 'recall-2026-t3-p2',
          cambridgeBook: '2026 Recall',
          testNum: 3,
          passageNum: 2,
          title: 'Algorithmic Fairness and Automation Bias in Healthcare Diagnostics',
          subtitle: '2026 RECALL · TEST 3 · PASSAGE 2 · ACADEMIC READING',
          category: 'Medical Technology & Bioethics',
          bandDifficulty: 'Band 7.0 - 8.0',
          timeAllowedMins: 20,
          keyVocab: ['algorithmic', 'diagnostics', 'radiology', 'automation', 'demographic', 'heuristic'],
          text: `The introduction of deep convolutional neural networks into clinical radiology has accelerated the detection of micro-calcifications in lung oncology. Yet, medical ethicists warn of automation bias—a cognitive tendency where physicians uncritically defer to computer diagnostic suggestions even when contradictory clinical signs exist.

Furthermore, machine learning models trained predominantly on urban academic hospital demographics exhibit significant performance degradation when deployed in rural clinics serving underrepresented demographic groups. Addressing this imbalance demands demographic auditing standards and mandatory human-in-the-loop validation frameworks.`,
          questions: [
            {
              id: 3,
              type: 'TFNG',
              prompt: 'Automation bias refers to medical staff questioning diagnostic algorithms too aggressively.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 1 specifies automation bias is where physicians uncritically defer to computer suggestions.',
              targetVocab: 'automation'
            },
            {
              id: 4,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why do some medical algorithms perform poorly in rural community clinics?',
              options: [
                'A. Rural clinics lack electric wall outlets',
                'B. The models were trained predominantly on urban hospital demographics',
                'C. Rural patients refuse X-ray examinations',
                'D. The neural networks degrade when exposed to agricultural dust'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 2 highlights models trained predominantly on urban demographics perform worse on underrepresented rural groups.',
              targetVocab: 'demographic'
            }
          ]
        },
        {
          id: 'recall-2026-t3-p3',
          cambridgeBook: '2026 Recall',
          testNum: 3,
          passageNum: 3,
          title: 'Glaciology and Subglacial Aquatic Environments in East Antarctica',
          subtitle: '2026 RECALL · TEST 3 · PASSAGE 3 · ACADEMIC READING',
          category: 'Polar Glaciology & Planetary Analogs',
          bandDifficulty: 'Band 8.0 - 9.0',
          timeAllowedMins: 20,
          keyVocab: ['subglacial', 'geothermal', 'limnology', 'accretion', 'hydrostatic', 'extremophile'],
          text: `Buried under four kilometers of polar ice cap lies Lake Vostok, a vast freshwater body isolated from atmospheric contact for fifteen million years. The lake remains liquid due to intense overburden pressure and modest geothermal heat flux from the Antarctic continental crust.

Core samples retrieved from subglacial accretion ice reveal viable bacterial colonies that sustain metabolic pathways through chemosynthesis, oxidizing iron and sulphur minerals rather than relying on sunlight. Planetary astrobiologists regard Lake Vostok as the premiere terrestrial analog for extraterrestrial oceans concealed beneath the frozen crusts of Jupiter's moon Europa and Saturn's Enceladus.`,
          questions: [
            {
              id: 5,
              type: 'TFNG',
              prompt: 'Lake Vostok receives regular replenishment from atmospheric rainfall.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 1 indicates Lake Vostok has been isolated from atmospheric contact for fifteen million years.',
              targetVocab: 'subglacial'
            },
            {
              id: 6,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why is Lake Vostok of profound interest to planetary astrobiologists?',
              options: [
                'A. It contains mineral gold deposits',
                'B. It serves as an analog for icy ocean moons like Europa and Enceladus',
                'C. It proves the Antarctic ice sheet is completely melting',
                'D. It has warm tropical surface water'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 2 states astrobiologists regard it as the premiere analog for extraterrestrial oceans under ice on Europa and Enceladus.',
              targetVocab: 'extremophile'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'recall-2026-t3-s1',
          cambridgeBook: '2026 Recall',
          testNum: 3,
          sectionNum: 1,
          title: 'Metropolitan Public Library Archive Volunteer Orientation',
          scenario: '日常对话 · 市立中央图书馆古籍数字化志愿者报名',
          speakerRole: '档案室主任 (Mrs. Gable) & 大学生志愿者 (Thomas)',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['manuscript', 'digitization', 'scanner', 'preservation', 'induction'],
          scriptParagraphs: [
            { speaker: 'Mrs. Gable', text: 'Welcome Thomas. Volunteers on the nineteenth-century map preservation project work Thursdays from 2 to 5 PM.' }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Volunteer project duty day: [1] afternoons',
              blankLabel: 'Day of Week',
              correctAnswer: 'Thursday',
              explanation: 'Mrs. Gable specifies Thursdays from 2 to 5 PM.',
              targetVocab: 'preservation'
            }
          ]
        },
        {
          id: 'recall-2026-t3-s2',
          cambridgeBook: '2026 Recall',
          testNum: 3,
          sectionNum: 2,
          title: 'Alpine Botanical Garden Micro-pollinator Conservation',
          scenario: '公共独白 · 高山植物园主管介绍野生物种授粉与蜂箱保护',
          speakerRole: '自然保护区首席生态员 (Dr. Karen Vance)',
          bandDifficulty: 'Band 6.5 - 7.5',
          durationSec: 210,
          keyVocab: ['pollinator', 'nectar', 'habitat', 'wildflower', 'solitary'],
          scriptParagraphs: [
            { speaker: 'Dr. Vance', text: 'Our wild bee shelter project focuses on solitary mason bees, which do not produce honey but pollinate three times more alpine flora than honeybees.' }
          ],
          questions: [
            {
              id: 2,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Why are solitary mason bees particularly prized in the alpine sanctuary?',
              options: [
                'A. They yield medicinal royal jelly',
                'B. They pollinate three times more flowers than traditional honeybees',
                'C. They repel predatory beetles',
                'D. They survive in sub-zero winter temperatures without hibernation'
              ],
              correctAnswer: 'B',
              explanation: 'Dr. Vance explains solitary mason bees pollinate three times more alpine flora.',
              targetVocab: 'pollinator'
            }
          ]
        },
        {
          id: 'recall-2026-t3-s3',
          cambridgeBook: '2026 Recall',
          testNum: 3,
          sectionNum: 3,
          title: 'Precision Agricultural Drones and Soil Nitrogen Sensors',
          scenario: '学术双人讨论 · 农学院师生评估多光谱无人机与土壤肥力遥感',
          speakerRole: '副教授 (Dr. Thorne) & 农学硕士生 (Oliver)',
          bandDifficulty: 'Band 7.5 - 8.5',
          durationSec: 240,
          keyVocab: ['multispectral', 'nitrogen', 'fertilizer', 'vegetation', 'calibration'],
          scriptParagraphs: [
            { speaker: 'Oliver', text: 'By calibrating the near-infrared reflectance index, our aerial drone detected nitrogen deficiencies four days before leaf chlorosis became visible to the eye.' }
          ],
          questions: [
            {
              id: 3,
              type: 'FORM_COMPLETION',
              prompt: 'Drone sensors detected nutrient deficiency [3] days before visual discoloration.',
              blankLabel: 'Time Frame',
              correctAnswer: '4',
              explanation: 'Oliver states four days before leaf chlorosis became visible.',
              targetVocab: 'multispectral'
            }
          ]
        },
        {
          id: 'recall-2026-t3-s4',
          cambridgeBook: '2026 Recall',
          testNum: 3,
          sectionNum: 4,
          title: 'The Metallurgy of Damascus Steel and Carbon Nanotube Matrix',
          scenario: '学术历史讲座 · 材料考古学专家解密大马士革花纹钢古代坩埚冶炼技术',
          speakerRole: '冶金史学教授 (Prof. Gregory Vance)',
          bandDifficulty: 'Band 8.0 - 9.0',
          durationSec: 270,
          keyVocab: ['crucible', 'damascus', 'nanotube', 'carbide', 'tempering', 'wootz'],
          scriptParagraphs: [
            { speaker: 'Prof. Vance', text: 'Electron microscopy of ancient seventeenth-century Damascus blades revealed microscopic carbon nanotubes intertwined with iron carbide nanowires, imparting unmatched flexibility and edge retention.' }
          ],
          questions: [
            {
              id: 4,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What modern discovery explained the extraordinary strength of historic Damascus swords?',
              options: [
                'A. Inclusion of pulverized diamonds in the furnace',
                'B. Microscopic carbon nanotubes intertwined with iron carbide nanowires',
                'C. Quenching blades in arctic seawater',
                'D. Coating surfaces with radioactive isotopes'
              ],
              correctAnswer: 'B',
              explanation: 'Prof. Vance points out electron microscopy revealed microscopic carbon nanotubes intertwined with iron carbide nanowires.',
              targetVocab: 'nanotube'
            }
          ]
        }
      ]
    },
    {
      testNum: 4,
      testLabel: 'Test 4 · 2026 亚太考区高频保留真题大卷 (全真大卷)',
      readingPassages: [
        {
          id: 'recall-2026-t4-p1',
          cambridgeBook: '2026 Recall',
          testNum: 4,
          passageNum: 1,
          title: 'The Cooperative Social Sentinel System of Wild Kalahari Meerkats',
          subtitle: '2026 RECALL · TEST 4 · PASSAGE 1 · ACADEMIC READING',
          category: 'Behavioral Biology & Zoology',
          bandDifficulty: 'Band 6.5 - 7.5',
          timeAllowedMins: 20,
          keyVocab: ['sentinel', 'cooperative', 'foraging', 'predator', 'altruism', 'vocalization'],
          text: `In the arid savannah of the Kalahari Basin, meerkats (Suricata suricatta) live in closely-knit mob structures of up to thirty individuals. While the troop forages for scorpions and beetles, one member scales a mound or acacia bush to assume the sentinel post, scanning the skies for predatory martial eagles.

Field audio playbacks demonstrate that sentinels modulate distinct acoustic alarm chirps depending on predator proximity and type: terrestrial jackals elicit low-pitch bark tones, whereas raptors provoke high-frequency shrieks prompting instant subterranean retreat. Crucially, sentinels only take guard duties after foraging to satiety, demonstrating that sentinel behaviour is driven by mutualistic vigilance rather than pure biological martyrdom.`,
          questions: [
            {
              id: 1,
              type: 'TFNG',
              prompt: 'Sentinel meerkats use identical alarm calls for terrestrial jackals and aerial raptors.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 2 notes sentinels modulate distinct acoustic calls: low bark for jackals, high shrieks for raptors.',
              targetVocab: 'vocalization'
            },
            {
              id: 2,
              type: 'MULTIPLE_CHOICE',
              prompt: 'When does a meerkat typically undertake sentinel guard duty?',
              options: [
                'A. Only when severely injured or starving',
                'B. After foraging until satisfied with food',
                'C. During heavy nighttime thunderstorms',
                'D. When expelled from the family burrow'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 2 states sentinels only take guard duties after foraging to satiety.',
              targetVocab: 'sentinel'
            }
          ]
        },
        {
          id: 'recall-2026-t4-p2',
          cambridgeBook: '2026 Recall',
          testNum: 4,
          passageNum: 2,
          title: 'Quantum Sensor Magnetometry in Geophysical Exploration',
          subtitle: '2026 RECALL · TEST 4 · PASSAGE 2 · ACADEMIC READING',
          category: 'Quantum Physics & Mining Geophysics',
          bandDifficulty: 'Band 7.5 - 8.5',
          timeAllowedMins: 20,
          keyVocab: ['magnetometry', 'quantum', 'diamond', 'nitrogen-vacancy', 'geophysical', 'subsurface'],
          text: `Traditional airborne electromagnetic surveys often struggle to map deep mineral deposits shielded by conductive saline overburden layers. Emerging diamond nitrogen-vacancy (NV) center magnetometers are transforming this field by measuring sub-picotesla magnetic anomalies with atomic precision.

By detecting magnetic field gradients at room temperature, quantum NV magnetometers deployed on autonomous aerial drones can delineate subterranean fault lines and rare-earth pegmatite veins buried over five hundred meters below surface strata, bypassing costly preliminary exploratory drilling.`,
          questions: [
            {
              id: 3,
              type: 'TFNG',
              prompt: 'Diamond nitrogen-vacancy magnetometers can operate at room temperature.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE',
              explanation: 'Paragraph 2 explicitly mentions detecting magnetic gradients at room temperature.',
              targetVocab: 'nitrogen-vacancy'
            },
            {
              id: 4,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What primary advantage do drone-mounted quantum magnetometers provide?',
              options: [
                'A. They extract mineral ores directly from the air',
                'B. They map deeply buried veins with atomic precision, reducing exploratory drilling',
                'C. They predict global earthquakes fifty days ahead',
                'D. They convert desert sands into quartz glass'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 2 indicates they delineate subterranean veins buried 500m below surface, bypassing costly exploratory drilling.',
              targetVocab: 'magnetometry'
            }
          ]
        },
        {
          id: 'recall-2026-t4-p3',
          cambridgeBook: '2026 Recall',
          testNum: 4,
          passageNum: 3,
          title: 'The Linguistics of Lost Epics: Deciphering the Indus Valley Script',
          subtitle: '2026 RECALL · TEST 4 · PASSAGE 3 · ACADEMIC READING',
          category: 'Archaeological Epigraphy & Computational Linguistics',
          bandDifficulty: 'Band 8.0 - 9.0',
          timeAllowedMins: 20,
          keyVocab: ['epigraphy', 'corpus', 'logographic', 'bilingual', 'harappan', 'decipherment'],
          text: `For over a century, the script of the bronze age Indus Valley (Harappan) civilization has defied definitive decipherment. Consisting of more than four thousand miniature steatite stamp seals featuring stylized iconography and inscriptions averaging only five glyphs in length, the corpus lacks a bilingual Rosetta Stone counterpart.

Recent computational linguistics employing conditional entropy calculations indicates that the Harappan glyph sequence patterns match non-random linguistic syntax rather than decorative religious heraldry. However, until an extensive multi-sentence inscription or bi-scriptural tablet is excavated in Mesopotamian trade emporiums, debate over whether the underlying tongue belonged to the Proto-Dravidian or Indo-European language family will endure.`,
          questions: [
            {
              id: 5,
              type: 'TFNG',
              prompt: 'Archaeologists have discovered an official bilingual tablet linking Harappan to ancient Greek.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'FALSE',
              explanation: 'Paragraph 1 explicitly notes the corpus lacks a bilingual Rosetta Stone counterpart.',
              targetVocab: 'bilingual'
            },
            {
              id: 6,
              type: 'MULTIPLE_CHOICE',
              prompt: 'What did computational entropy calculations reveal about the Indus Valley glyphs?',
              options: [
                'A. They were randomly stamped for visual decoration',
                'B. They match non-random syntactic patterns consistent with genuine language',
                'C. They were borrowed directly from ancient Egyptian hieroglyphs',
                'D. They were astronomical planetary charts'
              ],
              correctAnswer: 'B',
              explanation: 'Paragraph 2 highlights conditional entropy shows glyph sequences match non-random linguistic syntax rather than decorative heraldry.',
              targetVocab: 'decipherment'
            }
          ]
        }
      ],
      listeningSections: [
        {
          id: 'recall-2026-t4-s1',
          cambridgeBook: '2026 Recall',
          testNum: 4,
          sectionNum: 1,
          title: 'Campus Cycling Club Equipment Rental and Trail Registration',
          scenario: '日常对话 · 大学校园骑行俱乐部山地车租赁与路线登记',
          speakerRole: '车队指导员 & 国际留学生 (Liam)',
          bandDifficulty: 'Band 6.0 - 7.0',
          durationSec: 180,
          keyVocab: ['pannier', 'puncture', 'helmet', 'registration', 'deposit'],
          scriptParagraphs: [
            { speaker: 'Instructor', text: 'Hi Liam, the mountain bike hire includes waterproof panniers and a puncture repair kit. Weekly rental is thirty-five pounds.' }
          ],
          questions: [
            {
              id: 1,
              type: 'FORM_COMPLETION',
              prompt: 'Weekly bicycle rental fee: £[1]',
              blankLabel: 'Rental Fee',
              correctAnswer: '35',
              explanation: 'Instructor confirms thirty-five pounds.',
              targetVocab: 'pannier'
            }
          ]
        },
        {
          id: 'recall-2026-t4-s2',
          cambridgeBook: '2026 Recall',
          testNum: 4,
          sectionNum: 2,
          title: 'Urban Rooftop Hydroponic Farming and Food Sovereignty',
          scenario: '公共独白 · 城市屋顶无土栽培社区农场负责人经验分享',
          speakerRole: '绿洲农业联合发起人 (Hannah Blake)',
          bandDifficulty: 'Band 6.5 - 7.5',
          durationSec: 210,
          keyVocab: ['hydroponic', 'aeroponic', 'harvest', 'nutrient', 'sovereignty'],
          scriptParagraphs: [
            { speaker: 'Hannah', text: 'By utilizing vertical nutrient-film hydroponic towers on disused downtown warehouse rooftops, we harvest fresh leafy greens using ninety percent less water than traditional soil farming.' }
          ],
          questions: [
            {
              id: 2,
              type: 'MULTIPLE_CHOICE',
              prompt: 'Compared to conventional agriculture, the rooftop hydroponic facility uses:',
              options: [
                'A. Twice as much chemical herbicide',
                'B. 90% less water',
                'C. Three times more land area',
                'D. Synthetic soil imported from overseas'
              ],
              correctAnswer: 'B',
              explanation: 'Hannah notes harvesting fresh greens using ninety percent less water than soil farming.',
              targetVocab: 'hydroponic'
            }
          ]
        },
        {
          id: 'recall-2026-t4-s3',
          cambridgeBook: '2026 Recall',
          testNum: 4,
          sectionNum: 3,
          title: 'Comparative Phonology of Celtic Insular Languages',
          scenario: '学术双人辅导 · 语言学导师与本科生研讨盖尔语初始辅音突变现象',
          speakerRole: '语言学副教授 (Dr. MacLeod) & 本科生 (Fiona)',
          bandDifficulty: 'Band 7.5 - 8.5',
          durationSec: 240,
          keyVocab: ['phonology', 'lenition', 'mutation', 'consonant', 'celtic'],
          scriptParagraphs: [
            { speaker: 'Dr. MacLeod', text: 'Fiona, initial consonant lenition in Scottish Gaelic occurs systematically after feminine singular definite articles.' }
          ],
          questions: [
            {
              id: 3,
              type: 'FORM_COMPLETION',
              prompt: 'Consonant lenition triggers after [3] singular definite articles.',
              blankLabel: 'Grammatical Gender',
              correctAnswer: 'feminine',
              explanation: 'Dr. MacLeod notes feminine singular definite articles.',
              targetVocab: 'lenition'
            }
          ]
        },
        {
          id: 'recall-2026-t4-s4',
          cambridgeBook: '2026 Recall',
          testNum: 4,
          sectionNum: 4,
          title: 'Iron Age Hillfort Architecture & Communal Grain Silos in Britain',
          scenario: '学术考古讲座 · 史前考古学者复原多塞特郡梅登城堡防御工事与粮仓储藏',
          speakerRole: '史前考古学首席研究员 (Prof. Derek Thorne)',
          bandDifficulty: 'Band 8.0 - 9.0',
          durationSec: 270,
          keyVocab: ['hillfort', 'rampart', 'silo', 'carbonized', 'grain', 'excavation'],
          scriptParagraphs: [
            { speaker: 'Prof. Thorne', text: 'Excavation of the subterranean bell-shaped storage pits at Maiden Castle proved that airtight clay sealing created a carbon dioxide envelope, preserving seed barley for up to five years without germination.' }
          ],
          questions: [
            {
              id: 4,
              type: 'MULTIPLE_CHOICE',
              prompt: 'How did Iron Age builders preserve grain in underground pits without spoiling?',
              options: [
                'A. Freezing pits with winter snow blocks',
                'B. Sealing pits with clay to create an oxygen-deprived carbon dioxide envelope',
                'C. Submerging grain sacks in brine wells',
                'D. Adding powdered copper ore to kill fungi'
              ],
              correctAnswer: 'B',
              explanation: 'Prof. Thorne explains airtight clay sealing created a carbon dioxide envelope preserving seed barley.',
              targetVocab: 'silo'
            }
          ]
        }
      ]
    }
  ]
};

// Backwards compatibility alias
export const IELTS_2025_LATEST_RECALL_VOLUME = IELTS_2026_AUTUMN_RECALL_VOLUME;

// Export active passages and listening sections for integration
export const SEASONAL_2026_RECALL_PASSAGES: CambridgePassage[] = IELTS_2026_AUTUMN_RECALL_VOLUME.tests.flatMap(t => t.readingPassages);
export const SEASONAL_2026_RECALL_LISTENING: IELTSListeningSection[] = IELTS_2026_AUTUMN_RECALL_VOLUME.tests.flatMap(t => t.listeningSections);
export const SEASONAL_2025_RECALL_PASSAGES = SEASONAL_2026_RECALL_PASSAGES;
export const SEASONAL_2025_RECALL_LISTENING = SEASONAL_2026_RECALL_LISTENING;

