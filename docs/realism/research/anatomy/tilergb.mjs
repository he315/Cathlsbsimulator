import { writePng } from "./img.mjs";
import fs from "node:fs"; import zlib from "node:zlib";
function readRgb(p){const d=fs.readFileSync(p);let off=8,w,h;const idat=[];while(off<d.length){const len=d.readUInt32BE(off),type=d.toString("ascii",off+4,off+8),data=d.subarray(off+8,off+8+len);if(type==="IHDR"){w=data.readUInt32BE(0);h=data.readUInt32BE(4);}else if(type==="IDAT")idat.push(data);off+=12+len;}
const raw=zlib.inflateSync(Buffer.concat(idat));const out=new Uint8Array(w*h*3);for(let y=0;y<h;y++)for(let x=0;x<w*3;x++)out[y*w*3+x]=raw[y*(w*3+1)+1+x];return {w,h,px:out};}
const [o,...fs2]=process.argv.slice(2);const ims=fs2.map(readRgb);const W=1024,H=512*Math.ceil(ims.length/2);const px=new Uint8Array(W*H*3);
ims.forEach((im,k)=>{const ox=(k%2)*512,oy=Math.floor(k/2)*512;for(let y=0;y<512;y++)for(let x=0;x<512*3;x++)px[((oy+y)*W+ox)*3+x]=im.px[y*512*3+x];});writePng(o,W,H,px,3);
