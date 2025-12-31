# Increase Test Coverage

Increase test coverage by 10% toward our goal of 90%.

## Steps

1. **Check current coverage**

   ```bash
   pnpm test --coverage
   ```

   Note the current coverage percentage and identify files/branches with lowest coverage.

2. **Create a new branch**

   ```bash
   git checkout -b test/increase-coverage-$(date +%Y%m%d)
   ```

3. **Identify targets**

   - Focus on files with <50% coverage first
   - Prioritize: stores > hooks > components > utils
   - Skip generated files (types/database.ts) and config files

4. **Write tests**

   - Use existing test patterns from `src/test/`
   - Mock Supabase client, not the entire module
   - Mock Stripe
   - Use `TestProviders` wrapper for components
   - Follow DRY: extract common setup into fixtures
   - Test behavior, not implementation details
   - Include edge cases: loading states, errors, empty data

5. **Test patterns to follow**

   ```typescript
   // Good: Test behavior
   it("displays error message when fetch fails", async () => {});

   // Bad: Test implementation
   it("calls setError with message", () => {});
   ```

6. **Verify coverage increase**

   ```bash
   pnpm test --coverage
   ```

   Confirm coverage increased by ~10%. If not, continue writing tests.

7. **Ensure all tests pass**

   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```

8. **Commit and create PR**

   ```bash
   git add -A
   git commit -m "test: increase coverage from X% to Y%"
   git push -u origin HEAD
   gh pr create --title "test: increase coverage to Y%" --body "Increases test coverage from X% to Y%

   ## Files covered
   - list files here

   ## Coverage report
   [paste summary]"
   ```

## Guidelines

- Don't test trivial code (simple passthrough, type definitions)
- Don't sacrifice test quality for coverage numbers
- Each test file should be <300 lines; split if larger
- Run the full test suite before creating PR
