#!/usr/bin/env python3
"""Convert official BodyParts3D 4.0 OBJ meshes to indexed, gzip-compressed bundles.
Usage: python3 scripts/prepare-anatomy.py --source /path/to/downloads
See ASSETS.md for source URLs and provenance. No third-party Python packages required.
"""
import argparse, array, collections, csv, gzip, hashlib, json, math, pathlib, re, struct, sys, zipfile
p=argparse.ArgumentParser();p.add_argument('--source',type=pathlib.Path,required=True);p.add_argument('--metadata-only',action='store_true');args=p.parse_args()
root=pathlib.Path(__file__).resolve().parent.parent;source=args.source;out=root/'docs/assets/anatomy';out.mkdir(parents=True,exist_ok=True)
concepts={}; isa={}; part={}
for filename,table in [('isa_element_parts.txt',isa),('partof_element_parts.txt',part)]:
 for cid,name,mid in list(csv.reader(open(source/filename),delimiter='\t'))[1:]:
  table.setdefault(cid,{'name':name,'meshes':set()})['meshes'].add(mid)
  concepts.setdefault(cid,{'id':cid,'name':name,'meshes':set()})['meshes'].add(mid)
all_meshes=set().union(*(v['meshes'] for v in isa.values()))
parents=collections.defaultdict(set)
for a,b,c,d in list(csv.reader(open(source/'isa_inclusion_relation_list.txt'),delimiter='\t'))[1:]:parents[c].add(a)
def depth(cid,seen=None):
 seen=set() if seen is None else seen
 if cid in seen:return 0
 return 1+max([depth(a,seen|{cid}) for a in parents[cid]] or [0])
depths={c:depth(c) for c in concepts}
by_mesh=collections.defaultdict(list)
for cid,c in concepts.items():
 for mid in c['meshes']:
  if mid in all_meshes:by_mesh[mid].append(cid)
def members(table,cid):return table.get(cid,{}).get('meshes',set())
def union_name(pattern):
 return set().union(*(c['meshes'] for c in concepts.values() if re.search(pattern,c['name'])))
# Primary display system is a UI grouping. Multi-system membership is retained in concept maps.
groups={
 'skeletal':members(isa,'FMA5018'),
 'muscular':members(isa,'FMA5022')|members(isa,'FMA9721'),
 'cardiovascular':members(isa,'FMA50720')|members(isa,'FMA50723')|members(part,'FMA7088'),
 'nervous':members(part,'FMA7157')|members(isa,'FMA65132'),
 'respiratory':members(part,'FMA7158'),
 'digestive':members(part,'FMA7152'),
 'urinary':members(part,'FMA7159')|members(isa,'FMA7203'),
 'endocrine':members(part,'FMA9668'),
 'reproductive':members(part,'FMA7160'),
}
priority=['cardiovascular','skeletal','muscular','endocrine','urinary','nervous','reproductive','respiratory','digestive']
def classify(mid,name):
 n=name.lower()
 if re.search(r'\b(artery|arteries|vein|veins)\b',n):return 'cardiovascular'
 # Match the actual named structure first. Broad compound-organ membership can
 # contain vessels or several tissue classes, so it is only a fallback.
 rules=[
 ('integumentary',r'skin|eyebrow|eyelash|nail|hair|fascia|subcutaneous'),
 ('digestive',r'hepatovenous segment'),
 ('nervous',r'lateral ventricle|third ventricle|fourth ventricle|corpus callosum|lamina terminalis|gyrus|trochlea of'),
 ('cardiovascular',r'artery|arteries|arterial|vein|veins|venous|vena cava|aorta|aortic|pulmonary trunk|celiac trunk|costocervical trunk|thyrocervical trunk|plantar arch|palmar arch|coronary sinus|heart|atrium|atrial|cardiac|pericard|myocard|ventricle(?! of brain)|tricuspid|mitral|papillary muscle'),
 ('skeletal',r'cartilage|ligament|meniscus|intervertebral disc|intervertebral disk|tooth|teeth|sternum|manubrium|xiphoid|joint|synovial|bursa|articular|suture|fontanel'),
 ('endocrine',r'adrenal|suprarenal gland|thyroid gland|parathyroid|pituitary|pineal'),
 ('urinary',r'kidney|ureter|urinary|urethra|renal pelvis'),
 ('lymphatic',r'spleen|thymus|lymph|tonsil'),
 ('reproductive',r'testis|testes|epididymis|prostate|seminal vesicle|penis|scrotum|ductus deferens|deferent duct|spermatic cord|corpus cavernosum|corpus spongiosum'),
 ('nervous',r'nerve|ganglion|spinal cord|brain|cerebr|cerebell|encephal|dura|arachnoid|pia mater|optic|retina|eyeball|lens|cornea|sclera|choroid|iris|pupil|corona ciliaris|conjunctiv|lacrimal|commissure|collicul|caudate nucleus|fornix|globus pallidus|geniculate|mammillary|putamen|stria |thalam|cochlea|vestibul|auditory|saccule|utricle|ossicle'),
 ('muscular',r'muscle|aponeurosis|tendinous|tendon|biceps|triceps|flexor|extensor|gastrocnemius|adductor|rectus femoris|vastus|pectoralis|coccygeus|puborectalis|levatores|deltoid|pronator|interossei|lumbrical|trapezius|intertransversarii|interspinales|longus colli|raphe|aryepiglotticus|linea alba|diaphragm|iliotibial tract|cricothyroid'),
 ('digestive',r'liver|hepatic|hepatovenous|lip|tongue|esophag|stomach|gastric|intestin|colon|colic|rectum|anus|anal canal|gallbladder|bile|biliary|pancrea|duoden|jejun|ileum|ileal|cecum|caecum|appendix|salivary|sublingual gland|submandibular gland|parotid|mesenter|omentum'),
 ('respiratory',r'lung|pulmonary segment|bronch|trachea|laryn|pleura|nasal|nose|pharynx|epiglottis|glottis'),
 ]
 for system,pattern in rules:
  if re.search(pattern,n):return system
 return next((system for system in priority if mid in groups[system]),None)
