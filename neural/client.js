/* AMR browser/Android neural + export client. */
window.AMRNeural = (() => {
  const DEFAULT_SERVER = 'http://127.0.0.1:8787';
  const base = url => (url || DEFAULT_SERVER).replace(/\/$/, '');

  async function health(baseUrl) {
    const r = await fetch(base(baseUrl) + '/health', {cache: 'no-store'});
    if (!r.ok) throw new Error('Neural server unavailable (' + r.status + ')');
    return r.json();
  }

  async function restore(wavBlob, baseUrl, onProgress) {
    if (!(wavBlob instanceof Blob)) throw new Error('Neural input must be a WAV Blob.');
    if (onProgress) onProgress(10, 'Connecting to neural server…');
    const r = await fetch(base(baseUrl) + '/restore', {method:'POST',headers:{'Content-Type':'audio/wav'},body:wavBlob});
    if (onProgress) onProgress(75, 'Receiving neural restoration…');
    if (!r.ok) { let msg='Neural restoration failed ('+r.status+')'; try {const j=await r.json();if(j.error)msg+=': '+j.error;}catch(_){} throw new Error(msg); }
    const out=await r.blob(); if(onProgress)onProgress(100,'Neural restoration complete.'); return out;
  }

  async function mp3(wavBlob, bitrate, baseUrl, onProgress) {
    if (![128,192,256,320].includes(Number(bitrate))) throw new Error('Unsupported MP3 bitrate.');
    if (onProgress) onProgress(10, 'Encoding MP3 '+bitrate+' kbps…');
    const r=await fetch(base(baseUrl)+'/encode-mp3?bitrate='+Number(bitrate),{method:'POST',headers:{'Content-Type':'audio/wav'},body:wavBlob});
    if(!r.ok){let msg='MP3 export failed ('+r.status+')';try{const j=await r.json();if(j.error)msg+=': '+j.error;}catch(_){}throw new Error(msg);}
    const out=await r.blob();if(onProgress)onProgress(100,'MP3 '+bitrate+' kbps ready.');return out;
  }

  return {health,restore,mp3,DEFAULT_SERVER};
})();

