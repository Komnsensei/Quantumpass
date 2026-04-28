#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, appendFileSync, unlinkSync, renameSync, copyFileSync } from "fs";
import { execSync } from "child_process";
import { createInterface } from "readline";
import { resolve, join, dirname, basename, extname } from "path";
import { homedir } from "os";

var ESC="\x1b[";
function rgb(r,g,b){return ESC+"38;2;"+r+";"+g+";"+b+"m";}
function bgrgb(r,g,b){return ESC+"48;2;"+r+";"+g+";"+b+"m";}
var RST=ESC+"0m",BOLD=ESC+"1m",DIM=ESC+"2m",HIDE=ESC+"?25l",SHOW=ESC+"?25h",CLR=ESC+"2J"+ESC+"H";
function sleep(ms){return new Promise(function(ok){setTimeout(ok,ms)});}
function at(r,c){process.stdout.write(ESC+r+";"+c+"H");}
function wr(s){process.stdout.write(s);}
var W=process.stdout.columns||120;
var H=process.stdout.rows||30;

// GOTHIC 3D FONT — 7 rows tall, shadow built in
var GOTH={
K:[
" ##  ## ",
" ## ##  ",
" ####   ",
" ###    ",
" ####   ",
" ## ##  ",
" ##  ## "
],R:[
" #####  ",
" ##  ## ",
" ##  ## ",
" #####  ",
" ###    ",
" ## ##  ",
" ##  ## "
],A:[
"   ##   ",
"  ####  ",
" ##  ## ",
" ###### ",
" ##  ## ",
" ##  ## ",
" ##  ## "
],F:[
" ###### ",
" ##     ",
" ##     ",
" #####  ",
" ##     ",
" ##     ",
" ##     "
],T:[
" #######",
"   ##   ",
"   ##   ",
"   ##   ",
"   ##   ",
"   ##   ",
"   ##   "
],P:[
" #####  ",
" ##  ## ",
" ##  ## ",
" #####  ",
" ##     ",
" ##     ",
" ##     "
],S:[
"  ##### ",
" ##     ",
" ##     ",
"  ####  ",
"     ## ",
"     ## ",
" #####  "
],I:[
" ###### ",
"   ##   ",
"   ##   ",
"   ##   ",
"   ##   ",
"   ##   ",
" ###### "
],O:[
"  ####  ",
" ##  ## ",
" ##  ## ",
" ##  ## ",
" ##  ## ",
" ##  ## ",
"  ####  "
],N:[
" ##  ## ",
" ### ## ",
" ###### ",
" ## ### ",
" ##  ## ",
" ##  ## ",
" ##  ## "
],C:[
"  ##### ",
" ##     ",
" ##     ",
" ##     ",
" ##     ",
" ##     ",
"  ##### "
]};

// Small font for "from"
var SMALL={
f:["    "," ## ","####"," ## "," ## "],
r:["    ","# # ","##  ","#   ","#   "],
o:["    "," ## ","#  #","#  #"," ## "],
m:["     ","## # ","# # #","# # #","#   #"]
};

function getGothPixels(text){
  var rows=[[],[],[],[],[],[],[]];
  for(var i=0;i<text.length;i++){
    var g=GOTH[text[i]];
    if(!g)continue;
    for(var r=0;r<7;r++){
      if(i>0)rows[r].push(" ");
      for(var c=0;c<g[r].length;c++) rows[r].push(g[r][c]);
    }
  }
  return rows;
}

function getSmallPixels(text){
  var rows=[[],[],[],[],[]];
  for(var i=0;i<text.length;i++){
    var g=SMALL[text[i]];
    if(!g)continue;
    for(var r=0;r<5;r++){
      if(i>0)rows[r].push(" ");
      for(var c=0;c<g[r].length;c++) rows[r].push(g[r][c]);
    }
  }
  return rows;
}

