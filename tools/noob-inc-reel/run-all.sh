#!/bin/sh
# Seeds a demo office, records view-only then admin against it, cleans the seed out, encodes.
set -e
cd "$(dirname "$0")"
pkill -f "seed.mjs" 2>/dev/null || true
[ -f .seeded-at ] && node seed.mjs clean
node seed.mjs > seed.log 2>&1 &
trap 'pkill -f "node seed.mjs$" || true; node seed.mjs clean' EXIT
sleep 8
export SHARE_TOKEN=$(node -e "
const fs=require('fs');const A='/Users/alexschumacher/noob-inc';
const u=fs.readFileSync(A+'/.env.local','utf8').match(/^DATABASE_URL=(.*)$/m)[1].replace(/^\"|\"$/g,'');
const p=require(A+'/node_modules/postgres')(u,{prepare:false,ssl:'require'});
p\`select share_token from noob.settings\`.then(r=>{process.stdout.write(r[0].share_token);p.end()})")
node take1.mjs
node take2.mjs
sleep 3
../don-star-reel/cam2mp4 takes.json ../../assets/noob-inc-demo.mp4
