/**
 * Human Atlas educational content.
 * Original summaries; references are supplied with each entry.
 * Organ summaries explain the named organ or tissue class, not every mesh subregion.
 * The viewer uses adult male reference anatomy; it is not a physiology simulation.
 */
const seer = "https://training.seer.cancer.gov/anatomy/";

export const SYSTEMS = [
  {
    id: "skeletal",
    name: "Skeletal",
    color: "#ded4b9",
    subtitle: "Support & structure",
    description:
      "Bones form a living framework that supports the body, protects delicate organs, and gives muscles something to pull against. Bone tissue continually renews itself.",
    functions: [
      "Support and protect organs",
      "Provide levers for movement",
      "Store minerals and house blood-forming marrow",
    ],
    source: `${seer}skeletal/`,
  },
  {
    id: "muscular",
    name: "Muscular",
    color: "#cf776b",
    subtitle: "Movement & stability",
    description:
      "Skeletal muscles turn chemical energy into force. Working with bones and joints, they move the body, stabilize posture, and release heat.",
    functions: [
      "Move the skeleton",
      "Maintain posture and joint stability",
      "Produce heat during contraction",
    ],
    source: `${seer}muscular/`,
  },
  {
    id: "nervous",
    name: "Nervous",
    color: "#e2bf6d",
    subtitle: "Sense & respond",
    description:
      "The brain, spinal cord, and nerves gather information and coordinate responses. Their activity supports sensation, movement, memory, and thought.",
    functions: [
      "Detect changes inside and outside the body",
      "Process and integrate information",
      "Coordinate muscles and glands",
    ],
    source: `${seer}nervous/`,
  },
  {
    id: "cardiovascular",
    name: "Cardiovascular",
    color: "#bc5f5d",
    subtitle: "Transport & circulation",
    description:
      "The heart drives blood through a network of vessels. This circulation connects the lungs, digestive organs, kidneys, and other tissues.",
    functions: [
      "Deliver oxygen and nutrients",
      "Carry wastes toward organs that remove them",
      "Distribute hormones and heat",
    ],
    source: `${seer}cardiovascular/`,
  },
  {
    id: "respiratory",
    name: "Respiratory",
    color: "#88b8c2",
    subtitle: "Breathe & exchange",
    description:
      "Airways carry air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing muscles keep that air moving.",
    functions: [
      "Bring oxygen into the blood",
      "Remove carbon dioxide",
      "Help regulate blood acidity",
    ],
    source: `${seer}respiratory/`,
  },
  {
    id: "digestive",
    name: "Digestive",
    color: "#cb9c68",
    subtitle: "Nourish & absorb",
    description:
      "The digestive tract breaks food into absorbable nutrients. The liver, pancreas, and other accessory organs contribute substances that help digestion.",
    functions: [
      "Break food down",
      "Absorb nutrients and water",
      "Eliminate undigested material",
    ],
    source: `${seer}digestive/`,
  },
  {
    id: "urinary",
    name: "Urinary",
    color: "#a495c4",
    subtitle: "Filter & balance",
    description:
      "The kidneys adjust the composition of body fluids and form urine. The ureters, bladder, and urethra carry, store, and release it.",
    functions: [
      "Remove metabolic wastes",
      "Regulate water and dissolved salts",
      "Help maintain acid–base balance",
    ],
    source: `${seer}urinary/`,
  },
  {
    id: "endocrine",
    name: "Endocrine",
    color: "#d194ae",
    subtitle: "Signal & regulate",
    description:
      "Endocrine glands release hormones into the blood. These chemical signals act on cells with matching receptors to regulate growth, metabolism, and reproduction.",
    functions: [
      "Coordinate growth and development",
      "Regulate energy use",
      "Support reproductive and stress responses",
    ],
    source: `${seer}endocrine/`,
  },
  {
    id: "lymphatic",
    name: "Lymphatic",
    color: "#7eada1",
    subtitle: "Return & defend",
    description:
      "Lymphatic vessels return excess tissue fluid to circulation. Lymphatic tissues and organs support immune defenses and help transport absorbed dietary fats.",
    functions: [
      "Return tissue fluid to the blood",
      "Support immune responses",
      "Transport many absorbed fats",
    ],
    source: `${seer}lymphatic/`,
  },
  {
    id: "reproductive",
    name: "Reproductive",
    color: "#af8b9d",
    subtitle: "Reproduction & hormones",
    description:
      "Reproductive organs produce and transport reproductive cells and contribute sex hormones. This reference model shows male anatomy; female anatomy is not included.",
    functions: [
      "Produce sperm in the testes",
      "Support and transport sperm",
      "Contribute reproductive hormones",
    ],
    source: `${seer}reproductive/`,
  },
  {
    id: "integumentary",
    name: "Integumentary",
    color: "#c7a68d",
    subtitle: "Protect & sense",
    description:
      "The skin is the body’s outer barrier. Together with its associated structures, it limits fluid loss, supports temperature control, and provides sensation.",
    functions: [
      "Protect against environmental hazards",
      "Limit water loss",
      "Sense touch and help control temperature",
    ],
    source: "https://medlineplus.gov/skinconditions.html",
  },
];

