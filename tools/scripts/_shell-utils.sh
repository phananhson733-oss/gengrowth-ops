#!/usr/bin/env bash

gengrowth_log_line_count() {
  local log_file="$1"

  if [ ! -f "$log_file" ]; then
    printf '0\n'
    return 0
  fi

  wc -l < "$log_file"
}
