import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { SYSTEMS, LESSONS, QUIZ, organInfo } from "../docs/content.js";
import { searchConcepts, resolveConcept, escapeHTML } from "../docs/catalog.js";
const assets = new URL("../docs/assets/anatomy/", import.meta.url);
const catalog = JSON.parse(fs.readFileSync(new URL("catalog.json", assets)));
const ids = new Set(catalog.meshes.map((m) => m.id));
test("atlas has unique meshes, valid concept references and all 11 systems", () => {
  assert.equal(ids.size, catalog.meshes.length);
  assert.equal(ids.size, 2234);
  assert.equal(SYSTEMS.length, 11);
  assert.equal(
    new Set(catalog.concepts.map((c) => c.id)).size,
    catalog.concepts.length,
  );
  for (const system of SYSTEMS) {
    assert.ok(catalog.files[system.id]);
    assert.ok(catalog.meshes.some((m) => m.system === system.id));
  }
  for (const c of catalog.concepts) {
    assert.ok(c.name.length);
    for (const id of c.meshes) assert.ok(ids.has(id), `${c.id}: unknown ${id}`);
  }
});
for (const [system, file] of Object.entries(catalog.files))
  test(`${system}: compressed geometry checksum, indices, finite positions, bounds`, () => {
    const compressed = fs.readFileSync(new URL(file.file, assets));
    assert.equal(compressed.length, file.bytes);
    assert.equal(
      createHash("sha256").update(compressed).digest("hex"),
      file.sha256,
    );
    const data = gunzipSync(compressed);
    assert.equal(data.length, file.decodedBytes);
    let end = 0;
    for (const m of catalog.meshes.filter((m) => m.system === system)) {
      assert.equal(m.offset, end);
      assert.equal(m.indices % 3, 0);
      assert.ok(m.vertices > 0 && m.indices > 0);
      end = m.offset + m.vertices * 12 + m.indices * 4;
      assert.ok(end <= data.length);
      for (let v = 0; v < m.vertices; v++)
        for (let d = 0; d < 3; d++) {
          const p = data.readFloatLE(m.offset + v * 12 + d * 4);
          assert.ok(Number.isFinite(p));
          assert.ok(p >= m.bounds[0][d] - 0.002 && p <= m.bounds[1][d] + 0.002);
        }
      for (let i = 0; i < m.indices; i++)
        assert.ok(
          data.readUInt32LE(m.offset + m.vertices * 12 + i * 4) < m.vertices,
          `${m.id}: invalid index`,
        );
    }
    assert.equal(end, data.length);
  });
test("every guided tour and quiz target resolves to an exact anatomical concept", () => {
  const targets = [...LESSONS.flatMap((l) => l.steps), ...QUIZ];
  for (const t of targets) {
    const found = resolveConcept(catalog.concepts, t.query);
    assert.ok(found, `Missing ${t.query}`);
    assert.equal(found.name.toLowerCase(), t.query.toLowerCase());
    for (const id of t.systems) assert.ok(SYSTEMS.some((s) => s.id === id));
  }
  for (const q of QUIZ) {
    assert.ok(q.answer >= 0 && q.answer < q.options.length);
    assert.ok(q.explanation.length > 15);
  }
});
test("search ranks exact organs first, handles synonyms, IDs, and empty results", () => {
  for (const n of ["heart", "brain", "liver", "right kidney", "pancreas"])
    assert.equal(searchConcepts(catalog.concepts, n)[0].name, n);
  assert.equal(searchConcepts(catalog.concepts, "FMA7088")[0].name, "heart");
  assert.equal(searchConcepts(catalog.concepts, "windpipe")[0].name, "trachea");
  assert.deepEqual(searchConcepts(catalog.concepts, "not-a-real-organ"), []);
  assert.deepEqual(searchConcepts(catalog.concepts, " "), []);
  assert.ok(searchConcepts(catalog.concepts, "artery", 10).length <= 10);
});
test("key tissues are grouped by structure, rather than misleading compound membership", () => {
  const expected = {
    FJ2816: "digestive",
    FJ3094: "digestive",
    FJ1368: "nervous",
    FJ1317: "nervous",
    FJ1742: "nervous",
    FJ2810: "integumentary",
    FJ3212: "skeletal",
  };
  for (const [id, system] of Object.entries(expected))
    assert.equal(catalog.meshes.find((m) => m.id === id).system, system, id);
  for (const m of catalog.meshes)
    if (/\b(artery|arteries|vein|veins)\b/.test(m.name))
      assert.equal(m.system, "cardiovascular", m.name);
});
test("educational descriptions provide sources and renderable text", () => {
  for (const s of SYSTEMS) {
    const info = organInfo(s.name, s.id);
    assert.equal(info.functions.length, 3);
    assert.ok(info.source.startsWith("https://"));
  }
  assert.equal(escapeHTML("<script>\"&'"), "&lt;script&gt;&quot;&amp;&#39;");
});
