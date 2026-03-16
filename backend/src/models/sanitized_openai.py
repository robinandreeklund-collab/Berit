"""ChatOpenAI wrapper that sanitizes and hardens tool schemas for LM Studio.

Two responsibilities:

1. **Description sanitization** — LM Studio's JavaScript Jinja template engine
   crashes with "Cannot read properties of null (reading 'description')" when
   any tool parameter (or nested schema property) has a null/missing description
   field.  We recursively ensure every property has a non-null description.

2. **Strict mode enforcement** — Setting ``strict: true`` on each tool
   definition tells LM Studio to use grammar-based constrained decoding
   (GBNF for GGUF models, Outlines for MLX) so the model's output is
   guaranteed to match the JSON schema.  This dramatically improves
   tool-call reliability with local models like Nemotron 3 Nano.
"""

import logging
from typing import Any

from langchain_core.language_models import LanguageModelInput
from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)


def _sanitize_schema(schema: Any, path: str = "") -> Any:
    """Recursively sanitize a JSON Schema, ensuring all properties have descriptions."""
    if not isinstance(schema, dict):
        return schema

    # Ensure this dict has a description if it looks like a schema/property
    if "type" in schema and "description" not in schema:
        schema["description"] = path.rsplit(".", 1)[-1] if path else ""

    # Sanitize properties
    if "properties" in schema and isinstance(schema["properties"], dict):
        for prop_name, prop_schema in list(schema["properties"].items()):
            if prop_schema is None:
                schema["properties"][prop_name] = {"type": "string", "description": prop_name}
            elif isinstance(prop_schema, dict):
                if "description" not in prop_schema or prop_schema["description"] is None:
                    prop_schema["description"] = prop_name
                _sanitize_schema(prop_schema, f"{path}.{prop_name}" if path else prop_name)

    # Sanitize nested schemas
    for key in ("items", "additionalProperties"):
        if key in schema and isinstance(schema[key], dict):
            _sanitize_schema(schema[key], f"{path}.{key}" if path else key)

    # Sanitize allOf, anyOf, oneOf
    for key in ("allOf", "anyOf", "oneOf"):
        if key in schema and isinstance(schema[key], list):
            for i, sub in enumerate(schema[key]):
                if isinstance(sub, dict):
                    _sanitize_schema(sub, f"{path}.{key}[{i}]" if path else f"{key}[{i}]")

    return schema


def _make_strict_compatible(schema: dict) -> dict:
    """Prepare a JSON Schema for strict mode.

    OpenAI strict mode requires:
    - ``additionalProperties: false`` on every object
    - All properties listed in ``required``
    - No unsupported keywords (``default`` is stripped)

    The schema is modified **in-place** and returned for convenience.
    """
    if not isinstance(schema, dict):
        return schema

    if schema.get("type") == "object" or "properties" in schema:
        schema["additionalProperties"] = False
        if "properties" in schema:
            schema["required"] = list(schema["properties"].keys())
            for prop in schema["properties"].values():
                if isinstance(prop, dict):
                    prop.pop("default", None)
                    _make_strict_compatible(prop)

    # Recurse into nested schemas
    for key in ("items", "additionalProperties"):
        if key in schema and isinstance(schema[key], dict):
            _make_strict_compatible(schema[key])

    for key in ("allOf", "anyOf", "oneOf"):
        if key in schema and isinstance(schema[key], list):
            for sub in schema[key]:
                if isinstance(sub, dict):
                    _make_strict_compatible(sub)

    return schema


def _sanitize_tools(tools: list[dict]) -> list[dict]:
    """Sanitize all tool definitions and enable strict mode."""
    for tool in tools:
        if not isinstance(tool, dict):
            continue
        func = tool.get("function", tool)
        if not isinstance(func, dict):
            continue
        # Ensure function description exists
        if "description" not in func or func["description"] is None:
            func["description"] = func.get("name", "tool")
        # Sanitize parameters schema
        params = func.get("parameters")
        if isinstance(params, dict):
            _sanitize_schema(params, "parameters")
            _make_strict_compatible(params)
        # Enable strict mode for grammar-based constrained decoding
        func["strict"] = True
    return tools


class SanitizedChatOpenAI(ChatOpenAI):
    """ChatOpenAI that sanitizes tool schemas before sending to the API.

    Drop-in replacement for ChatOpenAI. Use in config.yaml:
        use: src.models.sanitized_openai:SanitizedChatOpenAI
    """

    def _get_request_payload(
        self,
        input_: LanguageModelInput,
        *,
        stop: list[str] | None = None,
        **kwargs: Any,
    ) -> dict:
        payload = super()._get_request_payload(input_, stop=stop, **kwargs)
        if "tools" in payload and isinstance(payload["tools"], list):
            _sanitize_tools(payload["tools"])
        return payload
