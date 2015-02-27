# USAGE:
#  At least you need to define "prefilter_stderr()" in order to use "filter_it()"
#  Additionally you can set the following filters:
#  - prefilter_stderr():  Filters `stderr` as soon as it is received.
#  - prefilter_stdout():  Filters `stdout` as soon as it is received.
#  - filter_error():      Filters messages printed on ERROR status.
#  - filter_ok():         Filters messages printed on OK status.
#  - filter_last():       Last filter applied to any message being printed. Removes multilple lines and trailing new lines by default.
#  - capture_std():       Allows users to read from stderr/stdout files, extract information and improve $MSG_OK and $MSG_ERROR.

#######################
# TEMPORARY FILES

TEMP_DIR=$(mktemp -dt "$(basename $0).XXXXXXXXXX")
STDOUT_RAW="$TEMP_DIR/htmlproof_stdout_raw" # raw stdout
STDOUT="$TEMP_DIR/htmlproof_stdout" # filtered stdout (after filter_stdout)
STDERR_RAW="$TEMP_DIR/htmlproof_stderr_raw" # raw stderr
STDERR="$TEMP_DIR/htmlproof_stderr" # filtered stderr (after filter_stderr)

# Messages
MSG_OK=""
MSG_ERROR=""
CMD_NAME=""

# Remove the temporary directory and its contents
clean_temp_files() {
  rm -rf "$TEMP_DIR" 2> /dev/null
}

########################
# FILTERS

# Filters `stdout` as soon as it is received ($STDOUT_RAW)
prefilter_stdout() { grep ""; } # return stdin
# Filters `stderr` as soon as it is received ($STDERR_RAW)
prefilter_stderr() { grep ""; } # return stdin

# Filters messages printed on OK status.
filter_ok() { grep ""; } # return stdin

# Ffilters messages printed on ERROR status (stdout and stderr)
filter_error() { grep ""; } # return stdin

# Last filter before printed on screen.
# Applied to any kind of message, whether error or OK.
filter_last() {
  remove_new_lines
}

# Let user capture data from stdout and stderr
capture_std(){ return 0; }


########################
# MAIN FUNCTIONS

# Removes multilple lines and trailing new lines. Reads input from stdin.
remove_new_lines() {
  #removes trailing new lines
  sed -e :a -e '/./,$!d;/^\n*$/{$d;N;};/\n$/ba' |

  # Replace 3+ new lines, with 2 new lines
  perl -0777 -CSAD -pe "s/\n{3,}/\n\n/g"
}

# run_cmd <cmd>
#   Runs <cmd>, and stores stdout and stderr in the temporary "STD*" files
run_cmd() {
  local cmd="$1"
  echo "$cmd" &&
  $cmd 1>"$STDOUT_RAW" 2>"$STDERR_RAW"
  # Filter raw std
  cat "$STDOUT_RAW" | prefilter_stdout >"$STDOUT"
  cat "$STDERR_RAW" | prefilter_stderr >"$STDERR"
  # Capture stdout/stderr (and store desired information in variables)
  capture_std
  return 0
}

# filter_it <full_path_dir> <command>
#   Executes `run_cmd $cmd`, applying filter_stderr,
#   then reads those errors, if any, prints STATUS ERROR,
#   otherwise print STATUS OK
filter_it() {
  local dir=$(readlink -f "$1")
  local cmd="$2"

  # Default Messages
  if [ -z "$MSG_OK" ]; then
    if [ -z "$CMD_NAME" ]; then
      MSG_OK="OK: Documents successfully validated."
    else 
      MSG_OK="OK: ${CMD_NAME} - Documents successfully validated."
    fi
  fi

  if [ -z "$MSG_ERROR" ]; then
    if [ -z "$CMD_NAME" ]; then
      MSG_ERROR="ERROR: Documents did not validate."
    else 
      MSG_ERROR="ERROR: ${CMD_NAME} - Documents did not validate."
    fi
  fi

  pushd "$dir" 1> /dev/null
  pwd
  run_cmd "$cmd"
  echo
  local errors=$(<"$STDERR")

  if [ "${#errors}" -gt 0 ]; then
    cat "$STDOUT" | filter_error | filter_last
    echo
    {
      echo "ERRORS..."
      cat "$STDERR" | filter_error | filter_last
      echo
      echo "$MSG_ERROR"
    } >&2
    # clean
    clean_temp_files
    popd 1> /dev/null
    return 1
  
  else
    cat "$STDOUT" | filter_ok | filter_last
    echo
    echo "$MSG_OK"
    # clean
    clean_temp_files
    popd 1> /dev/null
    return 0
  fi
}
