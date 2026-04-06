export function renderMarkdown(text) {
  if (!text) return '';

  const escape = s =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const inlineFmt = s =>
    s
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<s>$1</s>');

  const lines = text.split('\n');
  const out = [];

  for (const raw of lines) {
    const esc = inlineFmt(escape(raw));

    if (raw.startsWith('### ')) {
      out.push(`<h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:6px 0 2px 0">${esc.slice(4)}</h3>`);
    } else if (raw.startsWith('## ')) {
      out.push(`<h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:8px 0 3px 0">${esc.slice(3)}</h2>`);
    } else if (raw.startsWith('# ')) {
      out.push(`<h1 style="font-size:18px;font-weight:800;color:#1e293b;margin:10px 0 4px 0">${esc.slice(2)}</h1>`);
    } else if (raw.startsWith('- ') || raw.startsWith('* ')) {
      out.push(`<li style="margin-left:18px;list-style-type:disc">${esc.slice(2)}</li>`);
    } else if (raw === '') {
      out.push('<br>');
    } else {
      out.push(esc + '<br>');
    }
  }

  return out.join('');
}
