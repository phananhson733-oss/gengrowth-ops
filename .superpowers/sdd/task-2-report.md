# Task 2 Report: Legacy drama-platform normalization

## Scope completed

- Added migration-only, per-source-row normalization for the exact legacy value `MoboReels` to the existing fixed value `其他`.
- Unknown nonblank drama-platform values now create a `platform_not_allowed` blocker; the fixed schema enum remains unchanged.
- Added one exact `platform_mapped_to_other` warning per mapped source row, including the output drama ID and source/target values.
- Bound this warning to manifest replay validation, including its exact key set and final business-row platform.
- Added replay tamper tests for the business row, normalization warning, and signed Google source backup.

## TDD evidence

### RED

Command:

```zsh
cd /Users/awayer_mini/.codex/worktrees/gengrowth-ops-shortdrama-select-options/inbox-pengman/tools/short-drama-release-manager
node --test --test-concurrency=1 --test-name-pattern='MoboReels|unknown nonblank drama platform' tests/migration.test.mjs
```

Result before implementation: `pass 0`, `fail 2`.

- `MoboReels maps to 其他 per source row and preserves signed source evidence` failed because the unnormalized legacy value produced a `drama_merge_conflict`.
- `an unknown nonblank drama platform blocks instead of widening the fixed enum` failed because no `platform_not_allowed` blocker was emitted.

### GREEN: focused behavior

Same command after implementation:

```text
pass 2
fail 0
```

### GREEN: replay-tamper coverage

Command:

```zsh
node --test --test-concurrency=1 --test-name-pattern='replay rejects re-digested legacy platform' tests/migration.test.mjs
```

Result:

```text
pass 1
fail 0
```

The test re-digests each forged manifest and confirms replay rejects all three mutations: final business platform, mapped-platform warning target, and source-backup value.

### Full regression

Command:

```zsh
node --test --test-concurrency=1 tests/migration.test.mjs
```

Result:

```text
tests 57
pass 57
fail 0
```

### Static diff check

Command:

```zsh
git diff --check
```

Result: clean (no output).

## Changed files

- `inbox-pengman/tools/short-drama-release-manager/src/migration.mjs`
- `inbox-pengman/tools/short-drama-release-manager/tests/migration.test.mjs`

## Self-review

- Normalization occurs immediately after the writable drama projection and before canonical-group scalar-conflict evaluation.
- The platform set is read directly from `TABLES["选剧池"].options.平台`; no schema options were added or changed.
- `MoboReels` preserves its original evidence in `source_backup`, while business rows contain only `其他`.
- Warning validation locks the prescribed six exact keys and checks table, drama ID, exact source/target values, and final row platform.
- `assertManifest()` replays from the raw backup, so source evidence and materialized business output cannot be independently re-digested into an accepted manifest.

## Concerns

None. The change is intentionally limited to the requested migration path and leaves Task 1's option-policy annotations untouched.
