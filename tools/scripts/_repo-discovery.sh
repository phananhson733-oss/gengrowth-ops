#!/usr/bin/env bash

gengrowth_find_repo() {
  local name="$1"
  local candidate

  for candidate in \
    "$HOME/$name" \
    "$HOME/Code/$name" \
    "$HOME/code/$name" \
    "$HOME/Documents/$name"
  do
    if [ -d "$candidate" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  printf '%s\n' "$HOME/$name"
}
