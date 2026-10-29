/** Search and selection helpers shared by the UI and data integrity tests. */
export const titleCase = (value) =>
  value ? value[0].toUpperCase() + value.slice(1) : "";
export const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function searchConcepts(concepts, query, limit = 40) {
  const aliases = {
    lungs: "lung",
    kidneys: "kidney",
    bones: "bone",
    muscles: "muscle",
    nerves: "nerve",
    windpipe: "trachea",
    thighbone: "femur",
    backbone: "vertebra",
  };
  const raw = query.trim().toLowerCase();
  const q = aliases[raw] || raw;
  if (!q) return [];
  const words = q.split(/\s+/);
  return concepts
    .map((c) => {
      const n = c.name.toLowerCase();
      let score =
        n === q
          ? 1000
          : n.startsWith(q)
            ? 500
            : n.includes(q)
              ? 300
              : words.every((w) => n.includes(w))
                ? 100
                : 0;
      if (c.id.toLowerCase() === q) score = 1000;
      return { c, score: score ? score - Math.min(n.length, 90) * 0.1 : 0 };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name))
    .slice(0, limit)
    .map((r) => r.c);
}
export function resolveConcept(concepts, query) {
  return (
    concepts.find((c) => c.name.toLowerCase() === query.toLowerCase()) ||
    searchConcepts(concepts, query, 1)[0]
  );
}