const entry = (match, summary, functions, connection, source) => ({
  match,
  summary,
  functions,
  connection,
  source,
});

// Order matters: vessels and nerves are recognized before the organs they supply.
const ORGAN_ENTRIES = [
  entry(
    /\b(artery|arteries|aorta|arterial)\b/i,
    "About arteries: these vessels carry blood away from the heart. Most carry oxygen-rich blood; pulmonary arteries carry oxygen-poor blood toward the lungs.",
    [
      "Carry blood away from the heart",
      "Distribute flow through branches",
      "Help regulate delivery to tissues",
    ],
    "Arteries lead to smaller vessels and capillary beds, where exchange with tissues occurs.",
    `${seer}cardiovascular/blood/classification.html`,
  ),
  entry(
    /\b(vein|veins|venous|vena cava|venae cavae)\b/i,
    "About veins: these vessels return blood toward the heart. The direction of flow defines a vein, rather than how much oxygen the blood contains.",
    [
      "Return blood toward the heart",
      "Collect blood from smaller vessels",
      "Hold a substantial share of circulating blood",
    ],
    "Pulmonary veins return oxygen-rich blood from the lungs.",
    `${seer}cardiovascular/blood/classification.html`,
  ),
  entry(
    /\b(nerve|nerves|ganglion|plexus)\b/i,
    "About peripheral nerves: bundles of nerve fibers connect the central nervous system with other tissues. Individual nerves may carry sensory, motor, or mixed signals.",
    [
      "Carry sensory information",
      "Transmit motor signals where present",
      "Connect body regions with neural control centers",
    ],
    "A nerve’s role depends on the fibers it contains; this is a general nerve overview.",
    `${seer}nervous/organization/pns.html`,
  ),
  entry(
    /\b(brain|cerebrum|cerebral hemisphere|cerebellum|brainstem|pons|medulla oblongata)\b/i,
    "About the brain: interconnected regions process sensory information and coordinate behavior and body functions. Different regions make different contributions.",
    [
      "Interpret sensory information",
      "Support learning and memory",
      "Coordinate movement and internal regulation",
    ],
    "The spinal cord and cranial nerves connect the brain with the rest of the body.",
    `${seer}nervous/organization/cns.html`,
  ),
  entry(
    /\bspinal cord\b/i,
    "The spinal cord is nervous tissue protected within the vertebral column. It carries signals between the brain and body and participates in reflexes.",
    [
      "Relay signals to and from the brain",
      "Integrate spinal reflexes",
      "Connect with spinal nerves",
    ],
    "The spinal cord is distinct from the surrounding bony spine.",
    `${seer}nervous/organization/cns.html`,
  ),
  entry(
    /\b(heart|myocardium|cardiac ventricle|cardiac atrium)\b/i,
    "About the heart: this muscular organ acts as a pump. Its right side sends blood toward the lungs; its left side sends blood into the body’s systemic circulation.",
    [
      "Maintain blood flow",
      "Drive pulmonary circulation",
      "Drive systemic circulation",
    ],
    "The lungs exchange gases; the heart supplies the force that moves blood through the circuit.",
    `${seer}cardiovascular/heart/`,
  ),
  entry(
    /\b(lung|lungs|bronchus|bronchi|bronchiole)\b/i,
    "About the lungs and bronchial tree: branching airways lead to tiny air sacs called alveoli. Gas exchange takes place across the thin boundary between alveoli and capillaries.",
    [
      "Conduct air through branching passages",
      "Transfer oxygen into blood at alveoli",
      "Transfer carbon dioxide into alveolar air",
    ],
    "The microscopic alveoli and capillaries are not resolved in this whole-body model.",
    `${seer}respiratory/passages/bronchi.html`,
  ),
  entry(
    /\btrachea\b/i,
    "The trachea, or windpipe, connects the larynx to the main bronchi. Cartilage supports its wall while its lining helps clear inhaled particles.",
    [
      "Conduct air toward the lungs",
      "Maintain an open airway",
      "Help clear mucus and trapped particles",
    ],
    "At its lower end, the trachea divides into the right and left main bronchi.",
    `${seer}respiratory/passages/larynx.html`,
  ),
  entry(
    /\bdiaphragm\b/i,
    "The diaphragm is the main muscle of quiet inhalation. When it contracts, the chest cavity expands and pressure falls, drawing air into the lungs.",
    [
      "Expand the chest during inhalation",
      "Create pressure changes for airflow",
      "Separate the chest and abdominal cavities",
    ],
    "Breathing depends on muscles and pressure differences, not active pumping by the lungs.",
    `${seer}respiratory/mechanics.html`,
  ),
  entry(
    /\bliver\b/i,
    "The liver is a large organ beneath the diaphragm. It makes bile and processes many substances arriving in the blood from the digestive tract.",
    [
      "Produce bile",
      "Process and store nutrients",
      "Modify and break down many substances",
    ],
    "Bile reaches the small intestine through ducts and helps with fat digestion.",
    `${seer}digestive/regions/accessory.html`,
  ),
  entry(
    /\b(gallbladder|gall bladder)\b/i,
    "The gallbladder is a small sac associated with the liver. It stores and concentrates bile between meals.",
    ["Store bile", "Concentrate bile", "Release bile into the digestive tract"],
    "The liver makes bile; the gallbladder stores it.",
    `${seer}digestive/regions/accessory.html`,
  ),
  entry(
    /\bpancreas\b/i,
    "The pancreas contributes to both digestion and hormonal regulation. Its endocrine cells release hormones including insulin and glucagon.",
    ["Supply digestive secretions", "Release insulin", "Release glucagon"],
    "Its digestive secretions travel through ducts, while its hormones enter the blood.",
    `${seer}endocrine/glands/pancreas.html`,
  ),
  entry(
    /\bstomach\b/i,
    "The stomach is a muscular chamber between the esophagus and small intestine. It mixes a meal with acidic secretions and begins substantial protein digestion.",
    [
      "Temporarily store a meal",
      "Mix food with gastric secretions",
      "Release contents gradually into the small intestine",
    ],
    "The stomach starts processes that continue farther along the digestive tract.",
    `${seer}digestive/regions/stomach.html`,
  ),
  entry(
    /\b(intestine|intestines|duodenum|jejunum|ileum|colon|rectum|cecum)\b/i,
    "About the intestines: the small intestine performs most nutrient absorption. The large intestine recovers water and electrolytes and helps form and store feces.",
    [
      "Continue digestion in the small intestine",
      "Absorb nutrients, water, and salts",
      "Move remaining material toward elimination",
    ],
    "These are shared intestinal functions; each selected region has a different role.",
    `${seer}digestive/regions/intestine.html`,
  ),
  entry(
    /\b(kidney|kidneys|renal cortex|renal medulla|renal pelvis)\b/i,
    "About the kidneys: these paired organs filter blood and selectively recover needed substances. Their microscopic functional units, nephrons, produce urine.",
    [
      "Remove wastes into urine",
      "Adjust water and electrolyte balance",
      "Help regulate acid–base balance",
    ],
    "Urine passes from each kidney into a ureter. Individual nephrons are not shown here.",
    `${seer}urinary/components/kidney.html`,
  ),
  entry(
    /\burinary bladder\b/i,
    "The urinary bladder is a stretchable muscular reservoir in the pelvis. It holds urine arriving from the ureters until urination.",
    [
      "Receive urine from the ureters",
      "Store urine",
      "Contract during bladder emptying",
    ],
    "The urethra carries urine from the bladder to the outside of the body.",
    `${seer}urinary/components/bladder.html`,
  ),
  entry(
    /\bthyroid\b/i,
    "The thyroid is an endocrine gland in the neck. Its hormones influence how the body uses energy and support growth and development.",
    [
      "Produce thyroid hormones",
      "Influence metabolic activity",
      "Support growth and development",
    ],
    "The nearby parathyroid glands are separate organs with different hormonal functions.",
    `${seer}endocrine/glands/thyroid.html`,
  ),
  entry(
    /\b(adrenal|suprarenal) gland\b/i,
    "An adrenal gland lies above each kidney. Its outer cortex and inner medulla produce different hormones involved in fluid balance, metabolism, and stress responses.",
    [
      "Support stress responses",
      "Help regulate salt balance",
      "Influence metabolism",
    ],
    "Despite their position above the kidneys, adrenal glands belong to the endocrine system.",
    `${seer}endocrine/glands/adrenal.html`,
  ),
  entry(
    /\b(pituitary|hypophysis)\b/i,
    "The pituitary is a small gland at the base of the brain. Under hypothalamic control, it releases hormones that influence other glands and body processes.",
    [
      "Help coordinate endocrine signals",
      "Regulate growth through growth hormone",
      "Influence reproductive and thyroid activity",
    ],
    "The hypothalamus links nervous-system information with pituitary regulation.",
    `${seer}endocrine/glands/pituitary.html`,
  ),
  entry(
    /\bspleen\b/i,
    "The spleen is a lymphatic organ in the upper left abdomen. It monitors blood, supports immune responses, and removes worn-out blood cells.",
    ["Filter blood", "Support immune surveillance", "Remove aged blood cells"],
    "The spleen filters blood; lymph nodes mainly filter lymph.",
    `${seer}lymphatic/components/spleen.html`,
  ),
  entry(
    /\b(testis|testes)\b/i,
    "The testes are reproductive organs that produce sperm and hormones including testosterone. Sperm development takes place in microscopic seminiferous tubules.",
    [
      "Produce sperm",
      "Produce testosterone",
      "Release hormones involved in reproductive regulation",
    ],
    "Sperm pass into the epididymis for further maturation and storage.",
    `${seer}reproductive/male/testes.html`,
  ),
  entry(
    /\bprostate\b/i,
    "The prostate is an accessory reproductive gland below the bladder. It surrounds the first part of the urethra and adds fluid to semen.",
    [
      "Contribute prostatic fluid to semen",
      "Supply substances that support sperm function",
      "Release secretions into the urethra",
    ],
    "The urethra passes through the prostate, connecting reproductive and urinary anatomy.",
    `${seer}reproductive/male/glands.html`,
  ),
  entry(
    /\b(skin|integument)\b/i,
    "About the skin: this living outer covering helps separate the internal body from the environment. Its protective, sensory, and temperature-control roles work together.",
    [
      "Limit fluid loss and entry of harmful agents",
      "Provide sensory information",
      "Help regulate body temperature",
    ],
    "The surface mesh does not resolve microscopic skin layers, follicles, or individual receptors.",
    "https://medlineplus.gov/skinconditions.html",
  ),
  entry(
    /\b(bone|femur|tibia|fibula|humerus|radius|ulna|rib|ribs|vertebra|vertebrae|sacrum|clavicle|scapula|sternum|patella|metacarpal|metatarsal|phalanx|phalanges|carpal|tarsal)\b/i,
    "About bones: bone is living tissue with a blood supply. Its mineralized framework provides support and attachment points for muscles; internal marrow has other roles.",
    [
      "Support or protect surrounding structures",
      "Provide attachment and leverage",
      "Store minerals",
    ],
    "This is a general bone overview. Shape and location determine each bone’s mechanical role.",
    `${seer}skeletal/`,
  ),
  entry(
    /\b(muscle|biceps|triceps|deltoid|gluteus|gastrocnemius|soleus|pectoralis|rectus|oblique|trapezius|latissimus|sartorius|vastus)\b/i,
    "About skeletal muscles: contracting fibers generate tension that is transmitted to attachments. Different muscles produce different actions depending on their position and attachments.",
    [
      "Generate force through contraction",
      "Contribute to movement or stability",
      "Release heat during activity",
    ],
    "This is a general muscle overview, not a list of the selected muscle’s specific actions.",
    `${seer}muscular/`,
  ),
];

