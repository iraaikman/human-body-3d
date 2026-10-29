#!/usr/bin/env python3
"""Download official, public BodyParts3D source files for local regeneration."""
import argparse, hashlib, json, pathlib, urllib.request
p=argparse.ArgumentParser();p.add_argument('--directory',type=pathlib.Path,required=True);args=p.parse_args()
args.directory.mkdir(parents=True,exist_ok=True)
base='https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/'
files={'meshes.zip':'isa_BP3D_4.0_obj_99.zip',**{n:n for n in ['isa_element_parts.txt','partof_element_parts.txt','isa_parts_list_e.txt','isa_inclusion_relation_list.txt','partof_inclusion_relation_list.txt','README_e.html']}}
records=[]
for local,remote in files.items():
 target=args.directory/local
 if not target.exists():
  print('Downloading',remote,flush=True)
  partial=target.with_suffix(target.suffix+'.partial')
  urllib.request.urlretrieve(base+remote,partial)
  partial.replace(target)
 records.append({'file':local,'url':base+remote,'bytes':target.stat().st_size,'sha256':hashlib.file_digest(open(target,'rb'),'sha256').hexdigest()})
(args.directory/'source-provenance.json').write_text(json.dumps(records,indent=2)+'\n')
print('Source files ready in',args.directory)
