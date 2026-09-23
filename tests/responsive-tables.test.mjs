import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {scrollableTables} from '../src/lib/scrollableTables.mjs';

const options={label:'Scrollable table',hint:'Scroll to see all columns.'};
const all=(root,predicate)=>[...(predicate(root)?[root]:[]),...(root.childNodes??[]).flatMap(n=>all(n,predicate))];
const attr=(node,name)=>node.attrs?.find(a=>a.name===name)?.value;

test('Markdown tables gain keyboard regions without losing caption, headings, links or spans',()=>{
  const input='<h2 id="prices">Prices</h2><table id="rates"><caption>Rates</caption><thead><tr><th scope="col">Type</th><th scope="col">Price</th></tr></thead><tbody><tr><th scope="row">Stand</th><td rowspan="2"><a href="/en/request-stand/">Ask</a></td></tr><tr><td>Hall</td></tr></tbody></table><p>After the table.</p>';
  const result=scrollableTables(input,options), doc=parseFragment(result);
  const regions=all(doc,n=>attr(n,'class')==='table-scroll');
  assert.equal(regions.length,1);
  assert.equal(attr(regions[0],'role'),'region');
  assert.equal(attr(regions[0],'tabindex'),'0');
  assert.equal(attr(regions[0],'aria-label'),options.label);
  assert.equal(all(doc,n=>n.tagName==='table').length,1);
  assert.match(result,/<caption>Rates<\/caption>/);
  assert.match(result,/<h2 id="prices">Prices<\/h2>/);
  assert.match(result,/<th scope="row">Stand<\/th>/);
  assert.match(result,/<td rowspan="2">/);
  assert.match(result,/href="\/en\/request-stand\/"/);
  assert.ok(result.endsWith('<p>After the table.</p>'));
  assert.equal(scrollableTables(result,options),result);
});

test('table labels are escaped as text and unrelated Markdown remains unchanged',()=>{
  const label='Label with "quotes" and <markup>',hint='<script>not executable</script>';
  const doc=parseFragment(scrollableTables('<table><tr><td>内容</td></tr></table>',{label,hint}));
  assert.equal(all(doc,n=>n.tagName==='script').length,0);
  assert.equal(attr(all(doc,n=>attr(n,'class')==='table-scroll')[0],'aria-label'),label);
  assert.equal(attr(all(doc,n=>attr(n,'class')==='table-hint')[0],'data-hint'),hint);
  assert.equal(scrollableTables('<p>No table here.</p>',options),'<p>No table here.</p>');
});
