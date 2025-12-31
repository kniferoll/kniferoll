# Increase Test Coverage

Increase test coverage by 10% toward our goal of 90%.

## Current Status

- **Threshold enforcement**: Enabled in `apps/web/vitest.config.ts`
- CI will **fail** if coverage drops below the configured thresholds
- To raise the bar after increasing coverage, update the `thresholds` in vitest.config.ts

## Steps

1. **Check current coverage**

   ```bash
   pnpm --filter web test:coverage
   ```

   Note the current coverage percentage and identify files/branches with lowest coverage.

2. **Create a new branch**

   ```bash
   git checkout -b test/increase-coverage-$(date +%Y%m%d)
   ```

3. **Identify targets**

   - Focus on files with <50% coverage first
   - Prioritize: lib (pure functions) > stores > hooks > components
   - Skip generated files (types/database.ts) and config files
   - Pure utility functions in `lib/` are easiest to test (no mocking needed)

4. **Write tests**

   Test files go in `src/test/`:
   - `src/test/unit/` - Unit tests for pure functions, stores, hooks
   - `src/test/integration/` - Performance budget tests (existing)

   ### Mocking Supabase in stores/hooks

   Use `vi.hoisted()` to create mocks that are available when `vi.mock` runs:

   ```typescript
   import { describe, it, expect, vi, beforeEach } from "vitest";

   // Create mocks using vi.hoisted so they're available when vi.mock runs
   const { mockSupabase } = vi.hoisted(() => ({
     mockSupabase: {
       from: vi.fn(),
       auth: {
         getUser: vi.fn(),
         getSession: vi.fn(),
       },
     },
   }));

   vi.mock("@/lib/supabase", () => ({
     supabase: mockSupabase,
   }));

   vi.mock("@/lib", () => ({
     supabase: mockSupabase,
   }));

   // Import AFTER mocking
   import { useYourStore } from "@/stores/yourStore";
   ```

   ### Mocking Supabase query chains

   ```typescript
   // For .from().select().eq().single() chains:
   const chain = {
     eq: vi.fn().mockReturnThis(),
     single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
   };
   mockSupabase.from.mockReturnValue({
     select: vi.fn(() => chain),
   });

   // For insert/update/delete:
   mockSupabase.from.mockReturnValue({
     insert: vi.fn(() => ({
       select: vi.fn(() => ({
         single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
       })),
     })),
   });
   ```

   ### Testing components

   - Use `TestProviders` wrapper from `src/test/utils/providers.tsx`
   - Set auth state with `setTestAuthState(true/false)` before rendering

5. **Test patterns to follow**

   ```typescript
   // Good: Test behavior
   it("displays error message when fetch fails", async () => {});

   // Bad: Test implementation
   it("calls setError with message", () => {});
   ```

6. **Verify coverage increase**

   ```bash
   pnpm --filter web test:coverage
   ```

   Confirm coverage increased by ~10%. If not, continue writing tests.

7. **Update coverage thresholds**

   After increasing coverage, update `apps/web/vitest.config.ts`:

   ```typescript
   thresholds: {
     statements: NEW_VALUE,
     branches: NEW_VALUE,
     functions: NEW_VALUE,
     lines: NEW_VALUE,
   },
   ```

8. **Ensure all tests pass**

   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```

9. **Commit and create PR**

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

## Future: Database/RLS Testing with Supabase

For testing RLS policies and database logic, Supabase supports:

### pgTAP (Database unit testing)

```bash
# Create a test file
supabase test new my_rls.test

# Run database tests
supabase test db
```

Tests use transactions for isolation (`begin`/`rollback`).

### Application-level Supabase testing

For integration tests that hit the real database:
- Use unique IDs per test to avoid conflicts
- Create test users with `adminSupabase.auth.admin.createUser()`
- Don't rely on clean database state - make tests independent

See Supabase docs: https://supabase.com/docs/guides/testing
