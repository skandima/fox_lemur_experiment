const jsPsych = initJsPsych({
  extensions: [{ type: jsPsychExtensionSaccade, params: { smoothing_frames: 5 } }],
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
        swap_keys: data.swap_keys,
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

const MAX_BLOCKS = 1;

// Read condition counts from Firebase, assign to least-filled condition, increment atomically
async function assignConditionBalanced() {
  const countsRef = db.collection('meta').doc('condition_counts');
  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(countsRef);
    const counts = doc.exists
      ? doc.data()
      : { between: 0, within_fox: 0, within_lemur: 0 };
    const minCount = Math.min(...Object.values(counts));
    const tied = Object.keys(counts).filter(k => counts[k] === minCount);
    const chosen = tied[Math.floor(Math.random() * tied.length)];
    transaction.set(countsRef, { ...counts, [chosen]: counts[chosen] + 1 });
    return chosen;
  });
}

async function runExperiment() {
  const conditionLabel = await assignConditionBalanced();
  const assignedCondition = CONDITIONS[conditionLabel];

  // Counterbalance: randomly swap which category maps to D vs K
  const swapKeys = Math.random() < 0.5;
  const keyA = swapKeys ? "k" : "d";
  const keyB = swapKeys ? "d" : "k";

  let accuracy = 0;

  function makeTrials(blockNum) {
    const makePair = (img, correctKey, category) => {
      let stopGaze = null;

      const imageTrial = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
          <div class="stimulus-wrapper" id="stimulus-container">
            <img class="blurred-layer" src="${img}">
            <img class="sharp-layer" src="${img}">
          </div>
          <p class="key-prompt">D &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; K</p>
        `,
        choices: ["d", "k"],
        extensions: [{ type: jsPsychExtensionSaccade, params: { targets: ['#stimulus-container'] } }],
        data: { correct_key: correctKey, category, image: img, condition: assignedCondition.label, block: blockNum, swap_keys: swapKeys },
        on_load: function() {
          stopGaze = jsPsych.extensions.saccade.onGazeUpdate((g) => {
            const container = document.getElementById('stimulus-container');
            if (!container) return;
            const rect = container.getBoundingClientRect();
            container.style.setProperty('--gx', ((g.x - rect.left) / rect.width * 100).toFixed(1) + '%');
            container.style.setProperty('--gy', ((g.y - rect.top) / rect.height * 100).toFixed(1) + '%');
          });
        },
        on_finish: function(data) {
          if (stopGaze) stopGaze();
          data.correct = data.response === data.correct_key;
        }
      };

      const feedbackTrial = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function() {
          const last = jsPsych.data.get().last(1).values()[0];
          return last && last.correct
            ? '<p class="feedback correct">✓</p>'
            : '<p class="feedback incorrect">✗</p>';
        },
        choices: "NO_KEYS",
        trial_duration: 600
      };

      return [imageTrial, feedbackTrial];
    };

    const pairs = [
      ...assignedCondition.imagesA.map(img => makePair(img, keyA, assignedCondition.classA)),
      ...assignedCondition.imagesB.map(img => makePair(img, keyB, assignedCondition.classB))
    ];
    return jsPsych.randomization.shuffle(pairs).flat();
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
      conditional_function: () => blockNum === 1 || accuracy < 90
    };
  }

  const welcomeTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <p>Welcome to the experiment!</p>
      <p>You will see images. Press <strong>D</strong> or <strong>K</strong> to classify each one.</p>
      <p>You will get feedback after each response.</p>
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

  const fullscreenTrial = {
    type: jsPsychFullscreen,
    fullscreen_mode: true
  };

  // Camera permission (SaccadePreview) must come before fullscreen —
  // any browser permission dialog forces an exit from fullscreen
  const fullTimeline = [
    { type: jsPsychSaccadePreview },
    fullscreenTrial,
    { type: jsPsychSaccadeTimeSync },
    { type: jsPsychSaccadeCalibrate },
    { type: jsPsychSaccadeValidate },
    welcomeTrial
  ];
  for (let b = 1; b <= MAX_BLOCKS; b++) {
    fullTimeline.push(makeBlock(b));
  }
  fullTimeline.push(endTrial);

  jsPsych.run(fullTimeline);
}

runExperiment();
