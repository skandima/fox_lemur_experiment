const jsPsych = initJsPsych({
  extensions: [{ type: jsPsychExtensionSaccade }],
  on_data_update: function(data) {
    if (data.image && window.saveToFirebase) {
      window.saveToFirebase({
        image: data.image,
        category: data.category,
        condition: data.condition,
        response: data.response,
        correct: data.correct,
        rt: data.rt,
        block: data.block,
        gaze: data.saccade_data || [],
        stimulus_rect: (data.saccade_targets && data.saccade_targets['#stimulus-container']) || null,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Condition images
const CONDITIONS = {
  between: {
    label: "between",
    classA: "fox",
    classB: "lemur",
    imagesA: [
      "images/caricatures/fox_images/fennec/fennec_01.jpg",
      "images/caricatures/fox_images/fennec/fennec_04.jpg",
      "images/caricatures/fox_images/fennec/fennec_07.jpg",
      "images/caricatures/fox_images/fennec/fennec_09.jpg",
      "images/caricatures/fox_images/fennec/fennec_11.jpg",
      "images/caricatures/fox_images/fennec/fennec_13.jpg",
      "images/caricatures/fox_images/fennec/fennec_15.jpg",
      "images/caricatures/fox_images/fennec/fennec_16.jpeg",
    ],
    imagesB: [
      "images/caricatures/lemur_images/ring_tailed/ringtailed_01.webp",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_02.jpg",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_04.jpg",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_06.jpg",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_09.jpg",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_11.jpg",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_14.jpg",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_15.jpg",
    ],
    keyA: "f",
    keyB: "l",
    prompt: "<p>Fox = F &nbsp;&nbsp; Lemur = L</p>"
  },
  within_fox: {
    label: "within_fox",
    classA: "fennec",
    classB: "gray_fox",
    imagesA: [
      "images/caricatures/fox_images/fennec/fennec_01.jpg",
      "images/caricatures/fox_images/fennec/fennec_04.jpg",
      "images/caricatures/fox_images/fennec/fennec_07.jpg",
      "images/caricatures/fox_images/fennec/fennec_09.jpg",
      "images/caricatures/fox_images/fennec/fennec_11.jpg",
      "images/caricatures/fox_images/fennec/fennec_13.jpg",
      "images/caricatures/fox_images/fennec/fennec_15.jpg",
      "images/caricatures/fox_images/fennec/fennec_16.jpeg",
    ],
    imagesB: [
      "images/caricatures/fox_images/gray/gray_01.jpg",
      "images/caricatures/fox_images/gray/gray_04.jpg",
      "images/caricatures/fox_images/gray/gray_06.jpg",
      "images/caricatures/fox_images/gray/gray_07.jpg",
      "images/caricatures/fox_images/gray/gray_09.jpg",
      "images/caricatures/fox_images/gray/gray_11.jpg",
      "images/caricatures/fox_images/gray/gray_13.jpg",
      "images/caricatures/fox_images/gray/gray_16.jpg",
    ],
    keyA: "f",
    keyB: "l",
    prompt: "<p>Fennec Fox = F &nbsp;&nbsp; Gray Fox = L</p>"
  },
  within_lemur: {
    label: "within_lemur",
    classA: "ring_tailed",
    classB: "ruffed",
    imagesA: [
      "images/caricatures/lemur_images/ring_tailed/ringtailed_01.webp",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_02.jpg",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_04.jpg",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_06.jpg",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_09.jpg",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_11.jpg",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_14.jpg",
      "images/caricatures/lemur_images/ring_tailed/ringtailed_15.jpg",
    ],
    imagesB: [
      "images/caricatures/lemur_images/ruffed/ruffed_01.jpg",
      "images/caricatures/lemur_images/ruffed/ruffed_02.jpg",
      "images/caricatures/lemur_images/ruffed/ruffed_04.jpg",
      "images/caricatures/lemur_images/ruffed/ruffed_05.jpg",
      "images/caricatures/lemur_images/ruffed/ruffed_07.jpeg",
      "images/caricatures/lemur_images/ruffed/ruffed_09.jpg",
      "images/caricatures/lemur_images/ruffed/ruffed_11.jpg",
      "images/caricatures/lemur_images/ruffed/ruffed_15.jpg",
    ],
    keyA: "f",
    keyB: "l",
    prompt: "<p>Ring-tailed Lemur = F &nbsp;&nbsp; Ruffed Lemur = L</p>"
  }
};

const conditionKeys = Object.keys(CONDITIONS);
const assignedCondition = CONDITIONS[conditionKeys[Math.floor(Math.random() * conditionKeys.length)]];

const MAX_BLOCKS = 1;
let accuracy = 0;

function handleMouseMove(e) {
  const container = document.getElementById('stimulus-container');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  container.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
  container.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
}

function makeTrials(blockNum) {
  const makeTrial = (img, correctKey, category) => ({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="bubble-occluded" id="stimulus-container">
        <img src="${img}" style="width:400px;height:auto">
      </div>
      ${assignedCondition.prompt}
    `,
    choices: ["f", "l"],
    extensions: [{ type: jsPsychExtensionSaccade, params: { targets: ['#stimulus-container'] } }],
    data: { correct_key: correctKey, category, image: img, condition: assignedCondition.label, block: blockNum },
    on_load: () => document.addEventListener('mousemove', handleMouseMove),
    on_finish: function(data) {
      document.removeEventListener('mousemove', handleMouseMove);
      data.correct = data.response === data.correct_key;
    }
  });

  const trials = [
    ...assignedCondition.imagesA.map(img => makeTrial(img, assignedCondition.keyA, assignedCondition.classA)),
    ...assignedCondition.imagesB.map(img => makeTrial(img, assignedCondition.keyB, assignedCondition.classB))
  ];
  return jsPsych.randomization.shuffle(trials);
}

function makeBlock(blockNum) {
  const blockStart = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<p>Block ${blockNum} of ${MAX_BLOCKS}</p><p>Press any key to start.</p>`,
    choices: "ALL_KEYS"
  };

  const blockEnd = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
      const allData = jsPsych.data.get().values();
      const blockData = allData.filter(d => d.block === blockNum && d.correct !== undefined);
      const correct = blockData.filter(d => d.correct).length;
      accuracy = blockData.length > 0 ? Math.round((correct / blockData.length) * 100) : 0;
      const done = accuracy >= 90 || blockNum >= MAX_BLOCKS;
      return done
        ? `<p>Block ${blockNum} complete! Accuracy: ${accuracy}%</p><p>Press any key to finish.</p>`
        : `<p>Block ${blockNum} complete! Accuracy: ${accuracy}%</p><p>Press any key for the next block.</p>`;
    },
    choices: "ALL_KEYS"
  };

  return {
    timeline: [blockStart, ...makeTrials(blockNum), blockEnd],
    // block 1 always runs; subsequent blocks only run if criterion not yet met
    conditional_function: () => blockNum === 1 || accuracy < 90
  };
}

const calibrationProcedure = [
  { type: jsPsychSaccadePreview },
  { type: jsPsychSaccadeTimeSync },
  { type: jsPsychSaccadeCalibrate },
  { type: jsPsychSaccadeValidate }
];

const welcomeTrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>Welcome to the experiment!</p>
    <p>You will see images and need to identify which category they belong to.</p>
    ${assignedCondition.prompt}
    <p>Press any key to begin.</p>
  `,
  choices: "ALL_KEYS"
};

const endTrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>You have completed the experiment. Thank you!</p>
    <p>Your data has been saved.</p>
  `,
  choices: "NO_KEYS"
};

const fullTimeline = [...calibrationProcedure, welcomeTrial];
for (let b = 1; b <= MAX_BLOCKS; b++) {
  fullTimeline.push(makeBlock(b));
}
fullTimeline.push(endTrial);

jsPsych.run(fullTimeline);