// COLOR HELPERS
function purpleShade(depth){
  var base=[[180,0,255],[140,0,200],[100,0,160],[70,0,120]];
  var d=Math.min(depth,3);
  return rgb(base[d][0],base[d][1],base[d][2]);
}
function greenShade(depth){
  var base=[[0,255,100],[0,200,80],[0,150,60],[0,100,40]];
  var d=Math.min(depth,3);
  return rgb(base[d][0],base[d][1],base[d][2]);
}
function goldShade(depth){
  var base=[[255,215,0],[220,180,0],[180,140,0],[140,100,0]];
  var d=Math.min(depth,3);
  return rgb(base[d][0],base[d][1],base[d][2]);
}

// 3D BLOCK CHARS
var BLOCK_FULL="\u2588";
var BLOCK_SHADES=["\u2588","\u2593","\u2592","\u2591"];
var MATRIX_CHARS="01001101001010110100101KRAFT0110PASSION01001CRAFT101";

// ═══════════════════════════════════════════════
// PHASE 1: MATRIX RAIN BUILDS INTO KRAFT LETTERS
// ═══════════════════════════════════════════════
async function matrixBuildKraft(){
  var pixels=getGothPixels("KRAFT");
  var textW=pixels[0].length;
  var startCol=Math.floor((W-textW)/2);
  var startRow=Math.floor(H/2)-3;

  // Map of which screen positions are part of KRAFT
  var letterMap={};
  for(var r=0;r<7;r++){
    for(var c=0;c<pixels[r].length;c++){
      if(pixels[r][c]==="#"){
        letterMap[(startRow+r)+","+(startCol+c)]=true;
      }
    }
  }

  // Matrix drops
  var drops=[];
  for(var x=0;x<W;x++){
    drops.push({
      y:Math.floor(Math.random()*H*-2),
      speed:0.3+Math.random()*0.8,
      active:true
    });
  }

  // Track which letter pixels are "filled"
  var filled={};
  var totalPixels=Object.keys(letterMap).length;
  var filledCount=0;

  for(var frame=0;frame<200&&filledCount<totalPixels;frame++){
    for(var x=0;x<W;x++){
      if(!drops[x].active)continue;
      var d=drops[x];
      d.y+=d.speed;
      var iy=Math.floor(d.y);

      // Draw head (bright)
      if(iy>=1&&iy<=H){
        var key=iy+","+x;
        if(letterMap[key]&&!filled[key]){
          // This drop hit a letter pixel — LOCK IT
          filled[key]=true;
          filledCount++;
          at(iy,x+1);
          // 3D effect: shade based on position
          var depth=0;
          var rightKey=iy+","+(x+1);
          var belowKey=(iy+1)+","+x;
          if(!letterMap[rightKey])depth=1;
          if(!letterMap[belowKey])depth=Math.max(depth,1);
          wr(purpleShade(depth)+BOLD+BLOCK_SHADES[depth]);
        } else if(!letterMap[key]){
          at(iy,x+1);
          var ch=MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)];
          wr(Math.random()>0.5?greenShade(0):purpleShade(0));
          wr(ch);
        }
      }

      // Draw trail (dim, fading)
      for(var t=1;t<6;t++){
        var ty=iy-t;
        if(ty>=1&&ty<=H){
          var tkey=ty+","+x;
          if(!filled[tkey]){
            at(ty,x+1);
            if(t<3){
              wr(greenShade(t)+MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)]);
            } else {
              wr(rgb(0,30+Math.floor(Math.random()*20),0)+DIM+MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)]);
            }
          }
        }
      }

      // Erase far tail
      var eraseY=iy-8;
      if(eraseY>=1&&eraseY<=H){
        var ekey=eraseY+","+x;
        if(!filled[ekey]){at(eraseY,x+1);wr(" ");}
      }

      // Reset drop if off screen
      if(iy>H+10){
        drops[x].y=Math.floor(Math.random()*-5);
        drops[x].speed=0.3+Math.random()*0.8;
      }
    }
    await sleep(25);
  }

  // Fill any remaining letter pixels
  for(var key in letterMap){
    if(!filled[key]){
      var parts=key.split(",");
      at(parseInt(parts[0]),parseInt(parts[1])+1);
      wr(purpleShade(0)+BOLD+BLOCK_FULL);
    }
  }

  // Clean non-letter matrix remnants
  for(var r=1;r<=H;r++){
    for(var c=0;c<W;c++){
      var k=r+","+c;
      if(!letterMap[k]){at(r,c+1);wr(" ");}
    }
  }

  return {pixels:pixels,startRow:startRow,startCol:startCol,letterMap:letterMap};
}

