#!/bin/sh
# Realism harness: one reproducible command for library targets and simulator scorecards.
#
#   bash scripts/realism/run_all.sh --library-only          # self-test, then measure the library into
#                                                           # datasets/library/realism_targets.json
#   bash scripts/realism/run_all.sh --set baseline          # self-test, then score a capture set against
#                                                           # the targets (measures the library first if the
#                                                           # targets file is missing)
#   options: --pipeline matched|lossless (default matched), --jobs N, --skip-selftest
#
# Captures come from a development build: in the browser console,
#   const m = await import("/src/dev/xrayCapture.ts"); m.installXrayCapture();
#   await window.__xrayCapture.standard("baseline");
# which POSTs frames to datasets/tmp/captures/ through the dev server.
# Python standard library plus macOS sips only; caches live in datasets/tmp/realism/.
set -e
cd "$(dirname "$0")/../.."

LIB_ONLY=0
SET=""
PIPE=matched
JOBS=""
SELFTEST=1
while [ $# -gt 0 ]; do
  case "$1" in
    --library-only) LIB_ONLY=1 ;;
    --set) SET="$2"; shift ;;
    --pipeline) PIPE="$2"; shift ;;
    --jobs) JOBS="--jobs $2"; shift ;;
    --skip-selftest) SELFTEST=0 ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
  shift
done

if [ "$SELFTEST" = 1 ]; then
  echo "== metric self-test"
  python3 scripts/realism/selftest.py
fi

if [ "$LIB_ONLY" = 1 ] || [ ! -f datasets/library/realism_targets.json ]; then
  echo "== library targets"
  python3 scripts/realism/targets.py $JOBS
fi

if [ -n "$SET" ]; then
  echo "== scorecard for capture set $SET ($PIPE pipeline)"
  python3 scripts/realism/report.py "$SET" --pipeline "$PIPE" $JOBS
fi
