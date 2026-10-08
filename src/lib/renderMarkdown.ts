/**
 * Lightweight Markdown + KaTeX parser for competitive programming statements.
 * Renders mathematical formulas like $O(N \log N)$ and $$x^2 + y^2$$ using KaTeX if available,
 * and handles code blocks, inline code, lists, and formatting.
 */

declare global {
  interface Window {
    katex?: {
      renderToString: (tex: string, options?: any) => string;
    };
  }
}

export function renderStatement(text: string): string {
  if (!text) return '';

  let html = text;

  // Render block math $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    try {
      if (typeof window !== 'undefined' && window.katex) {
        return `<div class="math-block">${window.katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })}</div>`;
      }
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
    return `<div class="math-block font-mono"><code>${escapeHtml(tex.trim())}</code></div>`;
  });

  // Render inline math $...$
  html = html.replace(/\$([^\$\n]+?)\$/g, (_, tex) => {
    try {
      if (typeof window !== 'undefined' && window.katex) {
        return `<span class="math-inline">${window.katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false })}</span>`;
      }
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
    return `<code class="math-fallback">${escapeHtml(tex.trim())}</code>`;
  });

  // Render code blocks ```...```
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="code-block"><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
  });

  // Render inline code `...`
  html = html.replace(/`([^`\n]+?)`/g, (_, code) => {
    return `<code class="code-inline">${escapeHtml(code)}</code>`;
  });

  // Render paragraphs and line breaks
  const paragraphs = html.split(/\n{2,}/);
  html = paragraphs
    .map(p => {
      p = p.trim();
      if (p.startsWith('<div class="math-block"') || p.startsWith('<pre class="code-block"')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br />')}</p>`;
    })
    .join('');

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