// ═══════════════════════════════════════════════
// PHASE 2: KRAFT FLASHES PURPLE->GREEN->GOLD (3D)
// ═══════════════════════════════════════════════
async function flashKraft3D(info){
  var colorFns=[purpleShade,greenShade,goldShade];
  for(var ci=0;ci<3;ci++){
    var colorFn=colorFns[ci];
    for(var r=0;r<7;r++){
      for(var c=0;c<info.pixels[r].length;c++){
        if(info.pixels[r][c]==="#"){
          at(info.startRow+r, info.startCol+c+1);
          // 3D depth
          var depth=0;
          if(c+1>=info.pixels[r].length||info.pixels[r][c+1]!=="#")depth=1;
          if(r+1>=7||info.pixels[r+1][c]!=="#")depth=Math.max(depth,1);
          if(depth===1&&(c+1>=info.pixels[r].length||info.pixels[r][c+1]!=="#")&&(r+1>=7||info.pixels[r+1][c]!=="#"))depth=2;
          wr(colorFn(depth)+BOLD+BLOCK_SHADES[depth]);
        }
      }
    }
    await sleep(300);
  }
  await sleep(600);
}

// ═══════════════════════════════════════════════
// PHASE 3: KRAFT DISSOLVES — MATRIX DRAINS DOWN
// PASSIONCRAFT REVEALED UNDERNEATH IN GOLD
// ═══════════════════════════════════════════════
async function drainReveal(kraftInfo){
  // Pre-render PASSIONCRAFT position
  var pcPixels=getGothPixels("PASSIONCRAFT");
  var pcW=pcPixels[0].length;
  var pcStartCol=Math.floor((W-pcW)/2);
  var pcStartRow=kraftInfo.startRow; // Same row — revealed in place

  var pcMap={};
  for(var r=0;r<7;r++){
    for(var c=0;c<pcPixels[r].length;c++){
      if(pcPixels[r][c]==="#"){
        pcMap[(pcStartRow+r)+","+(pcStartCol+c)]=true;
      }
    }
  }

  // Also render "from" above
  var fromPixels=getSmallPixels("from");
  var fromW=fromPixels[0].length;
  var fromStartCol=Math.floor((W-fromW)/2);
  var fromStartRow=pcStartRow-6;
  var fromMap={};
  for(var r=0;r<5;r++){
    for(var c=0;c<fromPixels[r].length;c++){
      if(fromPixels[r][c]==="#"){
        fromMap[(fromStartRow+r)+","+(fromStartCol+c)]=true;
      }
    }
  }

  // Collect KRAFT pixels as particles
  var particles=[];
  for(var key in kraftInfo.letterMap){
    var parts=key.split(",");
    particles.push({
      r:parseInt(parts[0]),
      c:parseInt(parts[1]),
      vy:0.5+Math.random()*1.5,
      vx:(Math.random()-0.5)*0.5,
      delay:Math.floor(Math.random()*15),
      ch:MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)],
      alive:true
    });
  }

  // Drain animation
  var pcRevealed={};
  for(var frame=0;frame<60;frame++){
    // Move KRAFT particles down
    for(var i=0;i<particles.length;i++){
      var pt=particles[i];
      if(!pt.alive)continue;
      if(frame<pt.delay)continue;

      // Erase old pos
      var oldR=Math.round(pt.r);
      var oldC=Math.round(pt.c);
      if(oldR>=1&&oldR<=H&&oldC>=0&&oldC<W){
        var oldKey=oldR+","+oldC;
        // If this position is a PASSIONCRAFT pixel, reveal it in gold
        if(pcMap[oldKey]&&!pcRevealed[oldKey]){
          pcRevealed[oldKey]=true;
          at(oldR,oldC+1);
          var depth=0;
          if(!pcMap[oldR+","+(oldC+1)])depth=1;
          if(!pcMap[(oldR+1)+","+oldC])depth=Math.max(depth,1);
          wr(goldShade(depth)+BOLD+BLOCK_SHADES[depth]);
        } else if(!pcMap[oldKey]&&!fromMap[oldKey]){
          at(oldR,oldC+1);wr(" ");
        }
        // Reveal "from" pixels
        if(fromMap[oldKey]&&!pcRevealed["f"+oldKey]){
          pcRevealed["f"+oldKey]=true;
          at(oldR,oldC+1);
          wr(rgb(140,140,160)+DIM+BLOCK_SHADES[1]);
        }
      }

      // Move
      pt.r+=pt.vy;
      pt.c+=pt.vx;
      pt.vy+=0.08; // accelerating gravity

      // Draw new pos
      var newR=Math.round(pt.r);
      var newC=Math.round(pt.c);
      if(newR>=1&&newR<=H&&newC>=0&&newC<W){
        var nKey=newR+","+newC;
        if(!pcMap[nKey]&&!pcRevealed[nKey]){
          at(newR,newC+1);
          var fade=Math.min(3,Math.floor((frame-pt.delay)/10));
          wr(greenShade(fade)+pt.ch);
        }
      }

      if(newR>H+5)pt.alive=false;
    }

    // Randomly reveal more PASSIONCRAFT pixels (glimmer effect)
    if(frame>10){
      var pcKeys=Object.keys(pcMap);
      for(var j=0;j<Math.floor(frame/3);j++){
        var rk=pcKeys[Math.floor(Math.random()*pcKeys.length)];
        if(!pcRevealed[rk]){
          pcRevealed[rk]=true;
          var pp=rk.split(",");
          at(parseInt(pp[0]),parseInt(pp[1])+1);
          wr(goldShade(0)+BOLD+BLOCK_FULL);
        }
      }
    }

    await sleep(40);
  }

  // Clean: ensure all PASSIONCRAFT visible, all drain particles gone
  for(var r=1;r<=H;r++){
    for(var c=0;c<W;c++){
      var k=r+","+c;
      if(pcMap[k]){
        at(r,c+1);
        var depth=0;
        if(!pcMap[r+","+(c+1)])depth=1;
        if(!pcMap[(r+1)+","+c])depth=Math.max(depth,1);
        wr(goldShade(depth)+BOLD+BLOCK_SHADES[depth]);
      } else if(fromMap[k]){
        at(r,c+1);
        wr(rgb(140,140,160)+BLOCK_SHADES[1]);
      } else {
        at(r,c+1);wr(" ");
      }
    }
  }

  return {pcMap:pcMap,fromMap:fromMap,pcStartRow:pcStartRow,pcStartCol:pcStartCol,pcPixels:pcPixels,fromStartRow:fromStartRow,fromStartCol:fromStartCol};
}

