"""Tests for the pdf-generation skill script."""

import importlib.util
import os
import sys
import tempfile
from pathlib import Path
from unittest import mock

import pytest

# Load the generate module from the skills directory
_SCRIPT_PATH = Path(__file__).resolve().parent.parent.parent / "skills" / "public" / "pdf-generation" / "scripts" / "generate.py"


def _load_generate_module():
    """Dynamically load the generate.py module from the skills directory."""
    spec = importlib.util.spec_from_file_location("pdf_generate", _SCRIPT_PATH)
    assert spec is not None and spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# Try to load the module; skip all tests if weasyprint is not installed
try:
    _mod = _load_generate_module()
    generate_pdf = _mod.generate_pdf
    STYLES = _mod.STYLES
    _build_title_page_html = _mod._build_title_page_html
    _resolve_image_paths = _mod._resolve_image_paths
    HAS_WEASYPRINT = True
except Exception:
    HAS_WEASYPRINT = False
    generate_pdf = None
    STYLES = None
    _build_title_page_html = None
    _resolve_image_paths = None

pytestmark = pytest.mark.skipif(not HAS_WEASYPRINT, reason="weasyprint not installed")


class TestStyles:
    """Test that all expected styles are defined."""

    def test_all_styles_present(self):
        assert set(STYLES.keys()) == {"report", "minimal", "modern", "academic"}

    def test_styles_contain_page_rule(self):
        for name, css in STYLES.items():
            assert "@page" in css, f"Style '{name}' missing @page rule"

    def test_styles_contain_body_rule(self):
        for name, css in STYLES.items():
            assert "body" in css, f"Style '{name}' missing body rule"


class TestTitlePageHtml:
    """Test the title page HTML builder."""

    def test_title_only(self):
        html = _build_title_page_html("My Title")
        assert "My Title" in html
        assert "cover-title" in html
        assert "cover-subtitle" not in html

    def test_all_fields(self):
        html = _build_title_page_html("Title", subtitle="Sub", author="Auth", date="2025-01-01")
        assert "Title" in html
        assert "Sub" in html
        assert "Auth" in html
        assert "2025-01-01" in html

    def test_page_break(self):
        html = _build_title_page_html("T")
        assert "title-page" in html


