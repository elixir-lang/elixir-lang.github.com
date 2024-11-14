#!/bin/sh
# See latest version at:
# https://github.com/elixir-lang/elixir-lang.github.com/blob/main/install.sh

set -eu

otp_version=
elixir_version=
force=false

usage() {
  cat<<EOF
Usage: install.sh elixir@ELIXIR_VERSION otp@OTP_VERSION [options]

ELIXIR_VERSION can be X.Y.Z, latest, or main.
OTP_VERSION can be X.Y.Z, latest, master, maint, or maint-RELEASE (e.g. maint-27).

Options:

  -f, --force      Forces installation even if it was previously installed
  -h, --help       Prints this help

Examples:

  sh install.sh elixir@1.16.3 otp@26.2.5.4
  sh install.sh elixir@latest otp@latest
  sh install.sh elixir@main otp@master

EOF
}

main() {
  for arg in "$@"; do
    case "$arg" in
      elixir@*)
        elixir_version="${arg#elixir@}"
        ;;
      otp@*)
        otp_version="${arg#otp@}"
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      -f|--force)
        force=true
        ;;
      *)
        echo "error: invalid argument $arg" >&2
        exit 1
        ;;
    esac
  done

  if [ -z "${elixir_version}" ]; then
    usage
    echo "error: missing elixir@VERSION argument"
    exit 1
  fi

  if [ -z "${otp_version}" ]; then
    usage
    echo "error: missing otp@VERSION argument"
    exit 1
  fi

  root_dir="$HOME/.elixir-install"
  tmp_dir="$root_dir/tmp"
  mkdir -p "$tmp_dir"

  if [ "${otp_version}" = latest ]; then
    url=$(curl -fsS --head https://github.com/erlef/otp_builds/releases/latest | grep -i '^location:' | awk '{print $2}' | tr -d '\r\n')
    tag=$(basename "$url")
    otp_version="${tag#OTP-}"
  fi

  if [ "${elixir_version}" = latest ]; then
    url=$(curl -fsS --head https://github.com/elixir-lang/elixir/releases/latest | grep -i '^location:' | awk '{print $2}' | tr -d '\r\n')
    tag=$(basename "$url")
    elixir_version="${tag#v}"
  fi

  case "${otp_version}" in
    master|maint*)
      branch_version=$(curl -fsS https://raw.githubusercontent.com/erlang/otp/refs/heads/${otp_version}/OTP_VERSION | tr -d '\n')
      elixir_otp_release="${branch_version%%.*}"
      ;;
    *)
      elixir_otp_release="${otp_version%%.*}"
      ;;
  esac

  case "$elixir_version" in
    1.14.*)
      [ "${elixir_otp_release}" -ge 25 ] && elixir_otp_release=25
      ;;
    1.15.*|1.16.*)
      [ "${elixir_otp_release}" -ge 26 ] && elixir_otp_release=26
      ;;
    *)
      [ "${elixir_otp_release}" -ge 27 ] && elixir_otp_release=27
      ;;
  esac

  otp_dir="$root_dir/installs/otp/$otp_version"
  elixir_dir="${root_dir}/installs/elixir/${elixir_version}-otp-${elixir_otp_release}"

  if unzip_available; then
    install_otp &
    pid_otp=$!

    install_elixir &
    pid_elixir=$!

    wait $pid_otp
    wait $pid_elixir
  else
    # if unzip is missing (e.g. official docker ubuntu image), install otp and elixir
    # serially because we unzip elixir using OTP zip:extract/2.
    install_otp
    install_elixir
  fi

  printf "checking OTP... "
  export PATH="$otp_dir/bin:$PATH"
  erl -noshell -eval 'io:put_chars(erlang:system_info(otp_release) ++ " ok\n"), halt().'

  printf "checking Elixir... "
  "$elixir_dir/bin/elixir" -e 'IO.puts(System.version() <> " ok")'

  export PATH="$elixir_dir/bin:$PATH"
cat<<EOF

Run this (or add to your ~/.bashrc or similar file):

    export PATH=\$HOME/.elixir-install/installs/otp/$otp_version/bin:\$PATH
    export PATH=\$HOME/.elixir-install/installs/elixir/$elixir_version-otp-$elixir_otp_release/bin:\$PATH

EOF
}