// ═══════════════════════════════════════════════
// PHASE 4: GOLD SHIMMER + DIAMOND DISSOLVE
// ═══════════════════════════════════════════════
async function goldShimmer(info){
  var sparkle=["\u2726","\u2727","\u2728","\u2736","\u2605","\u2606"];
  var pcKeys=Object.keys(info.pcMap);

  // Shimmer gold
  for(var f=0;f<30;f++){
    for(var i=0;i<8;i++){
      var k=pcKeys[Math.floor(Math.random()*pcKeys.length)];
      var pp=k.split(",");
      at(parseInt(pp[0]),parseInt(pp[1])+1);
      if(Math.random()>0.5){
        wr(rgb(255,255,200)+BOLD+sparkle[Math.floor(Math.random()*sparkle.length)]);
      } else {
        wr(goldShade(0)+BOLD+BLOCK_FULL);
      }
    }
    await sleep(80);
  }

  // Restore clean gold
  for(var i=0;i<pcKeys.length;i++){
    var pp=pcKeys[i].split(",");
    at(parseInt(pp[0]),parseInt(pp[1])+1);
    wr(goldShade(0)+BOLD+BLOCK_FULL);
  }
  await sleep(500);

  // Diamond dissolve — white sparkle outward
  var center_r=info.pcStartRow+3;
  var center_c=info.pcStartCol+Math.floor(info.pcPixels[0].length/2);

  for(var ring=0;ring<Math.max(W,H);ring++){
    var found=false;
    for(var i=0;i<pcKeys.length;i++){
      var pp=pcKeys[i].split(",");
      var pr=parseInt(pp[0]);
      var pc=parseInt(pp[1]);
      var dist=Math.abs(pr-center_r)+Math.abs(pc-center_c);
      if(dist>=ring&&dist<ring+2){
        found=true;
        at(pr,pc+1);
        wr(rgb(220,240,255)+BOLD+sparkle[Math.floor(Math.random()*sparkle.length)]);
      }
      if(dist>=ring-3&&dist<ring-1){
        at(pr,pc+1);
        wr(rgb(255,255,255)+DIM+"\u00B7");
      }
      if(dist<ring-4){
        at(pr,pc+1);wr(" ");
      }
    }
    // Also dissolve "from"
    var fKeys=Object.keys(info.fromMap);
    for(var i=0;i<fKeys.length;i++){
      var pp=fKeys[i].split(",");
      var pr=parseInt(pp[0]);
      var pc=parseInt(pp[1]);
      var dist=Math.abs(pr-center_r)+Math.abs(pc-center_c);
      if(dist<ring-4){at(pr,pc+1);wr(" ");}
      else if(dist>=ring&&dist<ring+2){at(pr,pc+1);wr(rgb(200,200,220)+sparkle[Math.floor(Math.random()*sparkle.length)]);}
    }
    if(!found&&ring>20)break;
    await sleep(30);
  }

  // Final clean
  await sleep(200);
  wr(CLR);
}

