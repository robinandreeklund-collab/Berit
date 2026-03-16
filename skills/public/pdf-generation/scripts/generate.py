"""PDF generation script for the pdf-generation skill.

Converts markdown or HTML content to a styled PDF document using weasyprint.
Supports multiple document styles, table of contents, headers/footers, and images.

Usage:
    python generate.py --input-file /path/to/content.md --output-file /path/to/output.pdf
    python generate.py --input-file /path/to/content.md --output-file /path/to/output.pdf --style report
    python generate.py --input-file /path/to/content.md --output-file /path/to/output.pdf --style report --title "My Report"
    python generate.py --html-file /path/to/content.html --output-file /path/to/output.pdf
"""

import argparse
import os
import re
import sys
from pathlib import Path


def _ensure_dependencies():
    """Check and install required dependencies."""
    try:
        import markdown  # noqa: F401
        import weasyprint  # noqa: F401
    except ImportError:
        import subprocess

        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "weasyprint", "markdown", "Pygments"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )


_ensure_dependencies()

import markdown  # noqa: E402
import weasyprint  # noqa: E402

# ── CSS Styles ──────────────────────────────────────────────────────────

STYLES = {
    "report": """
        @page {
            size: A4;
            margin: 2.5cm 2cm 2.5cm 2cm;
            @top-center {
                content: string(doc-title);
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                font-size: 9pt;
                color: #666;
            }
            @bottom-center {
                content: counter(page) " / " counter(pages);
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                font-size: 9pt;
                color: #666;
            }
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
        }
        h1 {
            string-set: doc-title content();
            font-size: 24pt;
            font-weight: 700;
            color: #111;
            margin-top: 0;
            margin-bottom: 0.5em;
            border-bottom: 2px solid #333;
            padding-bottom: 0.3em;
        }
        h2 {
            font-size: 16pt;
            font-weight: 600;
            color: #222;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            border-bottom: 1px solid #ddd;
            padding-bottom: 0.2em;
        }
        h3 {
            font-size: 13pt;
            font-weight: 600;
            color: #333;
            margin-top: 1.2em;
            margin-bottom: 0.4em;
        }
        p { margin: 0.6em 0; }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
            font-size: 10pt;
        }
        th {
            background-color: #2c3e50;
            color: white;
            padding: 8px 10px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 6px 10px;
            border-bottom: 1px solid #ddd;
        }
        tr:nth-child(even) td { background-color: #f8f9fa; }
        code {
            font-family: 'SF Mono', 'Fira Code', monospace;
            font-size: 9.5pt;
            background-color: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
        }
        pre {
            background-color: #f4f4f4;
            padding: 12px 16px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 9pt;
            line-height: 1.4;
            border: 1px solid #e0e0e0;
        }
        pre code { background: none; padding: 0; }
        blockquote {
            border-left: 4px solid #2c3e50;
            margin: 1em 0;
            padding: 0.5em 1em;
            background: #f8f9fa;
            color: #555;
        }
        ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
        li { margin: 0.2em 0; }
        img { max-width: 100%; height: auto; margin: 1em 0; }
        hr { border: none; border-top: 1px solid #ddd; margin: 1.5em 0; }
        a { color: #2c3e50; text-decoration: underline; }
    """,
    "minimal": """
        @page {
            size: A4;
            margin: 3cm 2.5cm;
            @bottom-right {
                content: counter(page);
                font-family: 'Georgia', serif;
                font-size: 9pt;
                color: #999;
            }
        }
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.7;
            color: #333;
        }
        h1 {
            font-size: 22pt;
            font-weight: normal;
            color: #111;
            margin-top: 0;
            margin-bottom: 1em;
        }
        h2 {
            font-size: 15pt;
            font-weight: normal;
            color: #222;
            margin-top: 2em;
            margin-bottom: 0.5em;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 11pt;
        }
        h3 {
            font-size: 12pt;
            font-weight: bold;
            color: #333;
            margin-top: 1.5em;
        }
        p { margin: 0.8em 0; }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
            font-size: 10pt;
        }
        th, td {
            padding: 8px 10px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }
        th { font-weight: bold; }
        code {
            font-family: monospace;
            font-size: 9.5pt;
            background-color: #f5f5f5;
            padding: 1px 4px;
        }
        pre {
            background-color: #f5f5f5;
            padding: 12px;
            font-size: 9pt;
            line-height: 1.4;
        }
        pre code { background: none; padding: 0; }
        blockquote {
            border-left: 2px solid #ccc;
            margin: 1em 0;
            padding: 0.3em 1em;
            color: #666;
            font-style: italic;
        }
        img { max-width: 100%; height: auto; }
        a { color: #333; }
    """,
    "modern": """
        @page {
            size: A4;
            margin: 2cm;
            @bottom-center {
                content: counter(page);
                font-family: 'Inter', 'Helvetica Neue', sans-serif;
                font-size: 8pt;
                color: #aaa;
            }
        }
        body {
            font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10.5pt;
            line-height: 1.6;
            color: #1e293b;
        }
        h1 {
            font-size: 28pt;
            font-weight: 800;
            color: #0f172a;
            margin-top: 0;
            margin-bottom: 0.3em;
            letter-spacing: -0.5px;
        }
        h2 {
            font-size: 17pt;
            font-weight: 700;
            color: #1e40af;
            margin-top: 1.5em;
            margin-bottom: 0.4em;
        }
        h3 {
            font-size: 13pt;
            font-weight: 600;
            color: #334155;
            margin-top: 1.2em;
        }
        p { margin: 0.5em 0; }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
            font-size: 10pt;
            border-radius: 4px;
            overflow: hidden;
        }
        th {
            background-color: #1e40af;
            color: white;
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 8px 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        tr:nth-child(even) td { background-color: #f1f5f9; }
        code {
            font-family: 'JetBrains Mono', 'SF Mono', monospace;
            font-size: 9pt;
            background-color: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            color: #e11d48;
        }
        pre {
            background-color: #1e293b;
            color: #e2e8f0;
            padding: 16px;
            border-radius: 8px;
            font-size: 9pt;
            line-height: 1.5;
        }
        pre code { background: none; color: inherit; padding: 0; }
        blockquote {
            border-left: 4px solid #3b82f6;
            margin: 1em 0;
            padding: 0.5em 1em;
            background: #eff6ff;
            color: #1e40af;
            border-radius: 0 4px 4px 0;
        }
        ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
        img { max-width: 100%; height: auto; border-radius: 4px; }
        hr { border: none; border-top: 2px solid #e2e8f0; margin: 2em 0; }
        a { color: #2563eb; text-decoration: none; }
    """,
    "academic": """
        @page {
            size: A4;
            margin: 2.54cm;
            @top-right {
                content: counter(page);
                font-family: 'Times New Roman', Times, serif;
                font-size: 12pt;
            }
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 2;
            color: #000;
        }
        h1 {
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            margin-top: 0;
            margin-bottom: 1em;
        }
        h2 {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        h3 {
            font-size: 12pt;
            font-weight: bold;
            font-style: italic;
            margin-top: 1em;
        }
        p { margin: 0; text-indent: 1.27cm; }
        p:first-of-type { text-indent: 0; }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
            font-size: 11pt;
        }
        th, td {
            padding: 4px 8px;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            text-align: left;
        }
        th { font-weight: bold; }
        code, pre {
            font-family: 'Courier New', monospace;
            font-size: 10pt;
        }
        pre { margin: 1em 0; padding: 0.5em; background: #f8f8f8; }
        pre code { background: none; }
        blockquote {
            margin: 1em 2em;
            font-style: italic;
        }
        img { max-width: 100%; height: auto; }
        a { color: #000; text-decoration: underline; }
    """,
}


