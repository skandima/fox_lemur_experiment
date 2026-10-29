const jsPsych = initJsPsych();

const foxImages = [
  "images/caricatures/fox_images/fennec/fennec_01.jpg",
  "images/caricatures/fox_images/fennec/fennec_04.jpg",
  "images/caricatures/fox_images/fennec/fennec_07.jpg",
  "images/caricatures/fox_images/fennec/fennec_09.jpg",
  "images/caricatures/fox_images/fennec/fennec_11.jpg",
  "images/caricatures/fox_images/fennec/fennec_13.jpg",
  "images/caricatures/fox_images/fennec/fennec_15.jpg",
  "images/caricatures/fox_images/fennec/fennec_16.jpeg",
];

const lemurImages = [
  "images/caricatures/lemur_images/ring_tailed/ringtailed_01.webp",
  "images/caricatures/lemur_images/ring_tailed/ringtailed_02.jpg",
  "images/caricatures/lemur_images/ring_tailed/ringtailed_04.jpg",
  "images/caricatures/lemur_images/ring_tailed/ringtailed_06.jpg",
  "images/caricatures/lemur_images/ring_tailed/ringtailed_09.jpg",
  "images/caricatures/lemur_images/ring_tailed/ringtailed_11.jpg",
  "images/caricatures/lemur_images/ring_tailed/ringtailed_14.jpg",
  "images/caricatures/lemur_images/ring_tailed/ringtailed_15.jpg",
];

const MAX_BLOCKS = 10;
let currentBlock = 0;
let accuracy = 0;

function makeTrials() {
  let trials = [];
  foxImages.forEach(img => {
    trials.push({
      type: jsPsychImageKeyboardResponse,
      stimulus: img,
      choices: ["f", "l"],
      prompt: "<p>Fox = F &nbsp;&nbsp; Lemur = L</p>",
      stimulus_width: 400,
      maintain_aspect_ratio: true,
      data: { correct_key: "f", category: "fox", image: img },
      on_finish: function(data) {
        data.correct = data.response === data.correct_key;
        if (window.saveToFirebase) {
          window.saveToFirebase({
            image: data.image,
            category: data.category,
            response: data.response,
            correct: data.correct,
            rt: data.rt,
            block: currentBlock,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  });
  lemurImages.forEach(img => {
    trials.push({
      type: jsPsychImageKeyboardResponse,
      stimulus: img,
      choices: ["f", "l"],
      prompt: "<p>Fox = F &nbsp;&nbsp; Lemur = L</p>",
      stimulus_width: 400,
      maintain_aspect_ratio: true,
      data: { correct_key: "l", category: "lemur", image: img },
      on_finish: function(data) {
        data.correct = data.response === data.correct_key;
        if (window.saveToFirebase) {
          window.saveToFirebase({
            image: data.image,
            category: data.category,
            response: data.response,
            correct: data.correct,
            rt: data.rt,
            block: currentBlock,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  });
  return jsPsych.randomization.shuffle(trials);
}

function runBlock() {
  currentBlock++;
  const trials = makeTrials();

  const blockStart = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<p>Block ${currentBlock}</p><p>Press any key to start.</p>`,
    choices: "ALL_KEYS"
  };

  const blockEnd = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
      const data = jsPsych.data.get().filter({ block: currentBlock }).values();
      const correct = data.filter(d => d.correct).length;
      accuracy = data.length > 0 ? Math.round((correct / data.length) * 100) : 0;
      if (accuracy >= 90 || currentBlock >= MAX_BLOCKS) {
        return `<p>Block complete! Accuracy: ${accuracy}%</p><p>Press any key to finish.</p>`;
      }
      return `<p>Block complete! Accuracy: ${accuracy}%</p><p>Press any key for the next block.</p>`;
    },
    choices: "ALL_KEYS",
    on_finish: function() {
      if (accuracy < 90 && currentBlock < MAX_BLOCKS) {
        runBlock();
      }
    }
  };

  jsPsych.run([blockStart, ...trials, blockEnd]);
}

const welcomeTrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>Welcome to the experiment!</p>
    <p>You will see images of foxes or lemurs.</p>
    <p>Press <strong>F</strong> for fox, <strong>L</strong> for lemur.</p>
    <p>Press any key to begin.</p>
  `,
  choices: "ALL_KEYS",
  on_finish: function() {
    runBlock();
  }
};

jsPsych.run([welcomeTrial]);