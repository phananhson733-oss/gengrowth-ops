#!/usr/bin/env zsh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
CODEX_SKILLS_DIR="$CODEX_HOME_DIR/skills"
WRAPPER_ROOT="$REPO_ROOT/tools/internal/codex-skill-wrappers"
DRY_RUN=0

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

log() {
  printf '%s\n' "$*"
}

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '[dry-run] %s\n' "$*"
  else
    eval "$@"
  fi
}

slugify() {
  local value="$1"
  value="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"
  value="$(printf '%s' "$value" | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
  printf '%s' "$value"
}

ensure_dir() {
  local dir="$1"
  if [[ "$DRY_RUN" == "1" ]]; then
    [[ -d "$dir" ]] || printf '[dry-run] mkdir -p %s\n' "$dir"
  else
    mkdir -p "$dir"
  fi
}

safe_link_skill() {
  local name="$1"
  local target="$2"
  local dest="$CODEX_SKILLS_DIR/$name"

  if [[ ! -e "$target/SKILL.md" ]]; then
    log "skip: $name target has no SKILL.md: $target"
    return 0
  fi

  if [[ -L "$dest" ]]; then
    run "ln -sfn ${(q)target} ${(q)dest}"
    log "linked: $name -> $target"
    return 0
  fi

  if [[ -e "$dest" ]]; then
    log "skip: $name already exists and is not a symlink: $dest"
    return 0
  fi

  run "ln -s ${(q)target} ${(q)dest}"
  log "linked: $name -> $target"
}

write_file() {
  local file="$1"
  local content="$2"
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '[dry-run] write %s\n' "$file"
  else
    printf '%s\n' "$content" > "$file"
  fi
}

make_wrapper_skill() {
  local name="$1"
  local display_name="$2"
  local description="$3"
  local source_path="$4"
  local trigger_hint="$5"
  local wrapper_dir="$WRAPPER_ROOT/$name"

  ensure_dir "$wrapper_dir/agents"

  write_file "$wrapper_dir/SKILL.md" "---
name: $name
description: |-
  $description
---

# $display_name

This is a Codex wrapper for a project resource-map entry.

When this skill is triggered:

1. Read the source file: \`$source_path\`
2. Follow its role, workflow, constraints, and trigger rules.
3. Also follow the GenGrowth wiki instructions in \`AGENTS.md\`, especially Chinese output, record writing, and document routing rules.

Trigger hint: $trigger_hint"

  write_file "$wrapper_dir/agents/openai.yaml" "interface:
  display_name: \"$display_name\"
  short_description: \"$description\"
  default_prompt: \"Use \$$name for a GenGrowth wiki task.\""

  safe_link_skill "$name" "$wrapper_dir"
}

extract_frontmatter_field() {
  local field="$1"
  local file="$2"
  awk -v key="$field:" '
    NR == 1 && $0 == "---" { in_fm = 1; next }
    in_fm && $0 == "---" { exit }
    in_fm && index($0, key) == 1 {
      sub(key, "", $0)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", $0)
      gsub(/^"|"$/, "", $0)
      print $0
      exit
    }
  ' "$file"
}

ensure_dir "$CODEX_SKILLS_DIR"
ensure_dir "$WRAPPER_ROOT"

log "== Standard wiki skills =="
safe_link_skill "company-survey" "$REPO_ROOT/tools/internal/skills/company-survey-skill/company-survey"
safe_link_skill "production-survey" "$REPO_ROOT/tools/internal/skills/production-survey-skill/production-survey"
safe_link_skill "web-clipper" "$REPO_ROOT/tools/internal/skills/web-clipper"
safe_link_skill "humanizer-zh" "$REPO_ROOT/tools/internal/skills/humanizer-zh"
safe_link_skill "wechat-writing" "$REPO_ROOT/tools/internal/skills/wechat-writing-skill/wechat-writing"

log "== Marketing single-file skills =="
for file in "$HOME"/gengrowth-agents/.claude/skills/marketing/*.md; do
  [[ -e "$file" ]] || continue
  base="$(basename "$file" .md)"
  name="$(slugify "$base")"
  fm_name="$(extract_frontmatter_field name "$file")"
  display_name="${fm_name:-$name}"
  desc="$(extract_frontmatter_field description "$file")"
  [[ -n "$desc" ]] || desc="Use the $display_name marketing skill from gengrowth-agents."
  make_wrapper_skill "$name" "$display_name" "$desc" "$file" "$base, marketing, growth, SEO, CRO, copywriting, content strategy"
done

log "== Claude agent wrappers =="
for file in "$REPO_ROOT"/.claude/agents/*.md "$HOME"/gengrowth-agents/.claude/agents/*.md; do
  [[ -e "$file" ]] || continue
  base="$(basename "$file" .md)"
  name="$(slugify "$base")"
  fm_name="$(extract_frontmatter_field name "$file")"
  display_name="${fm_name:-$name}"
  desc="$(extract_frontmatter_field description "$file")"
  [[ -n "$desc" ]] || desc="Use the $display_name agent instructions as a Codex skill wrapper."
  make_wrapper_skill "$name" "$display_name" "$desc" "$file" "$base, agent, role-specific GenGrowth work"
done

log "done: resource-map skills and agent wrappers synced for Codex."
