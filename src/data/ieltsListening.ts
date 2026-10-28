import { SEASONAL_2025_RECALL_LISTENING } from './seasonalIeltsRecallArchive.ts';

export interface IELTSListeningQuestion {
  id: number;
  type: 'FORM_COMPLETION' | 'MULTIPLE_CHOICE' | 'TABLE_COMPLETION';
  prompt: string;
  options?: string[]; // for MULTIPLE_CHOICE
  correctAnswer: string;
  blankLabel?: string;
  explanation: string;
  targetVocab?: string;
}

export interface IELTSListeningSection {
  id: string;
  cambridgeBook: string; // e.g. "Cambridge 19", "Cambridge 18"
  testNum: number;       // e.g. 1, 2, 3
  sectionNum: number;    // 1 (Social), 2 (Monologue), 3 (Academic Discussion), 4 (Lecture)
  title: string;
  scenario: string;
  speakerRole: string;
  bandDifficulty: string;
  durationSec: number;
  keyVocab: string[];
  scriptParagraphs: Array<{
    speaker?: string;
    text: string;
    clueForQuestionId?: number;
  }>;
  questions: IELTSListeningQuestion[];
  isOnlineAdded?: boolean;
  addedTimestamp?: number;
  sourceUrl?: string;
  sourceName?: string;
}

