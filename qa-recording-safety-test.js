'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const safety = require('./recording-safety.js');

const { MAX_RECORDING_BYTES, RECORDING_RIGHTS_APPROVED, canAppendChunk } = safety;
assert.equal(MAX_RECORDING_BYTES, 32 * 1024 * 1024);
assert.equal(RECORDING_RIGHTS_APPROVED, false);
assert.equal(Object.isFrozen(safety), true);
assert.equal(canAppendChunk(0, 1), true);
assert.equal(canAppendChunk(0, MAX_RECORDING_BYTES), true);
assert.equal(canAppendChunk(MAX_RECORDING_BYTES - 1, 1), true);
assert.equal(canAppendChunk(MAX_RECORDING_BYTES, 1), false);
assert.equal(canAppendChunk(0, MAX_RECORDING_BYTES + 1), false);
assert.equal(canAppendChunk(-1, 1), false);
assert.equal(canAppendChunk(0, -1), false);
assert.equal(canAppendChunk(0, 1.5), false);
assert.equal(canAppendChunk(Number.NaN, 1), false);
assert.equal(canAppendChunk(0, Number.POSITIVE_INFINITY), false);

const safetySource = fs.readFileSync('./recording-safety.js', 'utf8');
const browserContext = { window: {} };
vm.runInNewContext(safetySource, browserContext);
assert.equal(browserContext.window.GrifflistRecordingSafety.MAX_RECORDING_BYTES, MAX_RECORDING_BYTES);
assert.equal(browserContext.window.GrifflistRecordingSafety.RECORDING_RIGHTS_APPROVED, false);
assert.equal(Object.isFrozen(browserContext.window.GrifflistRecordingSafety), true);
assert.equal(browserContext.window.GrifflistRecordingSafety.canAppendChunk(MAX_RECORDING_BYTES - 1, 1), true);

const html = fs.readFileSync('./watch-live.html', 'utf8');
const safetyScript = html.indexOf('recording-safety.js?v=rights-gate-1');
const liveScript = html.indexOf('live-show.js?v=grifflist-v31');
assert.ok(safetyScript >= 0 && liveScript > safetyScript, 'recording safety must load before the viewer');
assert.match(html, /32 MiB[^<]*permission|permission[^<]*32 MiB/i);
assert.match(html, /id="recording-mode"[^>]*disabled/);
assert.match(html, /id="recording-start"[^>]*disabled/);
assert.match(html, /Recording is disabled until the owner confirms/i);

const live = fs.readFileSync('./live-show.js', 'utf8');
assert.ok(live.includes('recordingSafety.canAppendChunk(recordingBytes,e.data.size)'));
assert.ok(live.includes('recordingLimitReached'));
assert.ok(live.includes('recordingRightsApproved=recordingSafety?.RECORDING_RIGHTS_APPROVED===true'));
assert.ok(live.includes('if(!recordingRightsApproved)'));
assert.ok(live.includes("recordingRightsApproved&&Boolean(window.MediaRecorder)&&Boolean(room&&room.state==='connected')"));
assert.ok(!live.includes("recordStart.disabled=!(recordingSafety&&room&&room.state==='connected')"));
assert.ok(live.includes('toFixed(1)} MiB).'));
assert.ok(!live.includes('if(e.data&&e.data.size)recordingChunks.push(e.data);'));

const sw = fs.readFileSync('./sw.js', 'utf8');
const cacheMatch = sw.match(/^const CACHE = '([^']+)';$/m);
assert.ok(cacheMatch, 'service worker must declare exactly one cache generation');
assert.match(cacheMatch[1], /^grifflist-livekit-offline-v\d+$/);
const coreMatch = sw.match(/^const CORE = \[([\s\S]*?)^\];/m);
assert.ok(coreMatch, 'service worker must declare its public precache shell');
assert.ok(coreMatch[1].includes("'./recording-safety.js?v=rights-gate-1'"));
assert.ok(coreMatch[1].includes("'./live-show.js?v=grifflist-v31'"));
console.log('Bounded live recording safety and rights gate: 33 assertions passed.');