mesh_meta=[];unclassified=[]
for mid in sorted(all_meshes):
 ids=sorted(by_mesh[mid],key=lambda c:(len(concepts[c]['meshes']),-depths[c],-len(concepts[c]['name'])))
 cid=ids[0];c=concepts[cid]
 system=classify(mid,c['name'])
 if system is None:
  # Extra sense-organ/support structures are grouped with nervous or skeletal for browsing.
  n=' '.join(concepts[i]['name'] for i in ids[:8])
  if re.search(r'eye|ear|iris|pupil|sclera|cochlea|vestibul|auditory|lacrimal|conjunctiv|choroid|saccule|utricle|ossicle',n):system='nervous'
  elif re.search(r'joint|synovial|bursa|articular|membrane|suture|fontanel|disc|costal',n):system='skeletal'
  elif re.search(r'cavity|space|recess',n):system='nervous' if re.search(r'brain|cerebr|neur|ventric',n) else 'respiratory'
  else:system='integumentary';unclassified.append((mid,c['name']))
 name=c['name'];siblings=sorted(c['meshes']&all_meshes)
 if len(siblings)>1:name+=f' · component {siblings.index(mid)+1}'
 mesh_meta.append({'id':mid,'concept':cid,'name':name,'system':system})
print('System counts:',dict(collections.Counter(m['system'] for m in mesh_meta)))
print('Fallback classifications:',unclassified)
if args.metadata_only:sys.exit(0)
z=zipfile.ZipFile(source/'meshes.zip');entries={pathlib.PurePosixPath(n).stem:n for n in z.namelist() if n.endswith('.obj')}
bundles=collections.defaultdict(bytearray);mins=[math.inf]*3;maxs=[-math.inf]*3;triangles=0
for idx,m in enumerate(mesh_meta):
 if m['id'] not in entries:raise RuntimeError('Mesh missing: '+m['id'])
 text=z.read(entries[m['id']]).decode();vertices=[];indices=[]
 for line in text.splitlines():
  if line.startswith('v '):
   xyz=[round(float(x)*20)/20 for x in line.split()[1:4]];vertices.append([xyz[0],xyz[2],-xyz[1]])
  elif line.startswith('f '):
   face=[int(v.split('/')[0]) for v in line.split()[1:]];face=[v-1 if v>0 else len(vertices)+v for v in face]
   for k in range(1,len(face)-1):indices.extend((face[0],face[k],face[k+1]))
 if not vertices or not indices:raise RuntimeError('Empty geometry: '+m['id'])
 if min(indices)<0 or max(indices)>=len(vertices):raise RuntimeError('Invalid index: '+m['id'])
 lo=[min(v[i] for v in vertices) for i in range(3)];hi=[max(v[i] for v in vertices) for i in range(3)]
 for i in range(3):mins[i]=min(mins[i],lo[i]);maxs[i]=max(maxs[i],hi[i])
 data=bundles[m['system']];m.update(offset=len(data),vertices=len(vertices),indices=len(indices),bounds=[lo,hi])
 va=array.array('f',[x for v in vertices for x in v]);ia=array.array('I',indices)
 if sys.byteorder!='little':va.byteswap();ia.byteswap()
 data.extend(va.tobytes());data.extend(ia.tobytes());triangles+=len(indices)//3
 if idx%400==0:print(f'Converted {idx}/{len(mesh_meta)}',flush=True)
files={}
for system,data in bundles.items():
 compressed=gzip.compress(bytes(data),compresslevel=9,mtime=0);file=out/(system+'.bin.gz');file.write_bytes(compressed)
 files[system]={'file':file.name,'bytes':len(compressed),'decodedBytes':len(data),'sha256':hashlib.sha256(compressed).hexdigest()}
valid={m['id'] for m in mesh_meta};mesh_systems={m['id']:m['system'] for m in mesh_meta}
cs=[]
for cid,c in concepts.items():
 mids=sorted(c['meshes']&valid)
 if mids:cs.append({'id':cid,'name':c['name'],'meshes':mids,'systems':sorted({mesh_systems[mid] for mid in mids})})
manifest={'version':1,'source':'BodyParts3D 4.0, IS-A 99% polygon-reduced dataset','sourceURL':'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html','license':'CC BY 4.0','attribution':'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International','coordinateTransform':'x=x, y=z, z=-y; millimeters; positions quantized to 0.05 mm (maximum axis error 0.025 mm)','bounds':[mins,maxs],'triangles':triangles,'files':files,'meshes':mesh_meta,'concepts':cs}
(out/'catalog.json').write_text(json.dumps(manifest,separators=(',',':')))
print('Done:',len(mesh_meta),'meshes,',len(cs),'concepts,',triangles,'triangles; bounds',mins,maxs)
print('Compressed bundle bytes:',sum(f['bytes'] for f in files.values()))