export function organInfo(name, systemId) {
  const normalizedName = String(name ?? "").replaceAll("_", " ");
  const match = ORGAN_ENTRIES.find((item) => item.match.test(normalizedName));
  if (match) {
    const { summary, functions, connection, source } = match;
    return { summary, functions: [...functions], connection, source };
  }
  const system = SYSTEMS.find((item) => item.id === systemId);
  if (system)
    return {
      summary: `System overview: ${system.description}`,
      functions: [...system.functions],
      connection:
        "This entry provides context for the system. A description specific to this individual structure has not yet been authored.",
      source: system.source,
    };
  return {
    summary:
      "This named structure comes from the BodyParts3D anatomical reference. Explore its shape and position relative to nearby structures.",
    functions: [
      "Inspect its three-dimensional shape",
      "Compare its position with nearby anatomy",
      "Use the source identifier for further study",
    ],
    connection:
      "A function-specific explanation for this structure is not included in this edition.",
    source: "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html",
  };
}

export const LESSONS = [
  {
    id: "breath",
    title: "Follow a breath",
    subtitle: "Air, blood, and the journey of oxygen",
    steps: [
      {
        title: "The airway begins to branch",
        query: "trachea",
        body: "Air passes down the trachea and into the main bronchi. Trace the branching route toward the lungs.",
        systems: ["respiratory"],
      },
      {
        title: "Meet the exchange surface",
        query: "left lung",
        body: "Inside the lungs, microscopic alveoli exchange oxygen and carbon dioxide with blood. Those tiny exchange surfaces are below this model’s resolution.",
        systems: ["respiratory", "cardiovascular"],
      },
      {
        title: "Connect the two circuits",
        query: "heart",
        body: "The right side of the heart pumps toward the lungs. Blood returns to the left side before being sent around the body.",
        systems: ["cardiovascular", "respiratory"],
      },
      {
        title: "Out to the body",
        query: "aorta",
        body: "The aorta receives blood from the left ventricle and branches toward the body’s tissues. Follow how this large vessel travels away from the heart.",
        systems: ["cardiovascular"],
      },
    ],
  },
  {
    id: "food",
    title: "From food to fuel",
    subtitle: "A journey through the digestive organs",
    steps: [
      {
        title: "Mix and prepare",
        query: "stomach",
        body: "The stomach combines a meal with gastric secretions and releases its contents gradually. Digestion continues beyond this chamber.",
        systems: ["digestive"],
      },
      {
        title: "Absorb the building blocks",
        query: "small intestine",
        body: "Most nutrient absorption happens in the small intestine. Its microscopic folds, villi, and microvilli create a large absorptive surface.",
        systems: ["digestive"],
      },
      {
        title: "Meet a supporting organ",
        query: "liver",
        body: "The liver produces bile for fat digestion and processes substances carried in the blood. It supports digestion without food passing through it.",
        systems: ["digestive", "cardiovascular"],
      },
      {
        title: "Two kinds of signals",
        query: "pancreas",
        body: "The pancreas sends digestive secretions through ducts and hormones into the blood. One organ can contribute to more than one body system.",
        systems: ["digestive", "endocrine"],
      },
    ],
  },
  {
    id: "movement",
    title: "Built to move",
    subtitle: "How structure and signals work together",
    steps: [
      {
        title: "Start with the control center",
        query: "brain",
        body: "Movement involves many brain regions working together. Sensory information helps guide and adjust the actions we make.",
        systems: ["nervous"],
      },
      {
        title: "Follow the connection",
        query: "spinal cord",
        body: "The spinal cord relays information between the brain and body and contributes to reflexes. This atlas contains only a small represented segment, so it cannot show the cord’s full extent. Compare its location with the vertebral column.",
        systems: ["nervous", "skeletal"],
      },
      {
        title: "A lever in the lower limb",
        query: "right femur",
        body: "The femur is the thigh bone. Bones provide support and act as levers when muscles exert force across joints.",
        systems: ["skeletal", "muscular"],
      },
      {
        title: "Force becomes movement",
        query: "long head of right biceps brachii",
        body: "Skeletal muscle contraction produces tension. Compare a muscle with its neighboring bones to see how their arrangement makes movement possible.",
        systems: ["skeletal", "muscular"],
      },
    ],
  },
  {
    id: "balance",
    title: "Keeping the balance",
    subtitle: "The organs that regulate the internal world",
    steps: [
      {
        title: "Filter and recover",
        query: "right kidney",
        body: "Kidneys remove wastes while recovering needed water and solutes. Urine is the result of selective processing, not simply everything filtered from blood.",
        systems: ["urinary", "cardiovascular"],
      },
      {
        title: "Store before release",
        query: "urinary bladder",
        body: "Ureters carry urine to the bladder for storage. The bladder and urethra then participate in controlled emptying.",
        systems: ["urinary"],
      },
      {
        title: "Chemical coordination",
        query: "right adrenal gland",
        body: "The adrenal glands produce hormones involved in metabolism, salt balance, and stress responses. Hormones travel in the blood to responsive cells.",
        systems: ["endocrine", "cardiovascular"],
      },
      {
        title: "Watch the circulating blood",
        query: "spleen",
        body: "The spleen supports immune responses and removes aged blood cells. It is one part of a wider defense network.",
        systems: ["lymphatic", "cardiovascular"],
      },
    ],
  },
];