// ═══════════════════════════════════════════════
// FULL INTRO
// ═══════════════════════════════════════════════
async function intro(){
  wr(HIDE+CLR);
  var kraftInfo=await matrixBuildKraft();
  await flashKraft3D(kraftInfo);
  var pcInfo=await drainReveal(kraftInfo);
  await goldShimmer(pcInfo);
  wr(SHOW);
}

// ═══════════════════════════════════════════════
// AGENT ENGINE (same as before, compressed)
// ═══════════════════════════════════════════════
var TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJseW5uaGFydmV5NjBAZ21haWwuY29tIiwiZXhwIjoxNzg1MTAzMDgyLCJpYXQiOjE3NzczMjcwODJ9.mRAT0WAkNrEo6wfZcEoNmxrE5ob0WZADTMgUcL9IzAg";
var APP="69d81ac3ffa24327b49b171a",CONV="69d8858f1ea6692d59bc0ac2",MAX_DEPTH=5,MAX_OUT=15000;
var LOG_F=join(homedir(),".kraft-cli.log"),HIST_F=join(homedir(),".kraft-history.json");
var CL={reset:"\x1b[0m",bold:"\x1b[1m",dim:"\x1b[2m",red:"\x1b[31m",green:"\x1b[32m",yellow:"\x1b[33m",blue:"\x1b[34m",cyan:"\x1b[36m"};
function p(c,t){return CL[c]+t+CL.reset;}
function lg(m){try{appendFileSync(LOG_F,new Date().toISOString()+" "+m+"\n");}catch{}}
var SP=["\u28CB","\u28D9","\u28F9","\u28F8","\u28FC","\u28F4","\u28E6","\u28E7","\u28C7","\u28CF"],st=null,si=0;
function spin(m){si=0;st=setInterval(function(){process.stdout.write("\r"+CL.cyan+SP[si++%SP.length]+" "+m+CL.reset+"   ");},80);}
function unspin(){if(st){clearInterval(st);st=null;}process.stdout.write("\r"+" ".repeat(60)+"\r");}

