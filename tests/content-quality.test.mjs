import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {translator} from '../scripts/localization.mjs';
import {auditTranslations, translationProblems} from '../scripts/audit-translations.mjs';
import {inspectDownloads} from '../scripts/audit-downloads.mjs';
import {downloadInfo, isSampleDownload} from '../src/lib/downloads.mjs';

const zh = translator('zh', {strict:true}), tr = translator('tr', {strict:true});

test('changing countdown descriptors and preparation deadlines remain translated', () => {
  for (const days of [1, 3, 14, 30, 999]) {
    assert.equal(zh(`The fifth international construction exhibition · in ${days} d`), `第五届国际建筑展览会 · ${days}天后`);
    assert.equal(tr(`The fifth international construction exhibition · in ${days} d`), `Beşinci uluslararası inşaat fuarı · ${days} gün sonra`);
    assert.equal(zh(`${days} days ahead`), `${days}天前`);
    assert.equal(tr(`${days} days out`), `${days} gün önce`);
    assert.equal(zh(`${days} days after`), `${days}天后`);
    assert.equal(tr(`${days} days after`), `${days} gün sonra`);
    assert.equal(zh(`day ${days}`), `第${days}天`);
    assert.equal(tr(`day ${days}`), `${days}. gün`);
  }
  assert.equal(zh('90–60 days ahead'), '90–60天前');
  assert.equal(tr('25–14 days ahead'), '25–14 gün önce');
  assert.equal(zh('30 days.'), '30天。');
  assert.throws(()=>zh('An unknown event description · in 45 d'), /Missing zh translation/);
});

test('critical prices, market scale, electrical units and trade-show terms preserve meaning', () => {
  assert.equal(zh('$58–78 billion'), '580亿至780亿美元');
  assert.equal(zh('125 M consumers in the region'), '区域内1.25亿消费者');
  assert.equal(zh('700 kW · 220 / 380 V'), '700 kW · 220 / 380 V');
  assert.equal(zh('55″ screen'), '55英寸屏幕');
  assert.equal(zh('10–16 people'), '10–16人');
  assert.equal(zh('38 premium stands left'), '剩余38个优选展位');
  assert.match(tr('A programme, not only stands'), /Stantların/);
  assert.equal(tr('Greenhouses'), 'Seralar');
  assert.equal(tr('BUILD PRO EXPO 2024 catalogue'), 'BUILD PRO EXPO 2024 katılımcı kataloğu');
});

test('effective catalogs contain no detected corruption or generated repetition', () => {
  assert.deepEqual(auditTranslations().problems, []);
  assert.ok(translationProblems('day 1', '第1天第1天第1天第1天').length);
  assert.ok(translationProblems('Read →', '读 ⁇').length);
  assert.ok(translationProblems('Short', 'x'.repeat(170)).length);
  assert.deepEqual(translationProblems('FOODERA EXPO 2026', 'FOODERA EXPO 2026'), []);
});

test('download metadata is consistent and cannot bless a placeholder as a final PDF', () => {
  const inventory = JSON.parse(readFileSync('src/data/downloads.json','utf8'));
  assert.deepEqual(inspectDownloads('public', inventory).errors, []);
  const root = mkdtempSync(join(tmpdir(), 'sof-downloads-'));
  try {
    mkdirSync(join(root,'files'));
    const content = '%PDF-1.4\nThis file is a placeholder in the repository build.\n%%EOF';
    writeFileSync(join(root,'files','sample.pdf'), content);
    const sample = {'/files/sample.pdf': {status:'placeholder', language:'en'}};
    assert.equal(inspectDownloads(root, sample).pending.length, 1);
    assert.deepEqual(inspectDownloads(root, sample).errors, []);
    assert.match(inspectDownloads(root, {'/files/sample.pdf':{status:'ready',language:'en'}}).errors.join(), /still contains/);
    assert.match(inspectDownloads(root, {}).errors.join(), /no publication metadata/);
    assert.match(inspectDownloads(root, {'/files/missing.pdf':{status:'ready',language:'en'}}).errors.join(), /missing/);
    assert.match(inspectDownloads(root, {'/files/../../outside.pdf':{status:'ready',language:'en'}}).errors.join(), /invalid inventory path/);
  } finally { rmSync(root, {recursive:true, force:true}); }
});

test('download status applies only to explicitly owned assets, including query and fragment variants', () => {
  assert.ok(downloadInfo('/files/sof-expo-regulations.pdf'));
  assert.deepEqual(downloadInfo('https://foodera.sofexpo.org/files/sof-expo-regulations.pdf?v=2#page=1'), downloadInfo('/files/sof-expo-regulations.pdf'));
  assert.equal(downloadInfo('https://sofexpo.org.evil.example/files/sof-expo-regulations.pdf'), undefined);
  assert.equal(downloadInfo('/files/not-registered.pdf'), undefined);
  assert.equal(isSampleDownload('mailto:info@sofexpo.org'), false);
});
