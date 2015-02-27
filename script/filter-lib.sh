TEMP_DIR=$(mktemp -dt "$(basename $0).XXXXXXXXXX")

STDOUT="$TEMP_DIR/htmlproof_stdout"
STDERR="$TEMP_DIR/htmlproof_stderr"
STDERR_PRE="$TEMP_DIR/htmlproof_stderr_pre"

clean_temp_files() {
  rm -rf "$TEMP_DIR" 2> /dev/null
}

function validate() {
  local cmd="$1"
  echo "$cmd" &&
  $cmd 1>"$STDOUT" 2>"$STDERR_PRE"
  cat "$STDERR_PRE" | filter_errors >"$STDERR"
}

filter_success() {
  perl -0777 -CSAD -pe "s/\n{3,}/\n\n/g"
}

# filter_it <full_path_dir> <command>
filter_it() {
  local dir=$(readlink -f "$1")
  pushd "$dir" 1> /dev/null
  pwd
  validate "$2"
  errors=$(<"$STDERR")
  length=${#errors}
  if [ "$length" -gt 0 ]; then
    echo "ERROR: Documents are not valid" >&2
    echo
    cat "$STDERR" >&2
    clean_temp_files
    popd 1> /dev/null
    return 1
  else
    cat "$STDOUT" | filter_success
    echo
    echo "OK: Documents successfully validated"
    cat "$STDERR" >&2
    clean_temp_files
    popd 1> /dev/null
    return 0
  fi
}