async function ask(msg,ret){
  ret=ret||3;for(var i=0;i<ret;i++){try{var s=Date.now();var r=await fetch("https://base44.app/api/apps/"+APP+"/agents/conversations/v2/"+CONV+"/messages",{method:"POST",headers:{"Content-Type":"application/json","X-App-Id":APP,"Authorization":"Bearer "+TOKEN},body:JSON.stringify({role:"user",content:msg.substring(0,50000)}),signal:AbortSignal.timeout(120000)});var el=((Date.now()-s)/1000).toFixed(1);if(!r.ok){if(r.status===429||r.status>=500){await sleep((i+1)*3000);continue;}throw new Error("API "+r.status);}var d=await r.json();return{content:d.content||"",elapsed:el,tokens:(d.usage?d.usage.completion_tokens:0)||0};}catch(e){if(i===ret-1)throw e;await sleep((i+1)*2000);}}throw new Error("Failed");
}

var TOOLS={
  exec:function(a){var cmd=a.trim();if(!cmd)return"ERROR: empty";if(/^(rm\s+-rf\s+\/|format\s+[a-z]:|shutdown)/i.test(cmd))return"BLOCKED";try{return execSync(cmd,{encoding:"utf8",timeout:60000,cwd:process.cwd(),shell:"powershell.exe",maxBuffer:5242880}).trim().substring(0,MAX_OUT)||"(ok)";}catch(e){return"ERR "+(e.status||"?")+": "+((e.stderr||"")+(e.stdout||"")||e.message).substring(0,MAX_OUT);}},
  read:function(a){var pa=resolve(a.trim());if(!existsSync(pa))return"NOT FOUND: "+pa;var s=statSync(pa);if(s.isDirectory())return TOOLS.list(a);if(s.size>500000)return"TOO LARGE";if([".png",".jpg",".gif",".mp4",".zip",".exe",".dll",".pdf"].includes(extname(pa)))return"BINARY: "+basename(pa);return readFileSync(pa,"utf8").substring(0,MAX_OUT);},
  write:function(a){var nl=a.indexOf("\n");if(nl===-1)return"ERR: FILEPATH\\nCONTENT";var pa=resolve(a.substring(0,nl).trim());try{mkdirSync(dirname(pa),{recursive:true});writeFileSync(pa,a.substring(nl+1),"utf8");return"OK -> "+pa;}catch(e){return"ERR: "+e.message;}},
  list:function(a){var pa=resolve(a.trim()||".");if(!existsSync(pa))return"NOT FOUND";try{var it=readdirSync(pa);return pa+" ("+it.length+")\n"+it.map(function(f){try{var s=statSync(join(pa,f));return(s.isDirectory()?"D ":"  ")+f+(s.isFile()?" "+s.size+"b":"");}catch{return"  "+f;}}).join("\n");}catch(e){return"ERR: "+e.message;}},
  append:function(a){var nl=a.indexOf("\n");if(nl===-1)return"ERR";try{appendFileSync(resolve(a.substring(0,nl).trim()),a.substring(nl+1),"utf8");return"OK";}catch(e){return"ERR: "+e.message;}},
  mkdir:function(a){try{mkdirSync(resolve(a.trim()),{recursive:true});return"OK";}catch(e){return"ERR: "+e.message;}},
  cp:function(a){var p2=a.trim().split(/\s+to\s+|\s+->\s+|\s+/);try{copyFileSync(resolve(p2[0]),resolve(p2[1]));return"OK";}catch(e){return"ERR: "+e.message;}},
  mv:function(a){var p2=a.trim().split(/\s+to\s+|\s+->\s+|\s+/);try{renameSync(resolve(p2[0]),resolve(p2[1]));return"OK";}catch(e){return"ERR: "+e.message;}},
  rm:function(a){try{unlinkSync(resolve(a.trim()));return"OK";}catch(e){return"ERR: "+e.message;}},
  find:function(a){var p2=a.trim().split(/\s+/);var dir=resolve(p2[0]||".");var re=new RegExp(p2[1]||".","i");var res=[];function w(d,dep){if(dep>5||res.length>100)return;try{readdirSync(d).forEach(function(f){if(f==="node_modules"||f===".git")return;var full=join(d,f);if(re.test(f))res.push(full);try{if(statSync(full).isDirectory())w(full,dep+1);}catch{}});}catch{}}w(dir,0);return res.join("\n")||"None";},
  grep:function(a){var m=a.trim().match(/^(\S+)\s+in\s+(.+)$/)||a.trim().match(/^(\S+)\s+(.+)$/);if(!m)return"ERR: PATTERN in DIR";var re=new RegExp(m[1],"ig");var dir=resolve(m[2]);var res=[];function s(d,dep){if(dep>4||res.length>50)return;try{readdirSync(d).forEach(function(f){if(f==="node_modules"||f===".git")return;var full=join(d,f);try{var st=statSync(full);if(st.isDirectory())s(full,dep+1);else if(st.isFile()&&st.size<200000){readFileSync(full,"utf8").split("\n").forEach(function(l,i){if(re.test(l))res.push(full+":"+(i+1)+": "+l.trim().substring(0,200));});}}catch{}});}catch{}}s(dir,0);return res.join("\n").substring(0,MAX_OUT)||"None";},
  patch:function(a){var lines=a.trim().split("\n");if(lines.length<3)return"ERR";var pa=resolve(lines[0]);if(!existsSync(pa))return"NOT FOUND";try{var c=readFileSync(pa,"utf8");if(!c.includes(lines[1]))return"SEARCH NOT FOUND";writeFileSync(pa,c.replace(lines[1],lines.slice(2).join("\n")),"utf8");return"PATCHED";}catch(e){return"ERR: "+e.message;}}
};

