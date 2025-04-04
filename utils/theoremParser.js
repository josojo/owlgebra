const parseTheorem = (leanCode) => {
  // Split the code into lines and clean them
  const lines = leanCode.split('\n').map(line => line.trim());
  
  // Find theorem line and subsequent lines until we hit a goal marker (:)
  const theoremStartIndex = lines.findIndex(line => line.startsWith('theorem'));
  if (theoremStartIndex === -1) throw new Error('No theorem declaration found');

  // Get code before theorem
  const env0code = lines.slice(0, theoremStartIndex).join('\n').trim();

  // Combine all lines from theorem start until the end into a single string
  const theoremText = lines.slice(theoremStartIndex).join(' ');

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
        hypotheses.push(currentHypothesis.trim());
        currentHypothesis = '';
      }
    } else if (parenCount > 0) {
      currentHypothesis += char;
    }
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

  // Throw an error if the proof start symbol ':=' is not found at the top level
  if (proofStartIndex === -1) {
    throw new Error('Invalid theorem format: missing proof start (:=) at the correct bracket level');
  }

  // Extract the goal by taking the substring before the identified ':=' and trimming whitespace
  let goal = goalSection.substring(0, proofStartIndex).trim();

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