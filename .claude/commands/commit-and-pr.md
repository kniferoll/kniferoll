# Commit and Create PR

Publish the current changes on a new branch and create a pull request.

## Steps

1. **Check current state**

   ```bash
   git status
   git diff --stat
   ```

   Ensure there are changes to commit. If not, stop here.

2. **Create a new branch**

   Branch naming conventions:
   - `feat/short-description` - New features
   - `fix/short-description` - Bug fixes
   - `refactor/short-description` - Code refactoring
   - `test/short-description` - Test additions/changes
   - `docs/short-description` - Documentation only
   - `chore/short-description` - Build, config, tooling changes

   ```bash
   git checkout -b <type>/short-description
   ```

3. **Stage and commit**

   Commit message format:
   ```
   <type>: <short description>

   [optional body with more details]
   ```

   Types (match branch prefix):
   - `feat` - New feature
   - `fix` - Bug fix
   - `refactor` - Code change that neither fixes a bug nor adds a feature
   - `test` - Adding or updating tests
   - `docs` - Documentation only
   - `chore` - Build process, dependencies, tooling

   ```bash
   git add -A
   git commit -m "<type>: <description>"
   ```

4. **Push and create PR**

   ```bash
   git push -u origin HEAD
   gh pr create --title "<type>: <description>"
   ```

   The PR body will use the template from `.github/pull_request_template.md`.

## Rules

- Branch names and commit types must match (e.g., `feat/` branch uses `feat:` commits)
- Keep descriptions concise (50 chars or less for commit subject)
- Use lowercase for branch names and commit messages
- Use hyphens in branch names, not underscores
- One logical change per PR - don't bundle unrelated changes
- Run `pnpm lint && pnpm build && pnpm test` before creating PR