function extractT(t){var re=/<<<TOOL:(\w+)\s([\s\S]*?)>>>/g;var c=[];var m;while((m=re.exec(t))!==null)c.push({tool:m[1].toLowerCase(),args:m[2]});return c;}
function runT(c){return c.map(function(x){var fn=TOOLS[x.tool];if(!fn)return{tool:x.tool,args:x.args,result:"UNKNOWN TOOL",ms:0};var s=Date.now();return{tool:x.tool,args:x.args,result:fn(x.args),ms:Date.now()-s};});}
function cln(t){return t.replace(/<<<TOOL:\w+\s[\s\S]*?>>>/g,"").trim();}

var hist=[];try{hist=JSON.parse(readFileSync(HIST_F,"utf8"));}catch{}
function saveH(i){hist.push({t:Date.now(),q:i});if(hist.length>200)hist=hist.slice(-200);try{writeFileSync(HIST_F,JSON.stringify(hist),"utf8");}catch{}}

var SYS="You are Kraft-01, CLI agent. CWD: "+process.cwd()+"\nTOOLS (output EXACTLY): <<<TOOL:exec CMD>>> <<<TOOL:read PATH>>> <<<TOOL:write PATH\\nCONTENT>>> <<<TOOL:append PATH\\nCONTENT>>> <<<TOOL:list DIR>>> <<<TOOL:mkdir DIR>>> <<<TOOL:cp S D>>> <<<TOOL:mv S D>>> <<<TOOL:rm PATH>>> <<<TOOL:find DIR PAT>>> <<<TOOL:grep PAT in DIR>>> <<<TOOL:patch PATH\\nSEARCH\\nREPLACE>>>\nMultiple tools OK. Be direct.";
var primed=false;
var BIN={exit:function(){process.exit(0);},quit:function(){process.exit(0);},cd:function(a){try{process.chdir(resolve(a.trim()||homedir()));console.log(p("green","-> "+process.cwd()));}catch(e){console.log(p("red",e.message));}},pwd:function(){console.log(process.cwd());},ls:function(a){console.log(TOOLS.list(a||"."));},clear:function(){wr(CLR);},help:function(){console.log(p("yellow","\n  KRAFT-CLI v2.0 | exit cd pwd ls clear !CMD history\n  All else -> AI\n"));},"history":function(){hist.slice(-20).forEach(function(h){console.log(p("dim",new Date(h.t).toLocaleTimeString())+" "+h.q);});}};

