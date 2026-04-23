import { NextRequest, NextResponse } from 'next/server';
import { getTemplate, getTemplateHtml } from '@/templates/registry';
import { renderTemplate } from '@/lib/renderTemplate';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, variantCode, format, fields } = body;

    const entry = getTemplate(templateId);
    if (!entry) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const variant = entry.config.variants.find((v) => v.code === variantCode);
    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    const templateHtml = getTemplateHtml(templateId, variantCode);
    if (!templateHtml) {
      return NextResponse.json({ error: 'Template HTML not found' }, { status: 404 });
    }

    const html = renderTemplate(templateHtml, fields);

    // Production: proxy to external Puppeteer render server (Railway)
    const renderServerUrl = process.env.RENDER_SERVER_URL;

    if (renderServerUrl) {
      const res = await fetch(`${renderServerUrl}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          width: variant.width,
          height: variant.height,
          format: format || variant.exportFormat,
          dpi: variant.exportDPI,
        }),
      });

      if (!res.ok) {
        return NextResponse.json({ error: 'Render server error' }, { status: 502 });
      }

      const buffer = await res.arrayBuffer();
      const contentType = format === 'pdf' ? 'application/pdf' : 'image/png';
      return new NextResponse(buffer, {
        headers: { 'Content-Type': contentType },
      });
    }

    // Development fallback: return rendered HTML
    // (Puppeteer runs on a separate server, not available locally by default)
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