class TestResolveImagePaths:
    """Test image path resolution."""

    def test_absolute_url_unchanged(self):
        html = '<img src="https://example.com/img.png">'
        result = _resolve_image_paths(html, "/tmp")
        assert 'src="https://example.com/img.png"' in result

    def test_data_uri_unchanged(self):
        html = '<img src="data:image/png;base64,abc">'
        result = _resolve_image_paths(html, "/tmp")
        assert "data:image/png" in result

    def test_relative_path_resolved(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            img_path = Path(tmpdir) / "photo.png"
            img_path.write_bytes(b"\x89PNG")
            html = '<img src="photo.png">'
            result = _resolve_image_paths(html, tmpdir)
            assert f'src="file://{img_path.resolve()}"' in result

    def test_missing_relative_unchanged(self):
        html = '<img src="nonexistent.png">'
        result = _resolve_image_paths(html, "/tmp")
        assert 'src="nonexistent.png"' in result


class TestGeneratePdf:
    """Test the generate_pdf function."""

    def test_no_input_returns_error(self):
        result = generate_pdf(output_file="/tmp/out.pdf")
        assert "Error" in result

    def test_markdown_to_pdf(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            md_file = os.path.join(tmpdir, "test.md")
            pdf_file = os.path.join(tmpdir, "output.pdf")
            with open(md_file, "w") as f:
                f.write("# Hello World\n\nThis is a test paragraph.\n\n| A | B |\n|---|---|\n| 1 | 2 |\n")

            result = generate_pdf(input_file=md_file, output_file=pdf_file, style="report")
            assert "Successfully" in result
            assert os.path.exists(pdf_file)
            assert os.path.getsize(pdf_file) > 0

    def test_html_to_pdf(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            html_file = os.path.join(tmpdir, "test.html")
            pdf_file = os.path.join(tmpdir, "output.pdf")
            with open(html_file, "w") as f:
                f.write("<html><body><h1>Test</h1><p>Content</p></body></html>")

            result = generate_pdf(html_file=html_file, output_file=pdf_file)
            assert "Successfully" in result
            assert os.path.exists(pdf_file)

    def test_with_title_page(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            md_file = os.path.join(tmpdir, "test.md")
            pdf_file = os.path.join(tmpdir, "output.pdf")
            with open(md_file, "w") as f:
                f.write("## Section 1\n\nContent here.\n")

            result = generate_pdf(
                input_file=md_file,
                output_file=pdf_file,
                title="My Report",
                subtitle="Q4 2025",
                author="Test Author",
                date="2025-12-15",
            )
            assert "Successfully" in result
            assert os.path.exists(pdf_file)

    def test_all_styles(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            md_file = os.path.join(tmpdir, "test.md")
            with open(md_file, "w") as f:
                f.write("# Test\n\nParagraph.\n")

            for style_name in STYLES:
                pdf_file = os.path.join(tmpdir, f"output_{style_name}.pdf")
                result = generate_pdf(input_file=md_file, output_file=pdf_file, style=style_name)
                assert "Successfully" in result, f"Style '{style_name}' failed: {result}"
                assert os.path.exists(pdf_file)

    def test_letter_page_size(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            md_file = os.path.join(tmpdir, "test.md")
            pdf_file = os.path.join(tmpdir, "output.pdf")
            with open(md_file, "w") as f:
                f.write("# Test\n\nContent.\n")

            result = generate_pdf(input_file=md_file, output_file=pdf_file, page_size="Letter")
            assert "Successfully" in result

    def test_custom_css(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            md_file = os.path.join(tmpdir, "test.md")
            pdf_file = os.path.join(tmpdir, "output.pdf")
            with open(md_file, "w") as f:
                f.write("# Test\n\nContent.\n")

            result = generate_pdf(
                input_file=md_file,
                output_file=pdf_file,
                custom_css="body { color: red; }",
            )
            assert "Successfully" in result

    def test_output_dir_created(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            md_file = os.path.join(tmpdir, "test.md")
            pdf_file = os.path.join(tmpdir, "subdir", "nested", "output.pdf")
            with open(md_file, "w") as f:
                f.write("# Test\n")

            result = generate_pdf(input_file=md_file, output_file=pdf_file)
            assert "Successfully" in result
            assert os.path.exists(pdf_file)

    def test_unknown_style_falls_back_to_report(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            md_file = os.path.join(tmpdir, "test.md")
            pdf_file = os.path.join(tmpdir, "output.pdf")
            with open(md_file, "w") as f:
                f.write("# Test\n")

            result = generate_pdf(input_file=md_file, output_file=pdf_file, style="nonexistent")
            assert "Successfully" in result


class TestSkillMd:
    """Test that SKILL.md is correctly structured."""

    def test_skill_md_exists(self):
        skill_md = _SCRIPT_PATH.parent.parent / "SKILL.md"
        assert skill_md.exists()

    def test_skill_md_has_frontmatter(self):
        skill_md = _SCRIPT_PATH.parent.parent / "SKILL.md"
        content = skill_md.read_text()
        assert content.startswith("---")
        assert "name: pdf-generation" in content
        assert "description:" in content

    def test_skill_md_mentions_bash(self):
        skill_md = _SCRIPT_PATH.parent.parent / "SKILL.md"
        content = skill_md.read_text()
        assert "bash" in content.lower()
        assert "generate.py" in content

    def test_skill_md_warns_no_tool(self):
        skill_md = _SCRIPT_PATH.parent.parent / "SKILL.md"
        content = skill_md.read_text()
        assert "INGET verktyg" in content or "INTE ett separat verktyg" in content