var rl=createInterface({input:process.stdin,output:process.stdout,terminal:true});

async function loop(input){
  var msg=primed?input:SYS+"\n---\nUser: "+input;primed=true;
  spin("thinking");var resp;
  try{resp=await ask(msg);}catch(e){unspin();console.log(p("red","x "+e.message));return;}unspin();
  var text=resp.content;var depth=0;
  while(depth<MAX_DEPTH){
    var calls=extractT(text);if(!calls.length)break;
    var cl=cln(text);if(cl)console.log("\n"+p("yellow",cl));
    var results=runT(calls);
    results.forEach(function(r){
      console.log("\n  "+(r.result.startsWith("ERR")?p("red","x"):p("green","v"))+" "+p("cyan",r.tool)+" "+p("dim",r.args.split("\n")[0].substring(0,60)+" "+r.ms+"ms"));
      console.log(r.result.substring(0,3000));
    });
    depth++;if(depth>=MAX_DEPTH)break;
    var rpt=results.map(function(r){return"["+r.tool+"]: "+r.result;}).join("\n\n");
    spin("processing");
    try{resp=await ask("Results:\n"+rpt.substring(0,30000));unspin();text=resp.content;}catch(e){unspin();break;}
  }
  var fin=cln(text);if(fin)console.log("\n"+p("yellow",fin));
  console.log(p("dim","  "+resp.elapsed+"s / "+resp.tokens+"tok\n"));
}

function prompt(){
  rl.question(p("cyan","kraft")+p("dim",":")+p("blue",basename(process.cwd()))+p("cyan","> "),async function(input){
    input=input.trim();if(!input)return prompt();saveH(input);
    if(input.startsWith("!")){console.log(TOOLS.exec(input.substring(1)));return prompt();}
    var cmd=input.split(" ")[0].toLowerCase();
    if(BIN[cmd]){BIN[cmd](input.split(" ").slice(1).join(" "));return prompt();}
    await loop(input);prompt();
  });
}

async function main(){
  if(process.argv.includes("--skip-intro")){
    console.log(rgb(255,215,0)+BOLD+"\n  KRAFT-CLI v2.0"+RST);
    console.log(rgb(140,140,160)+"  from "+rgb(255,215,0)+BOLD+"PASSIONCRAFT"+RST+"\n");
    prompt();
  } else {
    await intro();
    console.log(rgb(255,215,0)+BOLD+"\n  KRAFT-CLI v2.0"+RST);
    console.log(rgb(140,140,160)+"  from "+rgb(255,215,0)+BOLD+"PASSIONCRAFT"+RST);
    console.log(CL.dim+"  "+process.cwd()+CL.reset+"\n");
    prompt();
  }
}
main();