export const CAMBRIDGE_IELTS_LISTENING: IELTSListeningSection[] = [
  // ================= 2025-2026 换题季考场真题回忆 (全真40题标准大卷) =================
  ...SEASONAL_2025_RECALL_LISTENING,

  // ================= CAMBRIDGE 19 =================
  {
    id: 'c19-t1-s1',
    cambridgeBook: 'Cambridge 19',
    testNum: 1,
    sectionNum: 1,
    title: 'Harbor Eco-Tours & Kayak Hire Booking',
    scenario: 'Telephone reservation & equipment consultation',
    speakerRole: 'Customer Service & Tourist',
    bandDifficulty: 'Band 6.0 - 7.0',
    durationSec: 280,
    keyVocab: ['reservation', 'deposit', 'waterproof', 'kayak', 'instructor', 'discount', 'buoyancy', 'helmet'],
    scriptParagraphs: [
      {
        speaker: 'Clerk',
        text: 'Good morning! Harbor Eco-Tours, this is Sarah speaking. How can I help you today?'
      },
      {
        speaker: 'Customer',
        text: 'Hello, I would like to book the guided coastal kayak tour for this coming Saturday.'
      },
      {
        speaker: 'Clerk',
        text: 'Certainly! The morning excursion departs promptly at 9:30 AM from Bayview Pier.',
        clueForQuestionId: 1
      },
      {
        speaker: 'Customer',
        text: 'That sounds perfect. How much is the fee per person for the tour?'
      },
      {
        speaker: 'Clerk',
        text: 'The standard adult ticket is £35, which includes full paddle gear, a buoyancy jacket, and a dry waterproof bag.',
        clueForQuestionId: 2
      },
      {
        speaker: 'Customer',
        text: 'Do you offer any student or group discount if we have four people?'
      },
      {
        speaker: 'Clerk',
        text: 'Yes, groups of four or more receive an automatic 15% discount upon checkout.',
        clueForQuestionId: 3
      },
      {
        speaker: 'Customer',
        text: 'Great! My last name is Henderson, spelled H-E-N-D-E-R-S-O-N.',
        clueForQuestionId: 4
      },
      {
        speaker: 'Clerk',
        text: 'And could I have your contact mobile number, please?'
      },
      {
        speaker: 'Customer',
        text: 'Sure, it is 07942 881329.',
        clueForQuestionId: 5
      },
      {
        speaker: 'Clerk',
        text: 'Thank you. For safety regulations, what is the minimum age in your party? All participants must be at least 12 years old.',
        clueForQuestionId: 6
      },
      {
        speaker: 'Customer',
        text: 'Our youngest member is 14, so that is fine. Do we need to bring specialized footwear?'
      },
      {
        speaker: 'Clerk',
        text: 'We recommend neoprene water shoes, but old trainers with non-slip rubber soles are completely suitable.',
        clueForQuestionId: 7
      },
      {
        speaker: 'Customer',
        text: 'Understood. Where is the designated car park located?'
      },
      {
        speaker: 'Clerk',
        text: 'Please park in the North Harbour carpark. We validate tickets so parking is free for tour guests.',
        clueForQuestionId: 8
      },
      {
        speaker: 'Customer',
        text: 'Is lunch provided during the four-hour trip?'
      },
      {
        speaker: 'Clerk',
        text: 'We provide organic energy bars and mineral water, but guests are encouraged to pack their own sandwich.',
        clueForQuestionId: 9
      },
      {
        speaker: 'Customer',
        text: 'Wonderful. How much deposit is required to confirm the reservation today?'
      },
      {
        speaker: 'Clerk',
        text: 'A deposit of £20 per booking holds your kayaks. The balance is paid upon arrival.',
        clueForQuestionId: 10
      }
    ],
    questions: [
      {
        id: 1,
        type: 'FORM_COMPLETION',
        prompt: 'Morning kayak excursion departure time: [____] AM',
        correctAnswer: '9:30',
        blankLabel: 'Departure time',
        explanation: 'The clerk confirms: "The morning excursion departs promptly at 9:30 AM".',
        targetVocab: 'reservation'
      },
      {
        id: 2,
        type: 'FORM_COMPLETION',
        prompt: 'Ticket price includes paddle gear, buoyancy jacket, and a [____] bag',
        correctAnswer: 'waterproof',
        blankLabel: 'Bag type',
        explanation: 'The clerk notes the fee includes "a dry waterproof bag".',
        targetVocab: 'waterproof'
      },
      {
        id: 3,
        type: 'FORM_COMPLETION',
        prompt: 'Group discount rate for 4+ people: [____] %',
        correctAnswer: '15',
        blankLabel: 'Discount percentage',
        explanation: 'The clerk states: "groups of four or more receive an automatic 15% discount".',
        targetVocab: 'discount'
      },
      {
        id: 4,
        type: 'FORM_COMPLETION',
        prompt: 'Customer surname: [____]',
        correctAnswer: 'Henderson',
        blankLabel: 'Surname',
        explanation: 'The customer spells out: "H-E-N-D-E-R-S-O-N".',
        targetVocab: 'reservation'
      },
      {
        id: 5,
        type: 'FORM_COMPLETION',
        prompt: 'Contact mobile number: [____]',
        correctAnswer: '07942 881329',
        blankLabel: 'Phone number',
        explanation: 'The customer states his number is "07942 881329".',
        targetVocab: 'reservation'
      },
      {
        id: 6,
        type: 'FORM_COMPLETION',
        prompt: 'Minimum participant age requirement: [____] years old',
        correctAnswer: '12',
        blankLabel: 'Minimum age',
        explanation: 'The clerk specifies: "All participants must be at least 12 years old".',
        targetVocab: 'instructor'
      },
      {
        id: 7,
        type: 'FORM_COMPLETION',
        prompt: 'Footwear allowed: neoprene shoes or trainers with non-slip [____] soles',
        correctAnswer: 'rubber',
        blankLabel: 'Sole material',
        explanation: 'The clerk recommends trainers with "non-slip rubber soles".',
        targetVocab: 'waterproof'
      },
      {
        id: 8,
        type: 'FORM_COMPLETION',
        prompt: 'Designated parking location: [____] Harbour carpark',
        correctAnswer: 'North',
        blankLabel: 'Carpark name',
        explanation: 'The clerk advises: "Please park in the North Harbour carpark".',
        targetVocab: 'reservation'
      },
      {
        id: 9,
        type: 'FORM_COMPLETION',
        prompt: 'Refreshments provided: water and energy bars; guests should bring a [____]',
        correctAnswer: 'sandwich',
        blankLabel: 'Food item',
        explanation: 'The clerk states: "guests are encouraged to pack their own sandwich".',
        targetVocab: 'deposit'
      },
      {
        id: 10,
        type: 'FORM_COMPLETION',
        prompt: 'Initial booking deposit amount: £ [____]',
        correctAnswer: '20',
        blankLabel: 'Deposit amount',
        explanation: 'The clerk states: "A deposit of £20 per booking holds your kayaks".',
        targetVocab: 'deposit'
      }
    ]
  },
  {
    id: 'c19-t1-s2',
    cambridgeBook: 'Cambridge 19',
    testNum: 1,
    sectionNum: 2,
    title: 'Riverfront Botanical Park Redevelopment',
    scenario: 'Public orientation and park facilities monologue',
    speakerRole: 'Park Project Director',
    bandDifficulty: 'Band 7.0 - 8.0',
    durationSec: 300,
    keyVocab: ['botanical', 'renovation', 'biodiversity', 'canopy', 'pavilion', 'wetland', 'sculpture', 'herbarium'],
    scriptParagraphs: [
      {
        speaker: 'Director',
        text: 'Welcome everyone to the unveiling of the Riverfront Botanical Park redevelopment masterplan.'
      },
      {
        speaker: 'Director',
        text: 'Our headline feature is the elevated treetop walkway, providing panoramic views across the native canopy.',
        clueForQuestionId: 11
      },
      {
        speaker: 'Director',
        text: 'On the southern boundary, we have restored over five hectares of freshwater wetlands to attract migratory wildfowl.',
        clueForQuestionId: 12
      },
      {
        speaker: 'Director',
        text: 'The solar-powered visitor pavilion will officially open its doors on July 14th.',
        clueForQuestionId: 13
      },
      {
        speaker: 'Director',
        text: 'Adjacent to the east entrance, we have installed a children\'s interactive sculpture garden crafted from recycled timber.',
        clueForQuestionId: 14
      },
      {
        speaker: 'Director',
        text: 'For gardening enthusiasts, the Victorian greenhouse has been retrofitted with geothermal heating to preserve tropical orchids.',
        clueForQuestionId: 15
      },
      {
        speaker: 'Director',
        text: 'Let us now look at visitor logistics. The new cycle path connects directly to the central railway station.',
        clueForQuestionId: 16
      },
      {
        speaker: 'Director',
        text: 'Admission to the outdoor botanical grounds remains completely free of charge for local residents and general visitors.',
        clueForQuestionId: 17
      },
      {
        speaker: 'Director',
        text: 'Special exhibitions inside the glass conservatory require an adult ticket priced at £8.',
        clueForQuestionId: 18
      },
      {
        speaker: 'Director',
        text: 'Volunteers are currently needed to assist with bird counting and seasonal pruning on weekends.',
        clueForQuestionId: 19
      },
      {
        speaker: 'Director',
        text: 'All community volunteer applications should be submitted via our official website by June 30th.',
        clueForQuestionId: 20
      }
    ],
    questions: [
      {
        id: 11,
        type: 'FORM_COMPLETION',
        prompt: 'Panoramic canopy views are accessible via the [____] walkway',
        correctAnswer: 'treetop',
        blankLabel: 'Walkway type',
        explanation: 'The director mentions "the elevated treetop walkway, providing panoramic views".',
        targetVocab: 'canopy'
      },
      {
        id: 12,
        type: 'FORM_COMPLETION',
        prompt: 'Restored freshwater area size: [____] hectares',
        correctAnswer: '5',
        blankLabel: 'Wetland size',
        explanation: 'The speaker explicitly notes "restored over five hectares of freshwater wetlands".',
        targetVocab: 'wetland'
      },
      {
        id: 13,
        type: 'FORM_COMPLETION',
        prompt: 'Visitor pavilion official opening date: July [____]',
        correctAnswer: '14th',
        blankLabel: 'Opening date',
        explanation: 'The director states "pavilion will officially open its doors on July 14th".',
        targetVocab: 'pavilion'
      },
      {
        id: 14,
        type: 'FORM_COMPLETION',
        prompt: 'Sculpture garden materials: crafted from recycled [____]',
        correctAnswer: 'timber',
        blankLabel: 'Material',
        explanation: 'The director states the garden is "crafted from recycled timber".',
        targetVocab: 'sculpture'
      },
      {
        id: 15,
        type: 'FORM_COMPLETION',
        prompt: 'Victorian greenhouse heating source: [____] heating',
        correctAnswer: 'geothermal',
        blankLabel: 'Heating type',
        explanation: 'The director notes the greenhouse was "retrofitted with geothermal heating".',
        targetVocab: 'botanical'
      },
      {
        id: 16,
        type: 'MULTIPLE_CHOICE',
        prompt: 'The new cycle path connects the park directly to:',
        options: [
          'A. The central railway station',
          'B. The airport terminal',
          'C. The commercial container port',
          'D. The university chemistry lab'
        ],
        correctAnswer: 'A',
        explanation: 'The speaker highlights that the cycle path connects directly to the central railway station.',
        targetVocab: 'renovation'
      },
      {
        id: 17,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What is the admission policy for the outdoor grounds?',
        options: [
          'A. Free admission for all visitors',
          'B. £15 mandatory entry fee',
          'C. Accessible only to annual pass holders',
          'D. Restricted to school groups on weekdays'
        ],
        correctAnswer: 'A',
        explanation: 'The speaker states outdoor grounds admission remains completely free of charge.',
        targetVocab: 'biodiversity'
      },
      {
        id: 18,
        type: 'MULTIPLE_CHOICE',
        prompt: 'An adult ticket for special glass conservatory exhibitions costs:',
        options: [
          'A. £4',
          'B. £8',
          'C. £16',
          'D. £25'
        ],
        correctAnswer: 'B',
        explanation: 'The speaker specifies the exhibition ticket is priced at £8.',
        targetVocab: 'pavilion'
      },
      {
        id: 19,
        type: 'MULTIPLE_CHOICE',
        prompt: 'Weekend community volunteers are primarily needed to help with:',
        options: [
          'A. Security patrols along the highway',
          'B. Bird counting and seasonal pruning',
          'C. Commercial advertising design',
          'D. Driving heavy transport lorries'
        ],
        correctAnswer: 'B',
        explanation: 'The speaker mentions volunteers are needed for bird counting and seasonal pruning.',
        targetVocab: 'biodiversity'
      },
      {
        id: 20,
        type: 'MULTIPLE_CHOICE',
        prompt: 'Volunteer applications must be submitted by which deadline?',
        options: [
          'A. May 1st',
          'B. June 30th',
          'C. July 14th',
          'D. August 31st'
        ],
        correctAnswer: 'B',
        explanation: 'The director announces all volunteer applications must be submitted by June 30th.',
        targetVocab: 'renovation'
      }
    ]
  },
  {
    id: 'c19-t1-s3',
    cambridgeBook: 'Cambridge 19',
    testNum: 1,
    sectionNum: 3,
    title: 'Marine Microplastic Fieldwork Presentation',
    scenario: 'University academic tutorial & research debrief',
    speakerRole: 'Professor & Postgraduate Students',
    bandDifficulty: 'Band 7.5 - 8.5',
    durationSec: 320,
    keyVocab: ['sediment', 'microplastic', 'methodology', 'centrifuge', 'spectroscopy', 'hypothesis', 'estuary', 'filtration'],
    scriptParagraphs: [
      {
        speaker: 'Professor',
        text: 'Let us review your benthic sediment sampling methodology from Tuesday\'s estuary expedition.'
      },
      {
        speaker: 'Student A',
        text: 'We separated microplastic particles from dense silt using high-density zinc chloride density flotation.',
        clueForQuestionId: 21
      },
      {
        speaker: 'Student B',
        text: 'Under infrared spectroscopy, over 60% of synthetic fibers were identified as polyester from textile runoff.',
        clueForQuestionId: 22
      },
      {
        speaker: 'Professor',
        text: 'Did you account for airborne fiber contamination inside the university laboratory?'
      },
      {
        speaker: 'Student A',
        text: 'Yes, we ran negative control petri dishes alongside each filtration step and wore 100% cotton lab coats.',
        clueForQuestionId: 23
      },
      {
        speaker: 'Student B',
        text: 'Our micro-Fourier transform infrared microscopy showed particle sizes down to 20 micrometers.',
        clueForQuestionId: 24
      },
      {
        speaker: 'Professor',
        text: 'What was your finding regarding seasonal tidal variations and microplastic concentration?'
      },
      {
        speaker: 'Student A',
        text: 'Concentrations spiked dramatically following heavy monsoon rainfall events due to urban stormwater discharge.',
        clueForQuestionId: 25
      },
      {
        speaker: 'Professor',
        text: 'Good. How do you plan to present your statistical findings for the final dissertation poster?'
      },
      {
        speaker: 'Student B',
        text: 'We are constructing a geographic heat map correlating benthic plastics with municipal drainage outlets.',
        clueForQuestionId: 26
      },
      {
        speaker: 'Student A',
        text: 'We also need to incorporate error bars representing our standard deviation across the triplicate sediment core samples.',
        clueForQuestionId: 27
      },
      {
        speaker: 'Professor',
        text: 'Make sure your peer-reviewed literature review references Professor Thorne\'s 2023 marine toxicology paper.',
        clueForQuestionId: 28
      },
      {
        speaker: 'Student B',
        text: 'We will cite Thorne\'s analysis on chemical plasticizers and bioaccumulation in benthic crustaceans.',
        clueForQuestionId: 29
      },
      {
        speaker: 'Professor',
        text: 'Excellent. Please submit your draft abstract to the departmental portal by Friday noon.',
        clueForQuestionId: 30
      }
    ],
    questions: [
      {
        id: 21,
        type: 'FORM_COMPLETION',
        prompt: 'Sediment separation chemical used: [____] chloride',
        correctAnswer: 'zinc',
        blankLabel: 'Chemical name',
        explanation: 'Student A states "using high-density zinc chloride density flotation".',
        targetVocab: 'sediment'
      },
      {
        id: 22,
        type: 'FORM_COMPLETION',
        prompt: 'Predominant synthetic fiber identified: [____]',
        correctAnswer: 'polyester',
        blankLabel: 'Fiber type',
        explanation: 'Student B notes "over 60% of synthetic fibers were identified as polyester".',
        targetVocab: 'spectroscopy'
      },
      {
        id: 23,
        type: 'FORM_COMPLETION',
        prompt: 'Researchers wore lab coats made of 100% [____] to prevent airborne contamination',
        correctAnswer: 'cotton',
        blankLabel: 'Fabric material',
        explanation: 'Student A mentions wearing "100% cotton lab coats".',
        targetVocab: 'methodology'
      },
      {
        id: 24,
        type: 'FORM_COMPLETION',
        prompt: 'Minimum particle size detected: [____] micrometers',
        correctAnswer: '20',
        blankLabel: 'Particle diameter',
        explanation: 'Student B states particle sizes down to 20 micrometers.',
        targetVocab: 'spectroscopy'
      },
      {
        id: 25,
        type: 'FORM_COMPLETION',
        prompt: 'Plastic concentrations spiked following heavy [____] rainfall events',
        correctAnswer: 'monsoon',
        blankLabel: 'Weather event',
        explanation: 'Student A highlights concentrations spiked after "heavy monsoon rainfall events".',
        targetVocab: 'estuary'
      },
      {
        id: 26,
        type: 'MULTIPLE_CHOICE',
        prompt: 'How do the students plan to visualize spatial microplastic distribution on their poster?',
        options: [
          'A. Through a geographic heat map overlaid on drainage outlets',
          'B. With black-and-white hand sketches of fish species',
          'C. Using an audio recording of ocean waves',
          'D. By displaying bottles of untreated silt water'
        ],
        correctAnswer: 'A',
        explanation: 'Student B confirms they are constructing a geographic heat map correlating plastics with drainage outlets.',
        targetVocab: 'methodology'
      },
      {
        id: 27,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What statistical measure must be included across the triplicate sediment samples?',
        options: [
          'A. Qualitative emotional ratings',
          'B. Error bars representing standard deviation',
          'C. Hypothetical future revenue projections',
          'D. Random number generator values'
        ],
        correctAnswer: 'B',
        explanation: 'Student A states they need error bars representing standard deviation.',
        targetVocab: 'hypothesis'
      },
      {
        id: 28,
        type: 'MULTIPLE_CHOICE',
        prompt: 'Which academic paper did the professor instruct the students to cite in their review?',
        options: [
          'A. Professor Thorne\'s 2023 marine toxicology paper',
          'B. Dr. Watson\'s 1953 DNA discovery paper',
          'C. Newton\'s Principia Mathematica',
          'D. An anonymous online forum blog'
        ],
        correctAnswer: 'A',
        explanation: 'The professor specifies Professor Thorne\'s 2023 marine toxicology paper.',
        targetVocab: 'methodology'
      },
      {
        id: 29,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What biological topic does Professor Thorne\'s research specifically examine?',
        options: [
          'A. Bird migration in the Sahara desert',
          'B. Chemical plasticizers and bioaccumulation in crustaceans',
          'C. Deep-sea volcanic hydrothermal vents',
          'D. Fossilized dinosaur footprint casts'
        ],
        correctAnswer: 'B',
        explanation: 'Student B references Thorne\'s analysis on chemical plasticizers and bioaccumulation.',
        targetVocab: 'microplastic'
      },
      {
        id: 30,
        type: 'MULTIPLE_CHOICE',
        prompt: 'When is the deadline for submitting the draft abstract to the portal?',
        options: [
          'A. Wednesday evening',
          'B. Friday noon',
          'C. Sunday midnight',
          'D. Next month'
        ],
        correctAnswer: 'B',
        explanation: 'The professor instructs them to submit the draft abstract by Friday noon.',
        targetVocab: 'methodology'
      }
    ]
  },
  {
    id: 'c19-t1-s4',
    cambridgeBook: 'Cambridge 19',
    testNum: 1,
    sectionNum: 4,
    title: 'Archaeology of Pre-Columbian Irrigation in the Andes',
    scenario: 'Academic university lecture on ancient agricultural engineering',
    speakerRole: 'Archaeology Lecturer',
    bandDifficulty: 'Band 8.0 - 9.0',
    durationSec: 360,
    keyVocab: ['terrace', 'irrigation', 'altitude', 'glacier', 'precipitation', 'agronomy', 'microclimate', 'hydraulic'],
    scriptParagraphs: [
      {
        speaker: 'Lecturer',
        text: 'Today we examine the sophisticated hydraulic agronomy of the pre-Inca Tiwanaku civilization around Lake Titicaca, situated 3,800 meters above sea level.'
      },
      {
        speaker: 'Lecturer',
        text: 'To cultivate tubers at extreme altitude, engineers devised raised field platforms surrounded by shallow water canals, known locally as suka kollus.',
        clueForQuestionId: 31
      },
      {
        speaker: 'Lecturer',
        text: 'During clear cold nights, thermal heat trapped in the canal water during sunny days radiated upwards, creating a microclimate that prevented devastating frost damage to crops.',
        clueForQuestionId: 32
      },
      {
        speaker: 'Lecturer',
        text: 'Furthermore, nutrient-rich organic sediment accumulating on canal floors was dredged seasonally and spread across the raised mounds as natural fertilizer.',
        clueForQuestionId: 33
      },
      {
        speaker: 'Lecturer',
        text: 'Archaeological core samples reveal that this system produced potato yields exceeding sixteen tons per hectare, far outperforming modern industrialized farming in the region.',
        clueForQuestionId: 34
      },
      {
        speaker: 'Lecturer',
        text: 'Water feeding these vast agricultural networks originated from glacial meltwater channeled through paved stone aqueducts.',
        clueForQuestionId: 35
      },
      {
        speaker: 'Lecturer',
        text: 'Sluice gates constructed from carved granite blocks allowed farmers to precisely regulate water depth according to seasonal precipitation patterns.',
        clueForQuestionId: 36
      },
      {
        speaker: 'Lecturer',
        text: 'However, ice-core climate data from the Quelccaya ice cap indicates that an unprecedented three-decade megadrought struck the Andean altiplano around 1000 AD.',
        clueForQuestionId: 37
      },
      {
        speaker: 'Lecturer',
        text: 'As glacial runoff dried up, the protective water canals evaporated, exposing staple crops to freezing temperatures and triggering agricultural collapse.',
        clueForQuestionId: 38
      },
      {
        speaker: 'Lecturer',
        text: 'In recent decades, modern indigenous cooperatives have partnered with anthropologists to rehabilitate these ancestral suka kollu systems.',
        clueForQuestionId: 39
      },
      {
        speaker: 'Lecturer',
        text: 'Field trials confirm that resurrected raised fields provide climate-resilient food security amidst current global warming fluctuations.',
        clueForQuestionId: 40
      }
    ],
    questions: [
      {
        id: 31,
        type: 'FORM_COMPLETION',
        prompt: 'Raised field platforms surrounded by shallow [____] canals (suka kollus)',
        correctAnswer: 'water',
        blankLabel: 'Canal content',
        explanation: 'The lecturer mentions "raised field platforms surrounded by shallow water canals".',
        targetVocab: 'irrigation'
      },
      {
        id: 32,
        type: 'FORM_COMPLETION',
        prompt: 'Nighttime thermal radiation protects high-altitude crops from [____] damage',
        correctAnswer: 'frost',
        blankLabel: 'Weather hazard',
        explanation: 'The lecture explains canal water radiated heat, "preventing devastating frost damage to crops".',
        targetVocab: 'altitude'
      },
      {
        id: 33,
        type: 'FORM_COMPLETION',
        prompt: 'Canal floor sediment was dredged annually and utilized as natural [____]',
        correctAnswer: 'fertilizer',
        blankLabel: 'Agricultural input',
        explanation: 'The speaker highlights sediment was "dredged seasonally and spread across the raised mounds as natural fertilizer".',
        targetVocab: 'agronomy'
      },
      {
        id: 34,
        type: 'FORM_COMPLETION',
        prompt: 'Ancient potato crop yields exceeded [____] tons per hectare',
        correctAnswer: '16',
        blankLabel: 'Yield quantity',
        explanation: 'The lecturer states potato yields were "exceeding sixteen tons per hectare".',
        targetVocab: 'agronomy'
      },
      {
        id: 35,
        type: 'FORM_COMPLETION',
        prompt: 'Water network supplied by glacial meltwater channeled through [____] aqueducts',
        correctAnswer: 'stone',
        blankLabel: 'Building material',
        explanation: 'The speaker mentions "glacial meltwater channeled through paved stone aqueducts".',
        targetVocab: 'hydraulic'
      },
      {
        id: 36,
        type: 'FORM_COMPLETION',
        prompt: 'Sluice gates built from carved [____] blocks regulated water levels',
        correctAnswer: 'granite',
        blankLabel: 'Rock type',
        explanation: 'The lecturer notes sluice gates were "constructed from carved granite blocks".',
        targetVocab: 'hydraulic'
      },
      {
        id: 37,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What catastrophic climatic event is recorded in the Quelccaya ice cap around 1000 AD?',
        options: [
          'A. An unprecedented three-decade megadrought',
          'B. A continuous ten-year deluge and flood',
          'C. A volcanic eruption covering the lake in ash',
          'D. The complete reversal of the Earth\'s magnetic poles'
        ],
        correctAnswer: 'A',
        explanation: 'The lecturer specifies "an unprecedented three-decade megadrought struck the Andean altiplano".',
        targetVocab: 'glacier'
      },
      {
        id: 38,
        type: 'MULTIPLE_CHOICE',
        prompt: 'Why did the Tiwanaku agricultural system collapse during the drought?',
        options: [
          'A. Lack of water evaporated canals, exposing crops to freezing temperatures',
          'B. Insects devoured all wooden houses',
          'C. The population moved to coastal cities for maritime commerce',
          'D. Saltwater contaminated Lake Titicaca completely'
        ],
        correctAnswer: 'A',
        explanation: 'The lecturer explains that when canals dried up, crops were exposed to freezing temperatures.',
        targetVocab: 'precipitation'
      },
      {
        id: 39,
        type: 'MULTIPLE_CHOICE',
        prompt: 'Who has collaborated with anthropologists in recent years to restore these ancient fields?',
        options: [
          'A. Modern indigenous farming cooperatives',
          'B. Foreign multinational mining corporations',
          'C. Space exploration agencies',
          'D. International tourism hotels'
        ],
        correctAnswer: 'A',
        explanation: 'The lecturer states modern indigenous cooperatives partnered with anthropologists.',
        targetVocab: 'agronomy'
      },
      {
        id: 40,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What major contemporary benefit do rehabilitated suka kollu systems provide today?',
        options: [
          'A. Climate-resilient food security in fluctuating conditions',
          'B. Elimination of all need for human labor',
          'C. Generation of commercial hydroelectricity',
          'D. Fast transit routes for speedboats'
        ],
        correctAnswer: 'A',
        explanation: 'The lecturer concludes that raised fields provide climate-resilient food security.',
        targetVocab: 'microclimate'
      }
    ]
  },

  // ================= CAMBRIDGE 18 =================
  {
    id: 'c18-t1-s1',
    cambridgeBook: 'Cambridge 18',
    testNum: 1,
    sectionNum: 1,
    title: 'Community Library Volunteer Registration',
    scenario: 'Dialogue between Head Librarian and applicant',
    speakerRole: 'Librarian & Volunteer',
    bandDifficulty: 'Band 6.0 - 7.0',
    durationSec: 190,
    keyVocab: ['volunteer', 'catalog', 'archive', 'literacy', 'schedule', 'commitment'],
    scriptParagraphs: [
      {
        speaker: 'Librarian',
        text: 'Good afternoon, thank you for expressing interest in joining our weekend community literacy initiative.'
      },
      {
        speaker: 'Applicant',
        text: 'I am delighted to assist. What specific responsibilities are available for Saturday mornings?'
      },
      {
        speaker: 'Librarian',
        text: 'Our primary need is leading the children’s interactive storytelling circle in the Oak Room from 10:00 AM.',
        clueForQuestionId: 1
      },
      {
        speaker: 'Applicant',
        text: 'I have experience tutoring primary students! What is the minimum weekly commitment required?'
      },
      {
        speaker: 'Librarian',
        text: 'We ask all registered volunteers for a minimum commitment of 3 hours per week for at least two months.',
        clueForQuestionId: 2
      },
      {
        speaker: 'Librarian',
        text: 'Please bring two forms of photo identification to our orientation meeting next Tuesday.',
        clueForQuestionId: 3
      }
    ],
    questions: [
      {
        id: 1,
        type: 'FORM_COMPLETION',
        prompt: 'Children storytelling activity takes place in the [____] Room',
        correctAnswer: 'Oak',
        blankLabel: 'Room name',
        explanation: 'The librarian mentions "interactive storytelling circle in the Oak Room".',
        targetVocab: 'literacy'
      },
      {
        id: 2,
        type: 'FORM_COMPLETION',
        prompt: 'Minimum weekly volunteer commitment: [____] hours',
        correctAnswer: '3',
        blankLabel: 'Hours per week',
        explanation: 'The librarian notes a "minimum commitment of 3 hours per week".',
        targetVocab: 'commitment'
      },
      {
        id: 3,
        type: 'FORM_COMPLETION',
        prompt: 'Orientation meeting day: next [____]',
        correctAnswer: 'Tuesday',
        blankLabel: 'Meeting day',
        explanation: 'The librarian says "bring two forms of photo identification to our orientation meeting next Tuesday".',
        targetVocab: 'schedule'
      }
    ]
  },
  {
    id: 'c18-t1-s2',
    cambridgeBook: 'Cambridge 18',
    testNum: 1,
    sectionNum: 2,
    title: 'Exhibition Guide: Ancient Glassmaking Heritage',
    scenario: 'Museum audio guide for special historical gallery',
    speakerRole: 'Museum Curator',
    bandDifficulty: 'Band 7.0 - 8.0',
    durationSec: 210,
    keyVocab: ['silica', 'furnace', 'artisan', 'translucent', 'potassium', 'archaeology'],
    scriptParagraphs: [
      {
        speaker: 'Curator',
        text: 'Welcome to Gallery 4: The Alchemy of Silica and Fire in Ancient Mesopotamia.'
      },
      {
        speaker: 'Curator',
        text: 'Early artisans combined quartz sand with alkaline plant ash in clay furnaces reaching over 1,100 degrees Celsius.',
        clueForQuestionId: 1
      },
      {
        speaker: 'Curator',
        text: 'In the central glass display case, notice the rare cobalt blue perfume flask dated to 1400 BC.',
        clueForQuestionId: 2
      }
    ],
    questions: [
      {
        id: 1,
        type: 'FORM_COMPLETION',
        prompt: 'Clay furnaces reached temperatures over [____] degrees Celsius',
        correctAnswer: '1100',
        blankLabel: 'Temperature',
        explanation: 'The curator states "clay furnaces reaching over 1,100 degrees Celsius".',
        targetVocab: 'furnace'
      },
      {
        id: 2,
        type: 'FORM_COMPLETION',
        prompt: 'Central display features a perfume flask colored with [____] blue',
        correctAnswer: 'cobalt',
        blankLabel: 'Color pigment',
        explanation: 'The curator highlights "the rare cobalt blue perfume flask".',
        targetVocab: 'translucent'
      }
    ]
  },
  {
    id: 'c18-t1-s4',
    cambridgeBook: 'Cambridge 18',
    testNum: 1,
    sectionNum: 4,
    title: 'The Impact of Urban Acoustic Noise on Songbirds',
    scenario: 'Bioacoustics university lecture',
    speakerRole: 'Ornithologist',
    bandDifficulty: 'Band 8.0 - 9.0',
    durationSec: 230,
    keyVocab: ['frequency', 'amplitude', 'decibel', 'adaptation', 'territory', 'ornithology'],
    scriptParagraphs: [
      {
        speaker: 'Lecturer',
        text: 'Urban noise pollution generated by heavy traffic creates low-frequency acoustic masking.'
      },
      {
        speaker: 'Lecturer',
        text: 'In response, European great tits in metropolitan parks have shifted their songs to significantly higher frequencies.',
        clueForQuestionId: 1
      },
      {
        speaker: 'Lecturer',
        text: 'However, singing at elevated pitch reduces the acoustic transmission distance across dense foliage, shrinking mating territory.',
        clueForQuestionId: 2
      }
    ],
    questions: [
      {
        id: 1,
        type: 'FORM_COMPLETION',
        prompt: 'Urban great tits adjust their vocalizations to higher [____]',
        correctAnswer: 'frequencies',
        blankLabel: 'Acoustic property',
        explanation: 'The lecture explains birds shifted their songs to "higher frequencies".',
        targetVocab: 'frequency'
      },
      {
        id: 2,
        type: 'FORM_COMPLETION',
        prompt: 'High-pitch vocalization reduces effective sound [____] in foliage',
        correctAnswer: 'distance',
        blankLabel: 'Acoustic reach',
        explanation: 'The speaker notes this "reduces the acoustic transmission distance across dense foliage".',
        targetVocab: 'adaptation'
      }
    ]
  },

  // ================= CAMBRIDGE 17 =================
  {
    id: 'c17-t1-s1',
    cambridgeBook: 'Cambridge 17',
    testNum: 1,
    sectionNum: 1,
    title: 'Buckworth Conservation Society Registration',
    scenario: 'Phone registration for weekend wetland tree planting',
    speakerRole: 'Conservation Officer & Resident',
    bandDifficulty: 'Band 6.0 - 7.0',
    durationSec: 180,
    keyVocab: ['conservation', 'wetland', 'sapling', 'equipment', 'waterproof', 'registration'],
    scriptParagraphs: [
      {
        speaker: 'Officer',
        text: 'Buckworth Conservation Society, Mark speaking. Are you calling regarding the upcoming riverbank restoration?'
      },
      {
        speaker: 'Resident',
        text: 'Yes! My family would love to take part in planting native willow saplings this Sunday.'
      },
      {
        speaker: 'Officer',
        text: 'Wonderful! All volunteers are requested to assemble at the Mill Bridge car park at 8:45 AM.',
        clueForQuestionId: 1
      },
      {
        speaker: 'Officer',
        text: 'We provide shovels and gloves, but participants must bring sturdy waterproof boots.',
        clueForQuestionId: 2
      },
      {
        speaker: 'Resident',
        text: 'Will lunch and refreshments be provided?'
      },
      {
        speaker: 'Officer',
        text: 'Yes, hot vegetable soup and bread will be served inside the community tent at 12:30.',
        clueForQuestionId: 3
      }
    ],
    questions: [
      {
        id: 1,
        type: 'FORM_COMPLETION',
        prompt: 'Meeting location: [____] Bridge car park',
        correctAnswer: 'Mill',
        blankLabel: 'Bridge name',
        explanation: 'The officer notes "assemble at the Mill Bridge car park at 8:45 AM".',
        targetVocab: 'conservation'
      },
      {
        id: 2,
        type: 'FORM_COMPLETION',
        prompt: 'Required personal footwear: Sturdy [____] boots',
        correctAnswer: 'waterproof',
        blankLabel: 'Footwear requirement',
        explanation: 'The officer clarifies "participants must bring sturdy waterproof boots".',
        targetVocab: 'equipment'
      },
      {
        id: 3,
        type: 'FORM_COMPLETION',
        prompt: 'Lunch provided at 12:30: Hot [____] soup',
        correctAnswer: 'vegetable',
        blankLabel: 'Food type',
        explanation: 'The speaker states "hot vegetable soup and bread will be served".',
        targetVocab: 'registration'
      }
    ]
  },
  {
    id: 'c17-t2-s4',
    cambridgeBook: 'Cambridge 17',
    testNum: 2,
    sectionNum: 4,
    title: 'Biomimicry in Modern Civil Architecture',
    scenario: 'Architecture & Sustainable Design Lecture',
    speakerRole: 'Architecture Professor',
    bandDifficulty: 'Band 8.0 - 9.0',
    durationSec: 230,
    keyVocab: ['biomimicry', 'ventilation', 'termite', 'passive', 'consumption', 'architect'],
    scriptParagraphs: [
      {
        speaker: 'Professor',
        text: 'Biomimicry involves emulating nature’s time-tested patterns and strategies to solve human engineering challenges.'
      },
      {
        speaker: 'Professor',
        text: 'A famous example is the Eastgate Centre in Harare, designed by architect Mick Pearce.',
        clueForQuestionId: 1
      },
      {
        speaker: 'Professor',
        text: 'Inspired by indigenous termite mounds, the building utilizes passive convection airflow, reducing energy consumption by 35%.',
        clueForQuestionId: 2
      }
    ],
    questions: [
      {
        id: 1,
        type: 'FORM_COMPLETION',
        prompt: 'Eastgate Centre building architect name: Mick [____]',
        correctAnswer: 'Pearce',
        blankLabel: 'Architect surname',
        explanation: 'The professor cites "designed by architect Mick Pearce".',
        targetVocab: 'biomimicry'
      },
      {
        id: 2,
        type: 'FORM_COMPLETION',
        prompt: 'Passive termite-inspired cooling reduces energy usage by [____] %',
        correctAnswer: '35',
        blankLabel: 'Percentage reduction',
        explanation: 'The lecture explains "reducing energy consumption by 35%".',
        targetVocab: 'ventilation'
      }
    ]
  },

  // ================= CAMBRIDGE 16 =================
  {
    id: 'c16-t1-s1',
    cambridgeBook: 'Cambridge 16',
    testNum: 1,
    sectionNum: 1,
    title: 'Children’s Creative Art Workshop Enrollment',
    scenario: 'Parent calling community center coordinator',
    speakerRole: 'Coordinator & Parent',
    bandDifficulty: 'Band 6.0 - 7.0',
    durationSec: 180,
    keyVocab: ['pottery', 'sculpture', 'registration', 'material', 'studio', 'canvas'],
    scriptParagraphs: [
      {
        speaker: 'Coordinator',
        text: 'Creative Arts Center, David speaking. How may I assist you with workshop enrollments?'
      },
      {
        speaker: 'Parent',
        text: 'Hello, I would like to enroll my 8-year-old daughter in the Saturday afternoon clay pottery class.'
      },
      {
        speaker: 'Coordinator',
        text: 'That class meets weekly in Studio B from 2:00 to 4:00 PM.',
        clueForQuestionId: 1
      },
      {
        speaker: 'Parent',
        text: 'What should children bring with them to the studio?'
      },
      {
        speaker: 'Coordinator',
        text: 'We provide all non-toxic clay and glazes, but students need an old painting apron.',
        clueForQuestionId: 2
      }
    ],
    questions: [
      {
        id: 1,
        type: 'FORM_COMPLETION',
        prompt: 'Pottery class venue: Studio [____]',
        correctAnswer: 'B',
        blankLabel: 'Studio letter',
        explanation: 'The coordinator confirms "class meets weekly in Studio B".',
        targetVocab: 'studio'
      },
      {
        id: 2,
        type: 'FORM_COMPLETION',
        prompt: 'Required protective garment: An old [____]',
        correctAnswer: 'apron',
        blankLabel: 'Clothing item',
        explanation: 'The coordinator states "students need an old painting apron".',
        targetVocab: 'pottery'
      }
    ]
  },

  // ================= CAMBRIDGE 15 =================
  {
    id: 'c15-t1-s1',
    cambridgeBook: 'Cambridge 15',
    testNum: 1,
    sectionNum: 1,
    title: 'Bank Account Opening Consultation',
    scenario: 'International student opening savings account',
    speakerRole: 'Bank Officer & Student',
    bandDifficulty: 'Band 6.0 - 7.0',
    durationSec: 180,
    keyVocab: ['passport', 'statement', 'overdraft', 'debit', 'branch', 'currency'],
    scriptParagraphs: [
      {
        speaker: 'Officer',
        text: 'Good morning! Welcome to Meridian Bank. Are you opening a student account today?'
      },
      {
        speaker: 'Student',
        text: 'Yes, I just arrived for my postgraduate program at the university.'
      },
      {
        speaker: 'Officer',
        text: 'To complete your profile, I need your passport and official university enrolment letter.',
        clueForQuestionId: 1
      },
      {
        speaker: 'Officer',
        text: 'Your contactless debit card will be delivered to your residence within 5 working days.',
        clueForQuestionId: 2
      }
    ],
    questions: [
      {
        id: 1,
        type: 'FORM_COMPLETION',
        prompt: 'Required documentation: Passport and university [____] letter',
        correctAnswer: 'enrolment',
        blankLabel: 'Letter type',
        explanation: 'The officer asks for "passport and official university enrolment letter".',
        targetVocab: 'passport'
      },
      {
        id: 2,
        type: 'FORM_COMPLETION',
        prompt: 'Debit card delivery timeframe: Within [____] working days',
        correctAnswer: '5',
        blankLabel: 'Number of days',
        explanation: 'The officer confirms delivery "within 5 working days".',
        targetVocab: 'debit'
      }
    ]
  },

  // ================= CAMBRIDGE 14 =================
  {
    id: 'c14-t1-s1',
    cambridgeBook: 'Cambridge 14',
    testNum: 1,
    sectionNum: 1,
    title: 'City Marathon Volunteer Registration',
    scenario: 'Volunteer coordinator telephone intake',
    speakerRole: 'Coordinator & Volunteer',
    bandDifficulty: 'Band 6.0 - 7.0',
    durationSec: 180,
    keyVocab: ['registration', 'volunteer', 'hydration', 'marshal', 'checkpoint', 'vest'],
    scriptParagraphs: [
      {
        speaker: 'Coordinator',
        text: 'City Marathon Office, Liam speaking.'
      },
      {
        speaker: 'Volunteer',
        text: 'Hi Liam, I would like to sign up as a course marshal or hydration station assistant for the October race.'
      },
      {
        speaker: 'Coordinator',
        text: 'Terrific! All volunteers receive a briefing session on October 8th at the Central Arena.',
        clueForQuestionId: 1
      },
      {
        speaker: 'Volunteer',
        text: 'Got it. Which duty station has the greatest need right now?'
      },
      {
        speaker: 'Coordinator',
        text: 'We urgently need assistants at the 25-kilometer water and energy drink station.',
        clueForQuestionId: 2
      },
      {
        speaker: 'Coordinator',
        text: 'We provide an official bright yellow vest and an ID lanyard on the morning of the event.',
        clueForQuestionId: 3
      }
    ],
    questions: [
      {
        id: 1,
        type: 'FORM_COMPLETION',
        prompt: 'Volunteer briefing date: October [____]',
        correctAnswer: '8th',
        blankLabel: 'Briefing date',
        explanation: 'The coordinator specifies: "briefing session on October 8th".',
        targetVocab: 'registration'
      },
      {
        id: 2,
        type: 'FORM_COMPLETION',
        prompt: 'Assigned hydration station distance: [____] km mark',
        correctAnswer: '25',
        blankLabel: 'Station distance',
        explanation: 'The coordinator highlights: "at the 25-kilometer water and energy drink station".',
        targetVocab: 'hydration'
      },
      {
        id: 3,
        type: 'FORM_COMPLETION',
        prompt: 'Official clothing provided: Bright [____] vest',
        correctAnswer: 'yellow',
        blankLabel: 'Vest color',
        explanation: 'The coordinator mentions: "official bright yellow vest and an ID lanyard".',
        targetVocab: 'volunteer'
      }
    ]
  },

  // ================= CAMBRIDGE SPECIAL ARCHIVE: TENNIS & SPORTS SCIENCE =================
  {
    id: 'c-tennis-club-s1',
    cambridgeBook: 'Cambridge IELTS Academic Special',
    testNum: 1,
    sectionNum: 1,
    title: 'University Tennis Club Membership & Coaching Application',
    scenario: 'Student consultation with sports club coordinator regarding tennis membership, court rental, and coaching clinics',
    speakerRole: 'Club Coordinator & Student Applicant',
    bandDifficulty: 'Band 6.5 - 7.5',
    durationSec: 320,
    keyVocab: ['membership', 'racquet', 'stringing', 'synthetic', 'floodlight', 'intermediate', 'tournament', 'locker'],
    scriptParagraphs: [
      {
        speaker: 'Coordinator',
        text: 'Good afternoon, University Sports and Racket Club. How can I help you today?'
      },
      {
        speaker: 'Student',
        text: 'Hi there! I would like to inquire about joining the campus tennis club and booking some court sessions for the autumn term.'
      },
      {
        speaker: 'Coordinator',
        text: 'Wonderful. Let me take down your details first. Could I have your full name and student registration ID?'
      },
      {
        speaker: 'Student',
        text: 'Yes, my name is Marcus Fletcher, and my student ID is TF9428.'
      },
      {
        speaker: 'Coordinator',
        text: 'Great. Now, we offer three membership tiers: Bronze, Silver, and Gold. Silver is the most popular with undergraduates because it includes unlimited off-peak court reservations on both our indoor synthetic carpet courts and our four outdoor clay courts.'
      },
      {
        speaker: 'Student',
        text: 'That sounds perfect. How far in advance can Silver members reserve a court?'
      },
      {
        speaker: 'Coordinator',
        text: 'Silver members can book courts up to 7 days in advance using the campus sports app. For evening play under floodlights, there is a small electricity surcharge of four pounds per hour.'
      },
      {
        speaker: 'Student',
        text: 'Understood. Do you also provide equipment hire and racket maintenance?'
      },
      {
        speaker: 'Coordinator',
        text: 'Yes, professional racket stringing is available on-site for twelve pounds, and you can rent high-performance graphite rackets from the equipment desk.'
      },
      {
        speaker: 'Student',
        text: 'Excellent. What about coaching sessions? I used to play in high school, so I am looking for something beyond beginner level.'
      },
      {
        speaker: 'Coordinator',
        text: 'We run weekly intermediate group clinics every Saturday morning starting at 9:30 AM with Coach David Henderson. It covers tactical court positioning, topspin consistency, and serve biomechanics.'
      },
      {
        speaker: 'Student',
        text: 'Sign me up for that! One last question: are secure storage lockers included?'
      },
      {
        speaker: 'Coordinator',
        text: 'Yes, your membership includes locker number 48 in the East Pavilion changing area.'
      }
    ],
    questions: [
      {
        id: 1,
        type: 'FORM_COMPLETION',
        prompt: 'Student registration ID: [____]',
        correctAnswer: 'TF9428',
        blankLabel: 'Student ID',
        explanation: 'The student states his ID is TF9428.',
        targetVocab: 'membership'
      },
      {
        id: 2,
        type: 'FORM_COMPLETION',
        prompt: 'Selected membership tier: [____]',
        correctAnswer: 'Silver',
        blankLabel: 'Membership tier',
        explanation: 'The coordinator recommends the Silver tier for undergraduates.',
        targetVocab: 'membership'
      },
      {
        id: 3,
        type: 'FORM_COMPLETION',
        prompt: 'Indoor surface type: [____] carpet',
        correctAnswer: 'synthetic',
        blankLabel: 'Court surface',
        explanation: 'Coordinator mentions "indoor synthetic carpet courts".',
        targetVocab: 'synthetic'
      },
      {
        id: 4,
        type: 'FORM_COMPLETION',
        prompt: 'Outdoor court surface: 4 [____] courts',
        correctAnswer: 'clay',
        blankLabel: 'Outdoor surface',
        explanation: 'Coordinator notes "four outdoor clay courts".',
        targetVocab: 'racquet'
      },
      {
        id: 5,
        type: 'FORM_COMPLETION',
        prompt: 'Court booking allowed up to [____] days in advance',
        correctAnswer: '7',
        blankLabel: 'Advance booking days',
        explanation: 'Coordinator says "book courts up to 7 days in advance".',
        targetVocab: 'membership'
      },
      {
        id: 6,
        type: 'FORM_COMPLETION',
        prompt: 'Evening floodlight surcharge per hour: £[____]',
        correctAnswer: '4',
        blankLabel: 'Floodlight fee',
        explanation: 'Coordinator mentions "four pounds per hour".',
        targetVocab: 'floodlight'
      },
      {
        id: 7,
        type: 'FORM_COMPLETION',
        prompt: 'On-site racket stringing service cost: £[____]',
        correctAnswer: '12',
        blankLabel: 'Stringing fee',
        explanation: 'Coordinator specifies "professional racket stringing is available on-site for twelve pounds".',
        targetVocab: 'stringing'
      },
      {
        id: 8,
        type: 'FORM_COMPLETION',
        prompt: 'Coaching clinic skill level: [____]',
        correctAnswer: 'Intermediate',
        blankLabel: 'Clinic level',
        explanation: 'Coordinator mentions "weekly intermediate group clinics".',
        targetVocab: 'intermediate'
      },
      {
        id: 9,
        type: 'FORM_COMPLETION',
        prompt: 'Saturday coaching start time: [____]',
        correctAnswer: '9:30 AM',
        blankLabel: 'Clinic time',
        explanation: 'Coordinator confirms "every Saturday morning starting at 9:30 AM".',
        targetVocab: 'tournament'
      },
      {
        id: 10,
        type: 'FORM_COMPLETION',
        prompt: 'Assigned locker number: [____]',
        correctAnswer: '48',
        blankLabel: 'Locker number',
        explanation: 'Coordinator assigns "locker number 48 in the East Pavilion".',
        targetVocab: 'locker'
      }
    ]
  },
  {
    id: 'c-tennis-centre-s2',
    cambridgeBook: 'Cambridge IELTS Academic Special',
    testNum: 1,
    sectionNum: 2,
    title: 'Westfield Community Tennis & Racket Sports Centre Refurbishment',
    scenario: 'Facility manager speech introducing renovated floodlit acrylic courts, digital court booking kiosk, and amateur club tournament',
    speakerRole: 'Centre Operations Supervisor',
    bandDifficulty: 'Band 6.5 - 7.5',
    durationSec: 340,
    keyVocab: ['acrylic', 'cushioned', 'rebound', 'automated', 'ball machine', 'refurbishment', 'tournament', 'handicap'],
    scriptParagraphs: [
      {
        speaker: 'Supervisor',
        text: 'Welcome everyone to Westfield Community Sports Centre. We are thrilled to celebrate the grand reopening of our upgraded tennis and racket sports wing following an eight-month, 1.2-million-pound refurbishment project.'
      },
      {
        speaker: 'Supervisor',
        text: 'First, let me outline our brand new court surfaces. We have resurfaced all six main tournament courts with a multi-layered cushioned acrylic system. Unlike traditional hard courts which put extreme strain on players\' knees and ankles, this composite acrylic substrate absorbs approximately twenty percent of joint impact while ensuring a true, consistent ball bounce.'
      },
      {
        speaker: 'Supervisor',
        text: 'Secondly, we have installed state-of-the-art energy-efficient LED floodlights that eliminate distracting glare and reduce shadow distortion, allowing league matches to run safely until 10:00 PM.'
      },
      {
        speaker: 'Supervisor',
        text: 'Members will also notice our automated equipment station adjacent to Court 3. Here you can rent programmable ball machines capable of simulating high-spin topspin lobs, slice drop shots, and flat serves at variable speeds up to 130 km/h.'
      },
      {
        speaker: 'Supervisor',
        text: 'Finally, mark your calendars for our annual Autumn Handicap Tournament taking place on October 14th. Entry forms can be submitted via our new mobile app or at the front reception desk until the end of this month.'
      }
    ],
    questions: [
      {
        id: 11,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What major benefit is provided by the new cushioned acrylic court surface?',
        options: [
          'A. It completely prevents rain from falling on the court',
          'B. It absorbs approximately 20% of joint impact',
          'C. It speeds up the ball to over 200 km/h automatically',
          'D. It requires zero maintenance for 50 years'
        ],
        correctAnswer: 'B. It absorbs approximately 20% of joint impact',
        explanation: 'Supervisor states the composite acrylic absorbs approximately twenty percent of joint impact.',
        targetVocab: 'cushioned'
      },
      {
        id: 12,
        type: 'MULTIPLE_CHOICE',
        prompt: 'Until what time are evening floodlit matches permitted to continue?',
        options: ['A. 8:30 PM', 'B. 9:00 PM', 'C. 10:00 PM', 'D. Midnight'],
        correctAnswer: 'C. 10:00 PM',
        explanation: 'Supervisor says floodlights allow league matches to run safely until 10:00 PM.',
        targetVocab: 'refurbishment'
      },
      {
        id: 13,
        type: 'MULTIPLE_CHOICE',
        prompt: 'Where is the automated ball machine rental station located?',
        options: [
          'A. Behind the cafeteria',
          'B. Adjacent to Court 3',
          'C. Inside the basement garage',
          'D. Next to Court 6'
        ],
        correctAnswer: 'B. Adjacent to Court 3',
        explanation: 'Supervisor indicates the automated equipment station is adjacent to Court 3.',
        targetVocab: 'ball machine'
      },
      {
        id: 14,
        type: 'MULTIPLE_CHOICE',
        prompt: 'What maximum ball speed can the programmable ball machine simulate?',
        options: ['A. 90 km/h', 'B. 110 km/h', 'C. 130 km/h', 'D. 160 km/h'],
        correctAnswer: 'C. 130 km/h',
        explanation: 'Supervisor specifies variable speeds up to 130 km/h.',
        targetVocab: 'rebound'
      },
      {
        id: 15,
        type: 'MULTIPLE_CHOICE',
        prompt: 'When will the Autumn Handicap Tournament take place?',
        options: ['A. September 1st', 'B. October 14th', 'C. November 5th', 'D. December 20th'],
        correctAnswer: 'B. October 14th',
        explanation: 'Supervisor announces the tournament takes place on October 14th.',
        targetVocab: 'tournament'
      }
    ]
  }
];

/**
 * Calculate listening hit stats for all sections, combining custom sections if provided
 */
export function getListeningSectionsWithHits(
  userWords: string[],
  customSections: IELTSListeningSection[] = []
): Array<{
  section: IELTSListeningSection;
  matchedWords: string[];
  hitCount: number;
}> {
  const normalizedUserWords = (userWords || []).map(w => w.trim().toLowerCase()).filter(Boolean);
  const combined = [...customSections, ...CAMBRIDGE_IELTS_LISTENING];

  return combined.map(section => {
    const fullText = (
      section.title + ' ' +
      section.scenario + ' ' +
      section.keyVocab.join(' ') + ' ' +
      section.scriptParagraphs.map(p => p.text).join(' ')
    ).toLowerCase();

    const matched: string[] = [];
    for (const w of normalizedUserWords) {
      if (w.length < 2) continue;
      const regex = new RegExp(`\\b${w}`, 'i');
      if (regex.test(fullText)) {
        matched.push(w);
      }
    }

    return {
      section,
      matchedWords: matched,
      hitCount: matched.length
    };
  }).sort((a, b) => b.hitCount - a.hitCount);
}