def _build_title_page_html(title: str, subtitle: str = "", author: str = "", date: str = "") -> str:
    """Build an HTML title page block."""
    parts = [f'<div class="title-page"><h1 class="cover-title">{title}</h1>']
    if subtitle:
        parts.append(f'<p class="cover-subtitle">{subtitle}</p>')
    if author:
        parts.append(f'<p class="cover-author">{author}</p>')
    if date:
        parts.append(f'<p class="cover-date">{date}</p>')
    parts.append("</div>")
    return "\n".join(parts)


TITLE_PAGE_CSS = """
    .title-page {
        page-break-after: always;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        min-height: 80vh;
    }
    .cover-title {
        font-size: 32pt !important;
        border: none !important;
        text-align: center !important;
        margin-bottom: 0.3em !important;
    }
    .cover-subtitle {
        font-size: 16pt;
        color: #555;
        margin: 0.3em 0;
        text-indent: 0 !important;
    }
    .cover-author {
        font-size: 12pt;
        color: #777;
        margin: 1em 0 0.2em;
        text-indent: 0 !important;
    }
    .cover-date {
        font-size: 11pt;
        color: #999;
        text-indent: 0 !important;
    }
"""


def _resolve_image_paths(html: str, base_dir: str) -> str:
    """Resolve relative image paths to absolute file:// URIs for weasyprint."""

    def _resolve(match):
        src = match.group(1)
        if src.startswith(("http://", "https://", "file://", "data:")):
            return match.group(0)
        abs_path = Path(base_dir).joinpath(src).resolve()
        if abs_path.exists():
            return f'src="file://{abs_path}"'
        return match.group(0)

    return re.sub(r'src="([^"]+)"', _resolve, html)


