import ts from 'typescript';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {filesUnder} from './localized-editions.mjs';
import {localizeHTML,localizeRSS,localizeSearchJSON} from './localization.mjs';
const strings = new Set();
const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['dist/en'];
for (const file of roots.flatMap(filesUnder)) {
 if (!file.includes('/en/') || !/\.(html|xml|json)$/.test(file)) continue;
 const source=readFileSync(file,'utf8');
 if(file.endsWith('.html'))localizeHTML(source,'zh',{collect:strings});
 else if(file.endsWith('.json'))localizeSearchJSON(source,'zh',{collect:strings});
 else if(file.endsWith('.xml'))localizeRSS(source,'zh',{collect:strings});
}
const uiSource = ts.createSourceFile('ui.ts',readFileSync('src/i18n/ui.ts','utf8'),ts.ScriptTarget.Latest,true);
function collectUI(node) {
 if (ts.isPropertyAssignment(node) && node.name.getText(uiSource) === 'en' && ts.isObjectLiteralExpression(node.initializer)) {
  for (const p of node.initializer.properties) if (ts.isPropertyAssignment(p) && ts.isStringLiteral(p.initializer)) strings.add(p.initializer.text);
 }
 ts.forEachChild(node,collectUI);
}
collectUI(uiSource);
mkdirSync('.cache',{recursive:true});
writeFileSync('.cache/translation-source.json',JSON.stringify([...strings].sort(),null,2)+'\n');
console.log(`${strings.size} unique semantic strings extracted.`);
