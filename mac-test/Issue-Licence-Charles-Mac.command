#!/bin/bash
# Issues Charles Hett's evaluation licence: 14 days from first activation, 30 analysis runs, 100 AI questions, must be activated within 30 days.
HERE="$(cd "$(dirname "$0")" && pwd)"
NAME="Charles Hett" EMAIL="charleshett@gmail.com" DAYS=14 RUNS=30 AI=100 bash "$HERE/Issue-Licence-Mac.command"
