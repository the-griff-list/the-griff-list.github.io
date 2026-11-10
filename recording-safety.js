(function attachRecordingSafety(root) {
  'use strict';

  const MAX_RECORDING_BYTES = 32 * 1024 * 1024;

  function canAppendChunk(currentBytes, chunkBytes) {
    return Number.isSafeInteger(currentBytes) &&
      currentBytes >= 0 &&
      Number.isSafeInteger(chunkBytes) &&
      chunkBytes > 0 &&
      currentBytes <= MAX_RECORDING_BYTES - chunkBytes;
  }

  const api = Object.freeze({ MAX_RECORDING_BYTES, canAppendChunk });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.GrifflistRecordingSafety = api;
})(typeof window !== 'undefined' ? window : globalThis);
