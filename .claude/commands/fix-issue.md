# Fix Issue and Create PR

Implement the fix for a GitHub issue and create a linked pull request.

**Argument:** `$ARGUMENTS` - The GitHub issue number (e.g., `42`)

## Steps

1. **Fetch the issue details**

   ```bash
   gh issue view $ARGUMENTS
   ```

   Read the issue title, description, and labels to understand:
   - What needs to be fixed/implemented
   - The type of change (bug fix, feature, etc.)
   - Any acceptance criteria or requirements

2. **Determine branch type from issue**

   Based on issue labels and content:
   - `bug` label or fix-related → `fix/issue-<number>-short-description`
   - `enhancement` or feature-related → `feat/issue-<number>-short-description`
   - `documentation` label → `docs/issue-<number>-short-description`
   - Refactoring work → `refactor/issue-<number>-short-description`
   - Test-related → `test/issue-<number>-short-description`
   - Default to `fix/` if unclear

3. **Create a new branch**

   ```bash
   git checkout -b <type>/issue-<number>-short-description
   ```

   The short description should be 2-4 words from the issue title, hyphenated.

4. **Implement the fix**

   - Read and understand the relevant code
   - Make the necessary changes to fix the issue
   - Follow existing code patterns and conventions
   - Run `pnpm lint` to check for issues

5. **Verify the fix**

   ```bash
   pnpm lint
   pnpm build
   pnpm test
   ```

   All checks must pass before proceeding.

6. **Stage and commit**

   Commit message format (reference the issue):
   ```
   <type>: <short description>

   Fixes #<issue-number>
   ```

   ```bash
   git add -A
   git commit -m "<type>: <description>

   Fixes #$ARGUMENTS"
   ```

7. **Push and create PR**

   ```bash
   git push -u origin HEAD
   gh pr create --title "<type>: <description>" --body "Fixes #$ARGUMENTS

   ## What does this PR do?

   <Brief description of the changes>

   ## Type of change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Refactor
   - [ ] Documentation
   - [ ] Other

   ## Checklist

   - [ ] \`pnpm lint\` passes
   - [ ] \`pnpm build\` succeeds
   - [ ] \`pnpm test\` passes
   - [ ] Changes tested manually"
   ```

   Using `Fixes #<number>` will auto-close the issue when the PR is merged.

## Rules

- Always fetch and read the issue before starting work
- Branch names must include the issue number for traceability
- Commit message must reference the issue with `Fixes #<number>`
- Branch type must match commit type
- Keep descriptions concise (50 chars or less for commit subject)
- Use lowercase for branch names and commit messages
- Use hyphens in branch names, not underscores
- Run all checks before creating the PR
- PR will auto-link to the issue via the `Fixes` keyword

## Examples

For issue #42 titled "Button doesn't respond to clicks on mobile":
- Branch: `fix/issue-42-mobile-button-click`
- Commit: `fix: handle touch events on mobile buttons\n\nFixes #42`
- PR title: `fix: handle touch events on mobile buttons`

For issue #15 titled "Add dark mode support":
- Branch: `feat/issue-15-dark-mode`
- Commit: `feat: add dark mode support\n\nFixes #15`
- PR title: `feat: add dark mode support`