install_otp() {
  os=$(uname -sm)
  case "$os" in
    "Darwin x86_64") target=x86_64-apple-darwin ;;
    "Darwin arm64")  target=aarch64-apple-darwin ;;
    "Linux x86_64")  target=x86_64-pc-linux ;;
    "Linux aarch64") target=aarch64-pc-linux ;;
    MINGW64*)        target=x86_64-pc-windows ;;
    *) echo "error: unsupported system $os." && exit 1 ;;
  esac

  if [ ! -d "${otp_dir}/bin" ] || [ "$force" = true ]; then
    rm -rf "${otp_dir}"

    case "$target" in
      *windows) install_otp_windows ;;
      *darwin) install_otp_darwin ;;
      *linux) install_otp_linux ;;
    esac
  fi
}

install_otp_darwin() {
  case "${otp_version}" in
    master|maint*)
      ref="${otp_version}-latest"
      ;;
    *)
      ref="OTP-${otp_version}"
      ;;
  esac

  otp_tgz="otp-${target}.tar.gz"
  url="https://github.com/erlef/otp_builds/releases/download/$ref/$otp_tgz"

  download "$url" "$tmp_dir/$otp_tgz"

  echo "unpacking $otp_tgz to $otp_dir..."
  mkdir -p "$otp_dir"
  tar xzf "$tmp_dir/$otp_tgz" -C "$otp_dir"
  rm "$tmp_dir/$otp_tgz"
}

install_otp_linux() {
  case "${otp_version}" in
    master|maint*)
      otp_tgz="${otp_version}.tar.gz"
      ;;
    *)
      otp_tgz="OTP-${otp_version}.tar.gz"
      ;;
  esac

  case "$target" in
    x86_64*)  arch=amd64 ;;
    aarch64*) arch=arm64 ;;
  esac

  id=$(grep '^ID=' /etc/os-release | cut -d '=' -f 2)
  if [ "${id}" != ubuntu ]; then
    echo $id is not supported
    exit 1
  fi
  case $(grep '^VERSION_ID=' /etc/os-release | cut -d '"' -f 2) in
    20*|21*)
      lts=20.04
      ;;
    22*|23*)
      lts=22.04
      ;;
    *)
      lts=24.04
      ;;
  esac

  url="https://builds.hex.pm/builds/otp/${arch}/ubuntu-${lts}/$otp_tgz"
  download "$url" "$tmp_dir/$otp_tgz"

  echo "unpacking $otp_tgz to $otp_dir..."
  mkdir -p "$otp_dir"
  tar xzf "$tmp_dir/$otp_tgz" --strip-components 1 -C "$otp_dir"
  (cd "$otp_dir" && ./Install -sasl "$PWD")
  rm "$tmp_dir/$otp_tgz"
}

install_otp_windows() {
  otp_zip="otp_win64_$otp_version.zip"
  url="https://github.com/erlang/otp/releases/download/OTP-$otp_version/$otp_zip"
  download "$url" "$tmp_dir/$otp_zip"

  echo "unpacking $otp_zip to $otp_dir..."
  mkdir -p "$otp_dir"
  unzip -q "$tmp_dir/$otp_zip" -d "$otp_dir"
  rm "$tmp_dir/$otp_zip"
  install_vc_redist
}

install_vc_redist() {
  if [ ! -f /c/windows/system32/vcruntime140.dll ]; then
    echo "installing VC++ Redistributable..."
    (cd $otp_dir && ./vc_redist.exe /quiet /norestart)
  fi
}

install_elixir() {
  elixir_zip="elixir-otp-$elixir_otp_release.zip"

  if [ ! -d "${elixir_dir}/bin" ] || [ "$force" = true ]; then
    case "${elixir_version}" in
      main)
        ref="${elixir_version}-latest"
        ;;
      v[0-9]*.[0-9])
        ref="v${elixir_version}-latest"
        ;;
      *)
        ref="v${elixir_version}"
        ;;
    esac

    url="https://github.com/elixir-lang/elixir/releases/download/$ref/$elixir_zip"
    download "$url" "$tmp_dir/$elixir_zip"

    echo "unpacking $elixir_zip to $elixir_dir..."
    rm -rf "${elixir_dir}"
    mkdir -p "${elixir_dir}"

    if unzip_available; then
      unzip -q "${tmp_dir}/${elixir_zip}" -d "${elixir_dir}"
    else
      "${otp_dir}/bin/erl" -noshell -eval \
        '[Zip,Dir] = init:get_plain_arguments(), {ok,_} = zip:unzip(Zip, [{cwd, Dir}]), halt().' \
        -- "${tmp_dir}/${elixir_zip}" "${elixir_dir}"
    fi

    rm "${tmp_dir}/${elixir_zip}"
  fi
}

download() {
  url="$1"
  output="$2"
  echo "downloading $url"
  curl --retry 3 -fsSLo "$output" "$url"
}

unzip_available() {
  which unzip >/dev/null 2>&1
}

main "$@"
