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
