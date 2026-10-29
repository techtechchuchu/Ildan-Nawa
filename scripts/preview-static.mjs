import fs from 'node:fs';
import path from 'node:path';
import {build} from 'vite';
const root=path.resolve('.sites-runtime/browser-preview');fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(path.join(root,'index.html'),'<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>일단나와 · 로컬 미리보기</title></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
fs.writeFileSync(path.join(root,'main.tsx'),"import React from 'react';import{createRoot}from'react-dom/client';import Home from '../../app/page';import '../../app/globals.css';createRoot(document.getElementById('root')!).render(<Home/>);");
// Resolve the shared source from the generated preview directory.
await build({configFile:false,root,build:{outDir:path.resolve('.sites-runtime/browser-dist'),emptyOutDir:true},oxc:{jsx:{runtime:'automatic'}}});