/* AMR Manual Clipping Repair.
   This module is intentionally independent from the neural engine. It adds a real
   manual repair path for the Android/browser build without pretending clipped
   samples can be perfectly reconstructed. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const dbToAmp = d => Math.pow(10, d/20);
  const ampToDb = a => a <= 1e-9 ? -120 : 20*Math.log10(a);
  const inject = () => {
    if (!$('repairClip') || $('amrManualClipPanel')) return;
    const autoBtn = $('repairClip');
    const panel = document.createElement('div');
    panel.id='amrManualClipPanel';
    panel.style.cssText='margin-top:9px;padding:10px;border:1px solid #293b4e;border-radius:8px;background:#071019';
    panel.innerHTML=`
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap">
        <b style="font-size:12px">CLIPPING REPAIR MODE</b>
        <span id="amrClipMode" class="pill">AUTO</span>
      </div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px">
        <button id="amrAutoMode">AUTO DETECTION</button>
        <button id="amrManualMode">MANUAL</button>
      </div>
      <div id="amrManualControls" style="display:none;margin-top:8px">
        <div style="font-size:11px;color:#91a5b9;margin-bottom:6px">Manual repair works on the selected source and creates a new working WAV. Original file is preserved.</div>
        <label style="display:block;font-size:11px">Detection threshold <output id="amrThrV">-0.1 dBFS</output></label>
        <input id="amrThr" type="range" min="-6" max="-0.01" step="0.01" value="-0.1" style="width:100%">
        <label style="display:block;font-size:11px;margin-top:7px">Repair strength <output id="amrStrV">65%</output></label>
        <input id="amrStr" type="range" min="0" max="100" value="65" style="width:100%">
        <label style="display:block;font-size:11px;margin-top:7px">Output ceiling <output id="amrCeilV">-1.0 dBFS</output></label>
        <input id="amrCeil" type="range" min="-6" max="-0.2" step="0.1" value="-1" style="width:100%">
        <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px">
          <button id="amrManualAnalyze">ANALYZE CLIPPING</button>
          <button id="amrManualApply" class="danger" disabled>APPLY MANUAL REPAIR</button>
          <button id="amrManualReset">RESET</button>
        </div>
        <div id="amrManualStatus" class="status" style="margin-top:7px">Manual mode ready.</div>
      </div>`;
    autoBtn.parentElement.appendChild(panel);

    const mode = $('amrClipMode'), controls=$('amrManualControls');
    const setMode = m => { mode.textContent=m; controls.style.display=m==='MANUAL'?'block':'none'; };
    $('amrAutoMode').onclick=()=>setMode('AUTO');
    $('amrManualMode').onclick=()=>setMode('MANUAL');
    $('amrThr').oninput=e=>$('amrThrV').textContent=Number(e.target.value).toFixed(2)+' dBFS';
    $('amrStr').oninput=e=>$('amrStrV').textContent=e.target.value+'%';
    $('amrCeil').oninput=e=>$('amrCeilV').textContent=Number(e.target.value).toFixed(1)+' dBFS';

    const getFile=()=> $('file') && $('file').files && $('file').files[0];
    let originalFile=null, lastClipCount=0;
    $('amrManualAnalyze').onclick=async()=>{
      const f=getFile();
      if(!f){$('amrManualStatus').textContent='Pilih audio terlebih dahulu.';return;}
      try{
        $('amrManualStatus').textContent='Analyzing clipping…';
        const ac=new(window.AudioContext||window.webkitAudioContext)();
        const b=await ac.decodeAudioData(await f.arrayBuffer());
        const threshold=dbToAmp(Number($('amrThr').value));
        let count=0,total=0,peak=0;
        for(let c=0;c<b.numberOfChannels;c++){
          const d=b.getChannelData(c); total+=d.length;
          for(let i=0;i<d.length;i++){const a=Math.abs(d[i]);if(a>peak)peak=a;if(a>=threshold)count++;}
        }
        lastClipCount=count;
        $('amrManualApply').disabled=count===0;
        $('amrManualStatus').textContent=`Detected ${count.toLocaleString()} samples at/above ${Number($('amrThr').value).toFixed(2)} dBFS · peak ${ampToDb(peak).toFixed(2)} dBFS`;
        ac.close();
      }catch(e){$('amrManualStatus').textContent='Manual analysis failed: '+e.message;}
    };

    $('amrManualApply').onclick=async()=>{
      const f=getFile();
      if(!f||!lastClipCount){$('amrManualStatus').textContent='Analyze clipping first.';return;}
      try{
        $('amrManualStatus').textContent='Applying manual repair…';
        const ac=new(window.AudioContext||window.webkitAudioContext)();
        const b=await ac.decodeAudioData(await f.arrayBuffer());
        originalFile=originalFile||f;
        const threshold=dbToAmp(Number($('amrThr').value));
        const strength=Number($('amrStr').value)/100;
        const ceiling=dbToAmp(Number($('amrCeil').value));
        const out=ac.createBuffer(b.numberOfChannels,b.length,b.sampleRate);
        for(let c=0;c<b.numberOfChannels;c++){
          const s=b.getChannelData(c),d=out.getChannelData(c);
          for(let i=0;i<s.length;i++){
            const x=s[i], a=Math.abs(x);
            if(a>=threshold){
              const sign=x<0?-1:1;
              const excess=clamp((a-threshold)/(1-threshold),0,1);
              const softened=threshold+(1-threshold)*Math.tanh(excess*(1+strength*4));
              d[i]=sign*clamp(a*(1-strength)+softened*strength,0,ceiling);
            } else d[i]=clamp(x,-ceiling,ceiling);
          }
        }
        const blob=audioBufferToWav(out,24);
        const repaired=new File([blob],f.name.replace(/\.[^.]+$/,'')+'_manual_clip_repair.wav',{type:'audio/wav'});
        const input=$('file');
        if(window.DataTransfer){const dt=new DataTransfer();dt.items.add(repaired);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));}
        const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=repaired.name;a.textContent='DOWNLOAD MANUAL REPAIR';a.style.cssText='display:inline-block;margin-top:7px;color:#58dbe8;font-weight:800';
        const old=$('amrManualDownload');if(old)old.remove();a.id='amrManualDownload';$('amrManualStatus').appendChild(document.createElement('br'));$('amrManualStatus').appendChild(a);
        $('amrManualStatus').firstChild.textContent='Manual repair complete. Working source updated; original preserved.';
        ac.close();
      }catch(e){$('amrManualStatus').textContent='Manual repair failed: '+e.message;}
    };
    $('amrManualReset').onclick=()=>{setMode('AUTO');$('amrManualStatus').textContent='Manual mode reset.';$('amrManualApply').disabled=true;lastClipCount=0;};
  };

  function audioBufferToWav(buffer,bits){
    const ch=buffer.numberOfChannels, rate=buffer.sampleRate, bps=bits/8, frames=buffer.length;
    const block=ch*bps, dataSize=frames*block, ab=new ArrayBuffer(44+dataSize), v=new DataView(ab);
    const ws=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
    ws(0,'RIFF');v.setUint32(4,36+dataSize,true);ws(8,'WAVE');ws(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,rate,true);v.setUint32(28,rate*block,true);v.setUint16(32,block,true);v.setUint16(34,bits,true);ws(36,'data');v.setUint32(40,dataSize,true);
    let p=44;
    for(let i=0;i<frames;i++)for(let c=0;c<ch;c++){
      const x=clamp(buffer.getChannelData(c)[i],-1,1);
      if(bits===24){const q=Math.round(x*8388607);v.setUint8(p,q&255);v.setUint8(p+1,(q>>8)&255);v.setUint8(p+2,(q>>16)&255);p+=3;}
      else {v.setInt16(p,Math.round(x*32767),true);p+=2;}
    }
    return new Blob([ab],{type:'audio/wav'});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',inject); else setTimeout(inject,0);
})();
