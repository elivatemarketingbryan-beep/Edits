#!/bin/zsh
# Side-by-side A/B: the paid hybrid proof (AI avatar + video models) vs the 100%-code local cut, same track seconds.
#   tools/compare.sh <paid.mp4> <local.mp4> <out.mp4> [duration=15.67]
set -e
PAID=$1; LOCAL=$2; OUT=$3; DUR=${4:-15.67}
ROOT=${0:A:h:h}
FONT=$ROOT/fonts/Anton-Regular.ttf
ffmpeg -y -loglevel error -t $DUR -i "$PAID" -t $DUR -i "$LOCAL" -filter_complex "
  color=c=0x0E0E12:s=1920x1080:r=30:d=${DUR}[bg];
  [0:v]fps=30,scale=930:-2,setsar=1[a];
  [1:v]fps=30,scale=930:-2,setsar=1[b];
  [bg][a]overlay=20:300[t1];
  [t1][b]overlay=970:300[t2];
  [t2]drawtext=fontfile=${FONT}:text='SAME SONG · TWO WAYS':fontcolor=0xFFFBF4:fontsize=86:x=(w-tw)/2:y=70,
      drawtext=fontfile=${FONT}:text='PAID — AI AVATAR + VIDEO MODELS':fontcolor=0xFF3E8A:fontsize=44:x=20+(930-tw)/2:y=225,
      drawtext=fontfile=${FONT}:expansion=none:text='LOCAL — 100% CODE · \$0':fontcolor=0xFF6A1F:fontsize=44:x=970+(930-tw)/2:y=225[v]
" -map "[v]" -map "1:a?" -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT"
echo "$OUT"
