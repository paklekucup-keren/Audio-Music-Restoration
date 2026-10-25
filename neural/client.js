/* AMR browser-side neural client.
   This is intentionally separate from the DSP renderer. It sends a WAV Blob
   to the PC neural server and returns a WAV Blob. The UI can call
   restoreWithNeural(blob, 'http://PC-IP:8765/restore').
*/
window.AMRNeural = (() => {
  async function health(baseUrl) {
    const r = await fetch(baseUrl.replace(/\/$/, '') + '/health');
    if (!r.ok) throw new Error('Neural server unavailable (' + r.status + ')');
    return r.json();
  }

  async function restore(wavBlob, baseUrl, onProgress) {
    if (!(wavBlob instanceof Blob)) throw new Error('Neural input must be a WAV Blob.');
    if (onProgress) onProgress(10, 'Connecting to neural server…');
    const r = await fetch(baseUrl.replace(/\/$/, '') + '/restore', {
      method: 'POST',
      headers: {'Content-Type': 'audio/wav'},
      body: wavBlob
    });
    if (onProgress) onProgress(75, 'Receiving neural restoration…');
    if (!r.ok) {
      let msg = 'Neural restoration failed (' + r.status + ')';
      try { const j = await r.json(); if (j.error) msg += ': ' + j.error; } catch (_) {}
      throw new Error(msg);
    }
    const out = await r.blob();
    if (onProgress) onProgress(100, 'Neural restoration complete.');
    return out;
  }

  return {health, restore};
})();
