/* AMR browser/Android neural client.
   Sends a WAV Blob to the PC neural server and returns a restored WAV Blob.
   Default server port is the same value used by shared/amr-config.json.
*/
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
    const r = await fetch(base(baseUrl) + '/restore', {
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

  return {health, restore, DEFAULT_SERVER};
})();