export const QUIZ = [
  {
    question: "Which organ provides the force that keeps blood circulating?",
    options: ["Liver", "Heart", "Spleen", "Urinary bladder"],
    answer: 1,
    explanation:
      "The heart is a muscular pump that drives blood through vessels.",
    query: "heart",
    systems: ["cardiovascular"],
  },
  {
    question: "Where does oxygen pass from inhaled air into the blood?",
    options: [
      "In the tracheal cartilage",
      "Across alveoli in the lungs",
      "Inside the bladder",
      "In the stomach",
    ],
    answer: 1,
    explanation:
      "Gas exchange occurs across the thin alveolar–capillary boundary. Alveoli are too small to appear individually in this model.",
    query: "left lung",
    systems: ["respiratory"],
  },
  {
    question: "Which organ produces bile?",
    options: ["Gallbladder", "Kidney", "Liver", "Thyroid"],
    answer: 2,
    explanation:
      "The liver makes bile. The gallbladder stores and concentrates it.",
    query: "liver",
    systems: ["digestive"],
  },
  {
    question: "What is a major role of the kidneys?",
    options: [
      "Storing a meal",
      "Making the skeleton move",
      "Pumping blood",
      "Adjusting water and solutes while forming urine",
    ],
    answer: 3,
    explanation:
      "Kidneys maintain body-fluid composition while removing wastes into urine.",
    query: "right kidney",
    systems: ["urinary"],
  },
  {
    question: "Which description defines an artery?",
    options: [
      "Any vessel containing oxygen-rich blood",
      "A vessel carrying blood away from the heart",
      "A vessel carrying lymph",
      "A vessel carrying blood toward the heart",
    ],
    answer: 1,
    explanation:
      "Flow direction defines an artery. Pulmonary arteries carry oxygen-poor blood to the lungs.",
    query: "aorta",
    systems: ["cardiovascular"],
  },
  {
    question: "Which tissue is protected inside the vertebral column?",
    options: ["Spinal cord", "Pancreas", "Trachea", "Femur"],
    answer: 0,
    explanation: "The vertebral column surrounds and protects the spinal cord.",
    query: "spinal cord",
    systems: ["nervous", "skeletal"],
  },
  {
    question: "Where does most absorption of digested nutrients occur?",
    options: ["Large intestine", "Esophagus", "Small intestine", "Gallbladder"],
    answer: 2,
    explanation:
      "The small intestine is the principal site of nutrient absorption.",
    query: "small intestine",
    systems: ["digestive"],
  },
  {
    question: "What do endocrine glands release into the blood?",
    options: ["Bile", "Hormones", "Air", "Urine"],
    answer: 1,
    explanation:
      "Hormones are chemical signals that act on cells with matching receptors.",
    query: "right adrenal gland",
    systems: ["endocrine"],
  },
];
