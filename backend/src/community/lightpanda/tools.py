from langchain.tools import tool

from src.community.lightpanda.lightpanda_client import LightpandaClient
from src.config import get_app_config
from src.utils.readability import ReadabilityExtractor

readability_extractor = ReadabilityExtractor()


@tool("web_fetch", parse_docstring=True)
def web_fetch_tool(url: str) -> str:
    """Fetch the contents of a web page at a given URL using a headless browser with full JavaScript rendering.
    This tool renders the page like a real browser, so it works with single-page applications (SPAs) and
    pages that load content dynamically via JavaScript.
    Only fetch EXACT URLs that have been provided directly by the user or have been returned in results from the web_search and web_fetch tools.
    This tool can NOT access content that requires authentication, such as private Google Docs or pages behind login walls.
    Do NOT add www. to URLs that do NOT have them.
    URLs must include the schema: https://example.com is a valid URL while example.com is an invalid URL.

    Args:
        url: The URL to fetch the contents of.
    """
    config = get_app_config().get_tool_config("web_fetch")
    timeout = 30
    if config is not None:
        timeout = config.model_extra.get("timeout", timeout)

    client = LightpandaClient()
    html_content = client.fetch(url, timeout=timeout)

    if html_content.startswith("Error:"):
        return html_content

    article = readability_extractor.extract_article(html_content)
    return article.to_markdown()[:4096]


@tool("web_search", parse_docstring=True)
def web_search_tool(query: str) -> str:
    """Search the web using a headless browser.
    Performs a DuckDuckGo search with full JavaScript rendering via Lightpanda,
    then extracts and returns the search results.

    Args:
        query: The query to search for.
    """
    import json
    import re

    config = get_app_config().get_tool_config("web_search")
    max_results = 5
    timeout = 30
    if config is not None:
        max_results = config.model_extra.get("max_results", max_results)
        timeout = config.model_extra.get("timeout", timeout)

    search_url = f"https://html.duckduckgo.com/html/?q={query}"
    client = LightpandaClient()
    html_content = client.fetch(search_url, timeout=timeout)

    if html_content.startswith("Error:"):
        return html_content

    results = []
    # Parse DuckDuckGo HTML results
    result_pattern = re.compile(
        r'<a[^>]+class="result__a"[^>]+href="([^"]*)"[^>]*>(.*?)</a>.*?'
        r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>',
        re.DOTALL,
    )

    for match in result_pattern.finditer(html_content):
        if len(results) >= max_results:
            break
        url = match.group(1).strip()
        title = re.sub(r"<[^>]+>", "", match.group(2)).strip()
        snippet = re.sub(r"<[^>]+>", "", match.group(3)).strip()

        # DuckDuckGo wraps URLs in a redirect — extract the actual URL
        if "uddg=" in url:
            from urllib.parse import parse_qs, urlparse

            parsed = urlparse(url)
            qs = parse_qs(parsed.query)
            if "uddg" in qs:
                url = qs["uddg"][0]

        results.append({"title": title, "url": url, "snippet": snippet})

    if not results:
        # Fallback: try simpler pattern for basic link extraction
        link_pattern = re.compile(r'<a[^>]+class="result__url"[^>]*href="([^"]*)"[^>]*>(.*?)</a>', re.DOTALL)
        for match in link_pattern.finditer(html_content):
            if len(results) >= max_results:
                break
            url = match.group(1).strip()
            title = re.sub(r"<[^>]+>", "", match.group(2)).strip()
            results.append({"title": title, "url": url, "snippet": ""})

    return json.dumps(results, indent=2, ensure_ascii=False)
