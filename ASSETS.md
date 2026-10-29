# Asset provenance

## Anatomy

Source: [BodyParts3D / Anatomography official archive](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), Database Center for Life Science (DBCLS), version 4.0, IS-A mesh archive, 99% polygon-reduction release.

Required attribution: **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.**

License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), as stated in the [official README, license update February 25, 2025](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html). Some older mirrors still show the previous license; this project downloads directly from the official archive and follows its updated terms. No endorsement by DBCLS is implied.

Research citation: Mitsuhashi N, Fujieda K, Tamura T, Kawamoto S, Takagi T, Okubo K. *BodyParts3D: 3D structure database for anatomical concepts.* Nucleic Acids Research, 37(Database issue), D782–D785. [doi:10.1093/nar/gkn613](https://doi.org/10.1093/nar/gkn613).

Original sources under `https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/`:

- `isa_BP3D_4.0_obj_99.zip`
- `isa_element_parts.txt`
- `partof_element_parts.txt`
- `isa_parts_list_e.txt`
- `isa_inclusion_relation_list.txt`
- `partof_inclusion_relation_list.txt`
- `README_e.html`

Changes: OBJ faces triangulated into indexed buffers; coordinates transformed from source XYZ to `(x, z, -y)` for a Y-up viewer; vertex positions quantized to 0.05 mm (maximum 0.025 mm axis error); geometry grouped into 11 browser bundles and gzip-compressed; display colors and reversible explosion transforms added. Anatomical compound mappings and FMA identifiers are retained. For meshes without a unique single-component concept, the label identifies the named parent and component number.

Grouping is derived from direct names and source concept memberships, with explicit handling of vessels, organ regions, and sense-organ structures. It is an application navigation taxonomy, not an authoritative replacement for the Foundational Model of Anatomy. Each mesh has one display group; compound concepts retain all their constituent mesh IDs and systems.

### Regenerate

Python 3, standard library only. Download once, then convert:

```sh
python3 scripts/download-source.py --directory /path/to/bodyparts-source
python3 scripts/prepare-anatomy.py --source /path/to/bodyparts-source
npm test
```

The download script writes the original files and SHA-256 provenance. The conversion reads only the downloaded source directory and writes `docs/assets/anatomy/`. Bundle SHA-256 checksums and byte counts are recorded in `catalog.json` and checked by the test suite. The original 136 MB archive is not needed at runtime and is not committed.

### Geometry format

Each system file is a gzip stream. Its decompressed data concatenates meshes in catalog order. A mesh starts at its byte `offset`, followed by `vertices × 3` little-endian float32 positions, followed by `indices` little-endian uint32 triangle indices. Normals are computed in the browser. All coordinates are millimeters in shared world space. Bounds, system assignments, concept IDs, and compound mappings live in `catalog.json`.

## Rendering

[Three.js 0.180.0](https://github.com/mrdoob/three.js/tree/r180), downloaded from the official npm registry package `three-0.180.0.tgz`. Vendored files are `three.module.min.js`, `three.core.min.js`, and `examples/jsm/controls/OrbitControls.js`. License: MIT, retained alongside the library. No third-party font or image service is required.

## Educational references

Educational copy is original, with links to its supporting references. No textbook images or large copied passages are included.

- [NCI SEER Anatomy & Physiology](https://training.seer.cancer.gov/anatomy/): skeletal, muscular, nervous, endocrine, cardiovascular, lymphatic, respiratory, digestive, urinary, and reproductive systems.
- [NIH MedlinePlus: Skin Conditions](https://medlineplus.gov/skinconditions.html): skin overview.

Individual organ summaries and tour explanations point learners to relevant anatomy references. Anatomical and learning content should be reviewed by qualified educators before formal curriculum or clinical deployment.
