import { parseFragment, serialize } from 'parse5';

/** Wrap authored Markdown tables at build time, without changing their semantics or contents. */
export function scrollableTables(html, {label, hint}) {
  const fragment = parseFragment(html);
  const text = (value, parentNode) => ({nodeName:'#text', value, parentNode});
  function visit(parent) {
    for (const node of [...(parent.childNodes ?? [])]) {
      if (node.tagName === 'table') {
        // Idempotent for content that already supplies its own accessible wrapper.
        if (parent.attrs?.some(a => a.name === 'class' && a.value.split(/\s+/).includes('table-scroll'))) continue;
        const frame = parseFragment('<div class="table-frame"><p class="table-hint"></p><div class="table-scroll" role="region" tabindex="0"></div></div>').childNodes[0];
        const [help, region] = frame.childNodes;
        help.childNodes.push(text(hint, help));
        region.attrs.push({name:'aria-label', value:label});
        region.childNodes.push(node);
        frame.parentNode = parent;
        parent.childNodes.splice(parent.childNodes.indexOf(node), 1, frame);
        node.parentNode = region;
      } else visit(node);
    }
  }
  visit(fragment);
  return serialize(fragment);
}
