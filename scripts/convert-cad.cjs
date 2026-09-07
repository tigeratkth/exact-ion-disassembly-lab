const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const source = process.argv[2];
const output = process.argv[3];
if (!source || !output) throw new Error('Usage: node convert.cjs input.stp output-basename');
(async () => {
 const occt = await require('occt-import-js')();
 const bytes = fs.readFileSync(source);
 console.log(`Reading ${bytes.length} bytes...`);
 const start = Date.now();
 const parameters = {linearUnit:'millimeter',linearDeflectionType:'absolute_value',linearDeflection:0.2,angularDeflection:0.4};
 const result = occt.ReadStepFile(bytes, parameters);
 if (!result.success) throw new Error('STEP import failed');
 console.log(`Imported ${result.meshes.length} meshes in ${(Date.now()-start)/1000}s`);
 const gltf = {asset:{version:'2.0',generator:'occt-import-js 0.0.23 / Bosch CAD converter'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],buffers:[],bufferViews:[],accessors:[]};
 const chunks=[]; let length=0;
 function data(array, target, componentType, type, min, max) {
  const padding=(4-length%4)%4; if(padding) {chunks.push(Buffer.alloc(padding));length+=padding;}
  const buffer=Buffer.from(array.buffer,array.byteOffset,array.byteLength);
  const view={buffer:0,byteOffset:length,byteLength:buffer.byteLength,target};
  const vi=gltf.bufferViews.push(view)-1; chunks.push(buffer); length+=buffer.byteLength;
  const acc={bufferView:vi,componentType,count:array.length/({SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[type]),type};
  if(min) acc.min=min; if(max) acc.max=max;
  return gltf.accessors.push(acc)-1;
 }
 const materialMap=new Map();
 const linear = c => c <= 0.04045 ? c / 12.92 : ((c+0.055)/1.055)**2.4;
 function material(color) {
  const key=color.join(','); if(materialMap.has(key))return materialMap.get(key);
  const mi=gltf.materials.push({name:`CAD ${color.map(v=>v.toFixed(3)).join(' ')}`,pbrMetallicRoughness:{baseColorFactor:[...color.map(linear),1],metallicFactor:0.05,roughnessFactor:0.62},doubleSided:false,extras:{cadColor:color}})-1;
  materialMap.set(key,mi); return mi;
 }
 const manifest={schemaVersion:1,sourceFile:path.basename(source),sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),sourceDate:'2013-06-20',sourceUrl:'https://www.bosch-professional.com/binary/manualsmedia/o191404v135_Exact_ION_ohne_mit_Akku_STEP.zip',units:'millimeter',coordinateSystem:'Original STEP coordinates; mesh vertices recentered at bounds center, restored by node translation.',triangulation:parameters,meshCount:result.meshes.length,vertexCount:0,triangleCount:0,bounds:{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]},hierarchy:result.root,meshes:[]};
 result.meshes.forEach((m,i)=> {
  const pos=m.attributes.position.array; const index=m.index.array;
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],mean=[0,0,0];
  for(let j=0;j<pos.length;j++){const a=j%3;min[a]=Math.min(min[a],pos[j]);max[a]=Math.max(max[a],pos[j]);mean[a]+=pos[j]/(pos.length/3);}
  const center=min.map((v,a)=>(v+max[a])/2);
  const local=new Float32Array(pos.length); for(let j=0;j<pos.length;j++)local[j]=pos[j]-center[j%3];
  const lm=min.map((v,a)=>v-center[a]),lx=max.map((v,a)=>v-center[a]);
  const attrs={POSITION:data(local,34962,5126,'VEC3',lm,lx)};
  if(m.attributes.normal) attrs.NORMAL=data(new Float32Array(m.attributes.normal.array),34962,5126,'VEC3');
  const baseColor=m.color || [0.65,0.65,0.65];
  const faceColors=(m.brep_faces||[]).filter(f=>f.color);
  if(faceColors.length) {
   const colors=new Float32Array(pos.length); for(let j=0;j<pos.length;j++)colors[j]=linear(baseColor[j%3]);
   for(const face of faceColors)for(let t=face.first;t<=face.last;t++) for(let k=0;k<3;k++){const v=index[t*3+k]*3; for(let a=0;a<3;a++)colors[v+a]=linear(face.color[a]);}
   attrs.COLOR_0=data(colors,34962,5126,'VEC3');
  }
  const indices=pos.length/3<=65535?new Uint16Array(index):new Uint32Array(index);
  const ii=data(indices,34963,indices.BYTES_PER_ELEMENT===2?5123:5125,'SCALAR');
  const id=`cad-${String(i).padStart(3,'0')}`;
  const name=m.name||`Unnamed ${i}`;
  gltf.meshes.push({name:id,primitives:[{attributes:attrs,indices:ii,material:material(faceColors.length?[1,1,1]:baseColor)}],extras:{cadId:id,cadName:name}});
  manifest.meshes.push({id,index:i,name,materialColor:baseColor,faceColors:[...new Set(faceColors.map(f=>JSON.stringify(f.color)))].map(s=>JSON.parse(s)),bounds:{min,max},centroid:center,vertexMean:mean,vertexCount:pos.length/3,triangleCount:index.length/3});
  for(let a=0;a<3;a++){manifest.bounds.min[a]=Math.min(manifest.bounds.min[a],min[a]);manifest.bounds.max[a]=Math.max(manifest.bounds.max[a],max[a]);}
  manifest.vertexCount+=pos.length/3; manifest.triangleCount+=index.length/3;
 });
 function hierarchy(node,parentPath=[]){
  const ni=gltf.nodes.length;
  const currentPath=[...parentPath,node.name||''];
  gltf.nodes.push({name:node.name||'Assembly',children:[],extras:{cadAssemblyName:node.name||'',assemblyPath:currentPath}});
  for(const mi of node.meshes||[]){
   const meta=manifest.meshes[mi];meta.assemblyPath=currentPath;
   const mni=gltf.nodes.push({name:meta.id,mesh:mi,translation:meta.centroid,extras:{cadId:meta.id,cadName:meta.name,assemblyPath:currentPath}})-1;
   gltf.nodes[ni].children.push(mni);
  }
  for(const child of node.children||[])gltf.nodes[ni].children.push(hierarchy(child,currentPath));
  if(!gltf.nodes[ni].children.length)delete gltf.nodes[ni].children;
  return ni;
 }
 gltf.scenes[0].nodes.push(hierarchy(result.root));
 manifest.bounds.center=manifest.bounds.min.map((v,a)=>(v+manifest.bounds.max[a])/2);
 manifest.bounds.size=manifest.bounds.min.map((v,a)=>manifest.bounds.max[a]-v);
 gltf.buffers.push({byteLength:length});
 const json=Buffer.from(JSON.stringify(gltf)); const jp=(4-json.length%4)%4;
 const binary=Buffer.concat(chunks); const bp=(4-binary.length%4)%4;
 const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+json.length+jp+8+binary.length+bp,8);
 const jh=Buffer.alloc(8);jh.writeUInt32LE(json.length+jp,0);jh.writeUInt32LE(0x4e4f534a,4);
 const bh=Buffer.alloc(8);bh.writeUInt32LE(binary.length+bp,0);bh.writeUInt32LE(0x004e4942,4);
 const glb=Buffer.concat([header,jh,json,Buffer.alloc(jp,32),bh,binary,Buffer.alloc(bp)]);
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output+'.glb',glb);fs.writeFileSync(output+'.manifest.json',JSON.stringify(manifest,null,2));
 fs.writeFileSync(output+'.summary.txt',manifest.meshes.map(m=>`${m.id}\t${m.name}\t${m.triangleCount} triangles\tcenter ${m.centroid.map(v=>v.toFixed(2)).join(', ')}\tmin ${m.bounds.min.map(v=>v.toFixed(2)).join(', ')}\tmax ${m.bounds.max.map(v=>v.toFixed(2)).join(', ')}`).join('\n'));
 console.log(JSON.stringify({glbBytes:glb.length,meshCount:manifest.meshCount,vertexCount:manifest.vertexCount,triangleCount:manifest.triangleCount,bounds:manifest.bounds},null,2));
})();
