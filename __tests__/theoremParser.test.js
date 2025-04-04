const { parseTheorem } = require('../utils/theoremParser');

describe('Theorem Parser', () => {
  test('parses single-line theorem correctly', () => {
    const input = 'theorem simple (n : ℕ) (h : n > 0) : n + 1 > 0 := by';
    const result = parseTheorem(input);
    
    expect(result).toEqual({
      theoremTitle: 'simple',
      env0code: '',
      hypotheses: ['(n : ℕ)', '(h : n > 0)'],
      goal: 'n + 1 > 0'
    });
  });

  test('parses multi-line theorem correctly', () => {
    const input = `theorem my_theorem 
  (n : ℕ) 
  (h1 : n > 0)
  (h2 : prime n) : 
  n + 1 > 1 := by`;
    
    const result = parseTheorem(input);
    
    expect(result).toEqual({
      theoremTitle: 'my_theorem',
      env0code: '',
      hypotheses: ['(n : ℕ)', '(h1 : n > 0)', '(h2 : prime n)'],
      goal: 'n + 1 > 1'
    });
  });

  test('parses theorem with preceding code correctly', () => {
    const input = `import Mathlib
    
theorem with_imports (n : ℕ) : n = n := by`;
    
    const result = parseTheorem(input);
    
    expect(result).toEqual({
      theoremTitle: 'with_imports',
      env0code: 'import Mathlib',
      hypotheses: ['(n : ℕ)'],
      goal: 'n = n'
    });
  });

  test('handles theorems without hypotheses', () => {
    const input = 'theorem no_hypotheses : 1 + 1 = 2 := by';
    
    const result = parseTheorem(input);
    
    expect(result).toEqual({
      theoremTitle: 'no_hypotheses',
      env0code: '',
      hypotheses: [],
      goal: '1 + 1 = 2'
    });
  });

  test('throws error for invalid theorem format', () => {
    const input = 'not a theorem at all';
    
    expect(() => {
      parseTheorem(input);
    }).toThrow('No theorem declaration found');
  });

  test('handles complex goals with parentheses', () => {
    const input = 'theorem complex (n : ℕ) : (n + 1) * (n - 1) = n^2 - 1 := by';
    
    const result = parseTheorem(input);
    
    expect(result).toEqual({
      theoremTitle: 'complex',
      env0code: '',
      hypotheses: ['(n : ℕ)'],
      goal: '(n + 1) * (n - 1) = n^2 - 1'
    });
  });

  test('handles complex theorem with gcd example', () => {
    const input = `import Mathlib

theorem example_theorem (n : ℕ) (oh0 : 0 < n) : Nat.gcd (21*n + 4) (14*n + 3) = 1 := by`;
    
    const result = parseTheorem(input);
    
    expect(result).toEqual({
      theoremTitle: 'example_theorem',
      env0code: 'import Mathlib',
      hypotheses: ['(n : ℕ)', '(oh0 : 0 < n)'],
      goal: 'Nat.gcd (21*n + 4) (14*n + 3) = 1'
    });
  });
  test('handles complex theorem with sorry example', () => {
    const input = `import Mathlib



theorem example_theorem (n : ℕ) (oh0 : 0 < n) : Nat.gcd (21*n + 4) (14*n + 3) = 1 := by sorry`;
    
    const result = parseTheorem(input);
    
    expect(result).toEqual({
      theoremTitle: 'example_theorem',
      env0code: 'import Mathlib',
      hypotheses: ['(n : ℕ)', '(oh0 : 0 < n)'],
      goal: 'Nat.gcd (21*n + 4) (14*n + 3) = 1'
    });
  });
  test('handles complex theorem with := example', () => {
    const input = `import Mathlib

    

theorem example_theorem (n : ℕ) (oh0 : 0 < n) : Nat.gcd (21*n + 4) (14*n + 3 := 4) = 1 := by sorry`;
    
    const result = parseTheorem(input);
    
    expect(result).toEqual({
      theoremTitle: 'example_theorem',
      env0code: 'import Mathlib',
      hypotheses: ['(n : ℕ)', '(oh0 : 0 < n)'],
      goal: 'Nat.gcd (21*n + 4) (14*n + 3 := 4) = 1'
    });
  });
}); 