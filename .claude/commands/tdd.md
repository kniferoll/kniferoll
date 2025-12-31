# TDD Feature Implementation

Implement feature using test-driven development: $ARGUMENTS

## Phase 1: Understand

1. **Parse the requirement**

   - What is the user-facing behavior?
   - What are the inputs and expected outputs?
   - What are the edge cases?

2. **Explore relevant code**

   - Read related files (don't write code yet)
   - Identify where changes will be needed
   - Note existing patterns to follow

3. **Create a plan**
   Think hard about the implementation:
   - What components/hooks/stores need changes?
   - What new files are needed?
   - What's the data flow?
   - What could go wrong?

## Phase 2: Write Tests First

4. **Create a new branch**

   ```bash
   git checkout -b feature/descriptive-name
   ```

5. **Write failing tests**

   - Start with the happy path
   - Add edge cases: empty state, loading, errors
   - Add boundary conditions
   - Do NOT write implementation code yet
   - Do NOT create mocks that simulate the implementation

   ```typescript
   // Example structure
   describe("FeatureName", () => {
     it("does the main thing", () => {
       // Test expected behavior
     });

     it("handles empty state", () => {});
     it("handles loading state", () => {});
     it("handles error state", () => {});
     it("validates input", () => {});
   });
   ```

6. **Run tests - confirm they fail**

   ```bash
   pnpm test path/to/test
   ```

   All new tests should fail. If any pass, the test may not be testing what you think.

7. **Commit the tests**
   ```bash
   git add -A
   git commit -m "test: add tests for [feature]"
   ```

## Phase 3: Implement

8. **Write minimal code to pass first test**

   - Implement just enough to make one test pass
   - Do NOT modify the tests
   - Run tests after each change

9. **Iterate until all tests pass**

   ```bash
   pnpm test path/to/test
   ```

   Keep implementing until green. If stuck after 3 attempts, reconsider the approach.

10. **Verify implementation isn't overfitting**

    - Review: does the code handle cases beyond just the tests?
    - Add any missing edge case tests discovered during implementation

11. **Run full verification**
    ```bash
    pnpm lint
    pnpm build
    pnpm test
    pnpm test:perf  # if UI changes
    ```

## Phase 4: Commit and PR

12. **Commit the implementation**

    ```bash
    git add -A
    git commit -m "feat: [description of feature]"
    ```

13. **Create PR**

    ```bash
    git push -u origin HEAD
    gh pr create --title "feat: [feature name]" --body "## What
    [Brief description]

    ## Why
    [Motivation]

    ## How
    [Implementation approach]

    ## Testing
    - [ ] Unit tests added
    - [ ] Manual testing done
    - [ ] Edge cases covered

    ## Screenshots (if UI)
    [Add if applicable]"
    ```

## Rules

- Tests come FIRST, always
- Never modify tests to make them pass (fix the implementation)
- If tests are wrong, commit implementation first, then fix tests in separate commit
- Keep commits atomic: tests separate from implementation
