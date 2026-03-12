const ts = require('./node_modules/typescript');
['src/app/login.tsx', 'src/app/job/[id].tsx', 'src/components/JobLocationMap.tsx'].forEach(f => {
    try {
        const src = require('fs').readFileSync(f, 'utf8');
        ts.transpileModule(src, { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext }});
        console.log('OK: ' + f + ' (' + src.split('\n').length + ' lines)');
    } catch (e) { console.log('ERROR: ' + f + ': ' + e.message); }
});
