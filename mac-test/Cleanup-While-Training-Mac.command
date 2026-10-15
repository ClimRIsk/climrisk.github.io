#!/bin/bash
# Same as Cleanup-Storage-Mac.command (shows everything with sizes, deletes only after you type YES) but allowed while v7 is still training.
# It never touches v6/v7, the datasets the v7 run still uses (ds7, dsx7f, dsrf, ds5f) or the model the app is using.
HERE="$(cd "$(dirname "$0")" && pwd)"
WHILE_TRAINING=1 exec bash "$HERE/Cleanup-Storage-Mac.command"
