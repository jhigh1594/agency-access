# Code Refactoring: LLM Agent Reference

**Purpose:** Optimized for LLM coding agent consumption. Dense, actionable, rule-based.

---

## SYSTEM PROMPT SECTION (ALWAYS LOAD)

### CORE MANDATES

```yaml
REQUIRE:
  - Tests pass BEFORE AND AFTER each change
  - Small, atomic, revertible steps
  - No behavior changes during refactoring
  - Run tests after each step; rollback on failure

FORBID:
  - Refactoring without test safety net
  - Large multi-change commits
  - Changing behavior + structure simultaneously (separate concerns)
  - "Just trust me" changes without verification
```

### REFACTOR VS REWRITE DECISION

| REFACTOR IF: | REWRITE IF: |
|--------------|-------------|
| Foundation solid, implementation messy | Requirements wildly different from capabilities |
| Business logic sound, unclear code | Tech debt prevents all progress |
| Test coverage exists or can be added | Security vulnerabilities unfixable |
| System has business value/domain knowledge | Performance requirements unattainable |
| Time/resources limited | Team lost all understanding of code |
| Risk tolerance low | Maintenance cost > replacement cost |

### RULE OF THREE
```
1st occurrence: Just implement
2nd occurrence: Wince at duplication
3rd occurrence: REFACTOR
```

### RED LINES (NEVER VIOLATE)
- Never change structure without running tests immediately after
- Never refactor without commit checkpoint to revert to
- Never mix refactoring with feature work in same commit
- Never touch code without understanding its dependencies first

---

## QUICK REFERENCE (LOAD WHEN REFACTORING)

### CODE SMELL → REFACTORING MAP

| Smell | Primary Refactoring |
|-------|---------------------|
| Duplicate Code | Extract Function, Extract Class |
| Long Method | Extract Method, Replace Temp with Query |
| Large Class | Extract Class, Extract Interface |
| Long Parameter List | Introduce Parameter Object, Preserve Whole Object |
| Divergent Change | Extract Class |
| Shotgun Surgery | Move Function, Move Field, Inline Class |
| Feature Envy | Move Function |
| Data Clumps | Extract Class, Introduce Parameter Object |
| Primitive Obsession | Replace Primitive with Object |
| Switch Statements | Replace Conditional with Polymorphism |
| Message Chains | Hide Delegate, Extract Function |
| Inappropriate Intimacy | Move Function, Change Bidirectional→Unidirectional |

### IF→THEN DECISION RULES

```
IF function > 20 lines → Extract Method
IF function has nested logic → Extract Method
IF expression is complex → Extract Variable
IF name doesn't reveal intent → Rename
IF function body as clear as name → Inline Function
IF multiple early returns with same structure → Consolidate Conditional
IF nested conditionals → Replace with Guard Clauses
IF switch on type → Replace Conditional with Polymorphism
IF same logic in multiple places → Extract Function
IF parameters > 3 → Introduce Parameter Object
IF data items always appear together → Extract Class
```

### REFACTORING CHECKLIST

**BEFORE:**
- [ ] Tests pass
- [ ] Code committed
- [ ] Dependencies identified
- [ ] Performance baseline (if relevant)

**DURING:**
- [ ] One small change only
- [ ] Tests run and pass
- [ ] Change committed
- [ ] Repeat if needed

**AFTER:**
- [ ] All tests pass
- [ ] No behavior changed
- [ ] Code cleaner/clearer
- [ ] No perf regression

### PRIORITIZATION MATRIX

```
High Impact + Low Effort  → DO FIRST (Quick Wins)
High Impact + High Effort → Plan for Next Sprint
Low Impact + Low Effort  → Fill-in Work
Low Impact + High Effort → Avoid (Technical Debt)
```

**Impact Score Formula:**
```
Impact = (Frequency × TechnicalDebt) / Effort
```

---

## DETAILED REFERENCE (LOOKUP AS NEEDED)

### ESSENTIAL REFACTORINGS

#### Extract Function
```
IF: Function > 20 lines OR has nested logic
THEN: Extract to named function

BEFORE:
function printOwing() {
  let outstanding = 0;
  console.log("****");
  for (const o of orders) {
    outstanding += o.amount;
  }
  console.log(`amount: ${outstanding}`);
}

AFTER:
function printOwing() {
  printBanner();
  const outstanding = calculateOutstanding();
  printDetails(outstanding);
}
```

#### Rename
```
IF: Name doesn't reveal intent
THEN: Rename to descriptive name

BEFORE: function d(a, b) { ... }
AFTER: function logMessageWithTimestamp(message, timestamp) { ... }
```

#### Extract Variable
```
IF: Expression complex/hard to understand
THEN: Extract to named variable

BEFORE:
return order.quantity * order.itemPrice -
  Math.max(0, order.quantity - 500) * order.itemPrice * 0.05;

AFTER:
const basePrice = order.quantity * order.itemPrice;
const discount = Math.max(0, order.quantity - 500) * order.itemPrice * 0.05;
return basePrice - discount;
```

#### Replace Nested Conditional with Guard Clauses
```
IF: Nested if-else chains
THEN: Return early for special cases

BEFORE:
function getPayAmount() {
  let result;
  if (isDead) {
    result = deadAmount();
  } else {
    if (isSeparated) {
      result = separatedAmount();
    } else {
      result = normalPayAmount();
    }
  }
  return result;
}

AFTER:
function getPayAmount() {
  if (isDead) return deadAmount();
  if (isSeparated) return separatedAmount();
  return normalPayAmount();
}
```