def generate_pdf(
    input_file: str | None = None,
    html_file: str | None = None,
    output_file: str = "output.pdf",
    style: str = "report",
    title: str = "",
    subtitle: str = "",
    author: str = "",
    date: str = "",
    page_size: str = "A4",
    custom_css: str = "",
) -> str:
    """Generate a PDF from markdown or HTML content.

    Args:
        input_file: Path to markdown (.md) file.
        html_file: Path to HTML file (used instead of input_file if provided).
        output_file: Path for the output PDF.
        style: One of 'report', 'minimal', 'modern', 'academic'.
        title: Document title (adds a title page if provided).
        subtitle: Subtitle for title page.
        author: Author for title page.
        date: Date for title page.
        page_size: Paper size (A4, Letter, etc.).
        custom_css: Additional CSS to append.

    Returns:
        Status message.
    """
    if html_file:
        with open(html_file, "r", encoding="utf-8") as f:
            html_body = f.read()
        base_dir = os.path.dirname(os.path.abspath(html_file))
    elif input_file:
        with open(input_file, "r", encoding="utf-8") as f:
            md_content = f.read()
        html_body = markdown.markdown(
            md_content,
            extensions=["tables", "fenced_code", "codehilite", "toc", "attr_list", "md_in_html"],
            extension_configs={
                "codehilite": {"css_class": "highlight", "guess_lang": True},
            },
        )
        base_dir = os.path.dirname(os.path.abspath(input_file))
    else:
        return "Error: Either --input-file or --html-file must be provided."

    # Resolve image paths
    html_body = _resolve_image_paths(html_body, base_dir)

    # Build CSS
    css = STYLES.get(style, STYLES["report"])
    if page_size != "A4":
        css = css.replace("size: A4;", f"size: {page_size};")
    if custom_css:
        css += "\n" + custom_css

    # Title page
    title_html = ""
    if title:
        css += TITLE_PAGE_CSS
        title_html = _build_title_page_html(title, subtitle, author, date)

    full_html = f"""<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="utf-8">
    <style>{css}</style>
</head>
<body>
{title_html}
{html_body}
</body>
</html>"""

    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)

    # Generate PDF
    doc = weasyprint.HTML(string=full_html, base_url=base_dir)
    doc.write_pdf(output_file)

    file_size = os.path.getsize(output_file)
    size_str = f"{file_size / 1024:.1f} KB" if file_size < 1024 * 1024 else f"{file_size / (1024 * 1024):.1f} MB"

    return f"Successfully generated PDF ({size_str}) to {output_file}"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate PDF from markdown or HTML")
    parser.add_argument("--input-file", help="Path to markdown (.md) file")
    parser.add_argument("--html-file", help="Path to HTML file (alternative to --input-file)")
    parser.add_argument("--output-file", required=True, help="Output PDF file path")
    parser.add_argument("--style", default="report", choices=list(STYLES.keys()), help="Document style (default: report)")
    parser.add_argument("--title", default="", help="Document title (adds title page)")
    parser.add_argument("--subtitle", default="", help="Subtitle for title page")
    parser.add_argument("--author", default="", help="Author for title page")
    parser.add_argument("--date", default="", help="Date for title page")
    parser.add_argument("--page-size", default="A4", help="Page size: A4, Letter, etc.")
    parser.add_argument("--custom-css", default="", help="Additional CSS string")

    args = parser.parse_args()

    try:
        print(generate_pdf(
            input_file=args.input_file,
            html_file=args.html_file,
            output_file=args.output_file,
            style=args.style,
            title=args.title,
            subtitle=args.subtitle,
            author=args.author,
            date=args.date,
            page_size=args.page_size,
            custom_css=args.custom_css,
        ))
    except Exception as e:
        print(f"Error while generating PDF: {e}")
