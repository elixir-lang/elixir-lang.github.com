# USAGE:
#  At least you need to define "filter_stderr()" in order to use "filter_it()"
#  Additionally you can set the following filters:
#  - filter_stderr():    Filters `stderr` right after being received.
#  - filter_stdout():    Filters `stdout` before being printed on screen.
#  - filter_error():     Post-filters `stderr` only on ERROR status.
#  - filter_ok():        Post-filters `stdout` only on OK status.
#  - filter_new_lines(): Last filter before printed on screen. Removes multilple lines by default.
#

#######################
# TEMPORARY FILES

TEMP_DIR=$(mktemp -dt "$(basename $0).XXXXXXXXXX")
STDOUT="$TEMP_DIR/htmlproof_stdout"
STDERR="$TEMP_DIR/htmlproof_stderr"
STDERR_PRE="$TEMP_DIR/htmlproof_stderr_pre"

# removeS the temporary directory and its contents
clean_temp_files() {
  rm -rf "$TEMP_DIR" 2> /dev/null
}

########################
# FILTERS

# Filters `stdout` before being printed on screen.
filter_stdout() { grep ""; } # return stdin

# Post-filters `stdout` only on OK status.
filter_ok() { grep ""; } # return stdin

# Post-filters `stderr` only on ERROR status.
filter_error() { grep ""; } # return stdin

# Removes multilple lines (Last filter before printed on screen)
filter_new_lines() {
  #removes trailing new lines
  sed -e :a -e '/./,$!d;/^\n*$/{$d;N;};/\n$/ba' |

  # Replace 3+ new lines, with 2 new lines
  perl -0777 -CSAD -pe "s/\n{3,}/\n\n/g"
}

########################
# MAIN FUNCTIONS

# valitate <cmd>
#   Runs <cmd>, and stores stdout and stderr in the temporary "STD" files
function validate() {
  local cmd="$1"
  echo "$cmd" &&
  $cmd 1>"$STDOUT" 2>"$STDERR_PRE"
  cat "$STDERR_PRE" | filter_stderr >"$STDERR"
}

# filter_it <full_path_dir> <command> [<ok_msg>] [<error_msg>]
#   Run `validate $cmd`, applying filter_stderr,
#   then reads those errors, if any, prints STATUS ERROR,
#   otherwise print STATUS OK
filter_it() {
  local dir=$(readlink -f "$1")
  local cmd="$2"
  local ok_msg="${3:-OK: Documents successfully validated.}"
  local error_msg="${4:-ERROR: Documents did not validate.}"

  pushd "$dir" 1> /dev/null
  pwd
  validate "$cmd"
  echo
  local errors=$(<"$STDERR")

  if [ "${#errors}" -gt 0 ]; then
    cat "$STDOUT" | filter_stdout | filter_new_lines
    echo
    echo "ERRORS..."
    cat "$STDERR" | filter_new_lines >&2
    echo
    echo "$error_msg" | filter_error | filter_new_lines >&2
    clean_temp_files
    popd 1> /dev/null
    return 1
  else
    cat "$STDOUT" | filter_stdout | filter_ok | filter_new_lines
    echo
    echo "$ok_msg"
    clean_temp_files
    popd 1> /dev/null
    return 0
  fi
}
