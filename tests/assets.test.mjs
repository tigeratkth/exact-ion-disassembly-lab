import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const model = JSON.parse(
  fs.readFileSync(new URL('../lib/data/model.json', import.meta.url)),
);
const catalogue = JSON.parse(
  fs.readFileSync(new URL('../lib/data/catalogue.json', import.meta.url)),
);
const glb = fs.readFileSync(
  new URL('../public/models/tool.glb', import.meta.url),
);
const data = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)));
test('the shipped model includes every independent source mesh and unique selection ID', () => {
  assert.equal(glb.readUInt32LE(0), 0x46546c67);
  assert.equal(glb.readUInt32LE(8), glb.length);
  const nodes = data.nodes.filter((n) => n.mesh !== undefined);
  assert.equal(nodes.length, 34);
  assert.equal(nodes.length, model.meshes.length);
  assert.equal(new Set(nodes.map((n) => n.extras.cadId)).size, 34);
  for (const node of nodes) {
    const source = model.meshes.find((p) => p.id === node.extras.cadId);
    assert.ok(source);
    assert.deepEqual(node.translation, source.centroid);
    assert.ok(node.translation.every(Number.isFinite));
  }
});
test('the service catalogue has no lost entries or duplicated part numbers', () => {
  assert.equal(catalogue.parts.length, 36);
  assert.equal(new Set(catalogue.parts.map((p) => p.partNumber)).size, 36);
  assert.equal(catalogue.counts.physicalComponentCount, null);
  assert.equal(
    catalogue.parts.find((p) => p.partNumber === '2603490018').quantity,
    9,
  );
  const battery = catalogue.parts.filter((p) => p.positions.includes('91'));
  assert.equal(battery.length, 2);
  assert.ok(battery.every((p) => p.category === 'variant'));
});
test('unavailable motor and gearbox meshes are never given fabricated exact mappings', () => {
  for (const number of ['3607030488', '3607031862']) {
    const item = catalogue.parts.find((p) => p.partNumber === number);
    assert.ok(item);
    assert.equal(item.cadExactMatchHints.namePrefixes.length, 0);
  }
});