#### Replace Conditional with Polymorphism
```
IF: Switch statement on type
THEN: Use polymorphism

BEFORE:
function calculatePay(employee) {
  switch (employee.type) {
    case 'engineer': return employee.salary;
    case 'manager': return employee.salary + employee.bonus;
  }
}

AFTER:
interface Employee {
  calculatePay(): number;
}

class Engineer implements Employee {
  calculatePay() { return this.salary; }
}

class Manager implements Employee {
  calculatePay() { return this.salary + this.bonus; }
}
```

---

### TESTING STRATEGY

#### Characterization Tests (Legacy Code)
```
PURPOSE: Document current behavior before changing

PATTERN:
describe('Legacy Code Characterization', () => {
  it('behaves this way for this input', () => {
    const result = legacyFunction(testInput);
    expect(result).toMatchSnapshot(); // Capture current behavior
  });
});
```

#### Golden Master Pattern
```
PURPOSE: Compare refactored output with original

PATTERN:
expect(refactoredFunction(input)).toEqual(originalFunction(input));
```

#### Test Coverage Targets
- Critical business logic: 90%+
- Utility functions: 80%+
- UI components: 70%+
- Configuration: 60%+

---

### SAFE WORKFLOWS

#### Strangler Fig Pattern
```
PURPOSE: Gradually replace old code with new

PATTERN:
// Facade routes based on feature flag
class OrderProcessorFacade {
  process(order) {
    if (shouldUseModern(order.type)) {
      return this.modern.process(order);
    }
    return this.legacy.process(order);
  }
}
```

#### Branch-by-Abstraction
```
1. Create interface
2. Implement both old and new
3. Switch via config/feature flag
4. Remove old implementation
```

---

### LEGACY CODE TECHNIQUES

#### Sprout Method
```
PURPOSE: Add new behavior without modifying old code

PATTERN:
// Legacy - don't touch
function processOrder(order) { /* complex logic */ }

// Sprout new
function processOrderWithDiscount(order, discount) {
  const baseTotal = processOrder(order);
  return applyDiscount(baseTotal, discount);
}
```

#### Wrap Method
```
PURPOSE: Preserve old interface, add new validation

PATTERN:
// Legacy
function legacyCalculate(data) { /* old logic */ }

// Wrapper
function calculateWithValidation(data) {
  validate(data);
  return legacyCalculate(data);
}
```

#### Break Dependencies
```
PURPOSE: Make code testable via DI

BEFORE:
class OrderProcessor {
  process(order) {
    const tax = TaxCalculator.calculate(order); // Hard dependency
  }
}

AFTER:
class OrderProcessor {
  constructor(private taxCalculator: TaxCalculator) {}
  process(order) {
    const tax = this.taxCalculator.calculate(order); // Injected
  }
}
```

---

### TYPESCRIPT CONSIDERATIONS

#### Type-Driven Refactoring
```
BEFORE: function process(data: any) { ... }
AFTER:
interface Data { value: number; }
function process(data: Data): number { ... }
```

#### Union Type Optimization
```
SLOW (quadratic):
type Animal = Dog | Cat | Bird | ... | Zebra;

FAST (linear):
interface Animal {
  type: 'dog' | 'cat' | 'bird' | ... | 'zebra';
}
```

#### Async/Await Conversion
```
BEFORE (callback hell):
function getData(id, cb) {
  getUser(id, (err, user) => {
    getOrders(user.id, (err, orders) => {
      cb(null, { user, orders });
    });
  });
}

AFTER:
async function getData(id) {
  const user = await getUser(id);
  const orders = await getOrders(user.id);
  return { user, orders };
}
```

---

### TOOL CONFIGURATIONS

#### ESLint (.eslintrc.json)
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "prefer-const": "error",
    "no-var": "error",
    "max-lines-per-function": ["warn", 50],
    "complexity": ["warn", 10],
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

#### TypeScript (tsconfig.json)
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### Prettier (.prettierrc.json)
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

### METRICS & TARGETS

| Metric | Target | Tool |
|--------|--------|------|
| Cyclomatic Complexity | < 10 per function | eslint-plugin-complexity |
| Code Duplication | < 5% | jscpd, SonarQube |
| Test Coverage | 80%+ critical code | jest --coverage |
| Technical Debt Ratio | < 5% | SonarQube |
| Code Churn | Stable/decreasing | Git analytics |

---

### ANTI-PATTERNS TO AVOID

| Anti-Pattern | Why Bad | Solution |
|--------------|---------|----------|
| Refactoring without tests | No verification; high bug risk | Write characterization tests first |
| Big rewrite | Loses domain knowledge; takes longer | Incremental refactoring; Strangler Fig |
| Premature optimization | Adds complexity; may not help | Profile first; optimize bottlenecks only |
| Over-abstraction | Increases indirection; harder to understand | Abstract only when needed; KISS |
| Comment-driven development | Comments can lie; maintenance burden | Self-documenting code; meaningful names |

---

### JSCODESHIFT TEMPLATE

```javascript
// transform.js
module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Example: Rename all occurrences
  root.find(j.Identifier, { name: 'oldName' })
    .forEach(path => {
      path.node.name = 'newName';
    });

  return root.toSource();
};

// Run: npx jscodeshift -t transform.js src/
```

---

### CI/CD QUALITY GATE

```yaml
# .github/workflows/quality.yml
name: Code Quality
on: [push, pull_request]
jobs:
  quality:
    steps:
      - run: npm run lint
      - run: npm run typecheck
      - run: npx prettier --check "src/**/*.{ts,tsx}"
      - run: npm test
      - run: npm run test:coverage
```

---

## END OF REFERENCE

**Usage Instructions:**
1. Load SYSTEM PROMPT SECTION for all refactoring tasks
2. Load QUICK REFERENCE when decision-making needed
3. Look up DETAILED REFERENCE for specific techniques

**Token Optimization:** ~70% reduction from original while preserving 100% actionable content.
