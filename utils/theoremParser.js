const parseTheorem = (leanCode) => {
  // Split the code into lines WITHOUT trimming them initially
  const lines = leanCode.split('\n');
  
  // Find theorem line index
  // Note: We still trim here just for the check, but use the original lines later
  const theoremStartIndex = lines.findIndex(line => line.trim().startsWith('theorem'));
  if (theoremStartIndex === -1) throw new Error('No theorem declaration found');

  // Get code before theorem, joining the original lines WITHOUT trimming the final result
  const env0code = lines.slice(0, theoremStartIndex).join('\n');

  // Combine all lines from theorem start onwards for further parsing
  // We still trim individual lines here as whitespace within the theorem declaration
  // itself is less likely to be significant for parsing name, hypotheses, goal.
  const theoremText = lines.slice(theoremStartIndex).map(line => line.trim()).join(' ');

  // Parse theorem name
  const theoremMatch = theoremText.match(/theorem\s+(\w+)/);
  const theoremTitle = theoremMatch ? theoremMatch[1] : '';

  // Find the position of the first : that's not inside parentheses
  let colonIndex = -1;
  let parenCount = 0;
  for (let i = 0; i < theoremText.length; i++) {
    if (theoremText[i] === '(') parenCount++;
    if (theoremText[i] === ')') parenCount--;
    if (theoremText[i] === ':' && parenCount === 0) {
      colonIndex = i;
      break;
    }
  }

  if (colonIndex === -1) throw new Error('Invalid theorem format: missing goal');

  // Get the hypotheses section (everything between theorem name and :)
  const hypothesesSection = theoremText
    .substring(theoremMatch[0].length, colonIndex)
    .trim();

  // Parse hypotheses
  const hypotheses = [];
  let currentHypothesis = '';
  parenCount = 0;

  for (let i = 0; i < hypothesesSection.length; i++) {
    const char = hypothesesSection[i];
    if (char === '(') {
      parenCount++;
      currentHypothesis += char;
    } else if (char === ')') {
      parenCount--;
      currentHypothesis += char;
      if (parenCount === 0 && currentHypothesis.trim()) {
        // Trim individual hypothesis before pushing
        hypotheses.push(currentHypothesis.trim());
        currentHypothesis = '';
      }
    } else if (parenCount > 0 || (parenCount === 0 && char !== ' ' && currentHypothesis === '')) {
       // Capture characters within parentheses OR the start of a hypothesis outside parentheses
       currentHypothesis += char;
    } else if (parenCount === 0 && currentHypothesis !== '' && char === ' ') {
      // If outside parentheses and we have content, check if it's just whitespace between hypotheses
      // If the next non-whitespace is '(', assume it's the start of the next hypothesis
      let nextCharIndex = i + 1;
      while(nextCharIndex < hypothesesSection.length && hypothesesSection[nextCharIndex] === ' ') {
        nextCharIndex++;
      }
      if (nextCharIndex < hypothesesSection.length && hypothesesSection[nextCharIndex] === '(') {
         // End of current hypothesis found
         hypotheses.push(currentHypothesis.trim());
         currentHypothesis = '';
         i = nextCharIndex - 1; // Adjust loop index to start next hypothesis correctly
      } else {
         currentHypothesis += char; // Continue current hypothesis
      }
    } else if (parenCount === 0 && currentHypothesis !== '') {
       // Continue capturing hypothesis content outside parentheses
       currentHypothesis += char;
    }
  }
  // Add any remaining hypothesis part if loop finishes
  if (currentHypothesis.trim()) {
     hypotheses.push(currentHypothesis.trim());
  }

  // Get goal - everything after the colon but before the correct :=
  const goalSection = theoremText.substring(colonIndex + 1);
  let proofStartIndex = -1;
  let bracketLevel = 0;
  const openBrackets = ['(', '{', '['];
  const closeBrackets = [')', '}', ']'];

  for (let i = 0; i < goalSection.length - 1; i++) { // Check up to second-to-last char for ':='
    const char = goalSection[i];
    const nextChar = goalSection[i + 1];

    if (openBrackets.includes(char)) {
      bracketLevel++;
    } else if (closeBrackets.includes(char)) {
      bracketLevel = Math.max(0, bracketLevel - 1); // Prevent going below 0
    }

    // Check for ':=' only when outside any brackets opened in this section
    if (char === ':' && nextChar === '=' && bracketLevel === 0) {
      proofStartIndex = i;
      break;
    }
  }

  let goal = "";
  // Throw an error if the proof start symbol ':=' is not found at the top level
  if (proofStartIndex === -1) {
    goal = goalSection.trim();
    // Consider if an error should be thrown if ':=' is expected but missing
    // throw new Error('Invalid theorem format: missing proof start (:=) at the correct bracket level');
  } else {
    // Extract the goal by taking the substring before the identified ':=' and trimming whitespace
    goal = goalSection.substring(0, proofStartIndex).trim();
  }

  return {
    theoremTitle,
    env0code,
    hypotheses,
    goal
  };
};

module.exports = {
  parseTheorem
}; 