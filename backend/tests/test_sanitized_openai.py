"""Tests for SanitizedChatOpenAI tool schema sanitization.

Verifies that all tool schemas sent to LM Studio have non-null descriptions
at every level of the JSON Schema tree.
"""

from src.models.sanitized_openai import _sanitize_schema, _sanitize_tools


class TestSanitizeSchema:
    def test_adds_missing_property_descriptions(self):
        schema = {
            "type": "object",
            "properties": {
                "language": {"type": "string", "default": "sv"},
                "query": {"type": "string", "description": "Search term"},
            },
        }
        _sanitize_schema(schema)
        assert schema["properties"]["language"]["description"] == "language"
        assert schema["properties"]["query"]["description"] == "Search term"

    def test_fixes_null_property_descriptions(self):
        schema = {
            "type": "object",
            "properties": {
                "param": {"type": "string", "description": None},
            },
        }
        _sanitize_schema(schema)
        assert schema["properties"]["param"]["description"] == "param"

    def test_handles_null_property_value(self):
        schema = {
            "type": "object",
            "properties": {
                "bad": None,
            },
        }
        _sanitize_schema(schema)
        assert schema["properties"]["bad"]["description"] == "bad"
        assert schema["properties"]["bad"]["type"] == "string"

    def test_sanitizes_nested_objects(self):
        schema = {
            "type": "object",
            "properties": {
                "nested": {
                    "type": "object",
                    "properties": {
                        "inner": {"type": "string"},
                    },
                },
            },
        }
        _sanitize_schema(schema)
        assert schema["properties"]["nested"]["description"] == "nested"
        assert schema["properties"]["nested"]["properties"]["inner"]["description"] == "inner"

    def test_sanitizes_items(self):
        schema = {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "val": {"type": "string"},
                },
            },
        }
        _sanitize_schema(schema)
        assert schema["items"]["properties"]["val"]["description"] == "val"

    def test_sanitizes_additional_properties(self):
        schema = {
            "type": "object",
            "additionalProperties": {
                "type": "array",
                "items": {"type": "string"},
            },
        }
        _sanitize_schema(schema)
        # additionalProperties itself should get a description if it has 'type'
        assert "description" in schema["additionalProperties"]


class TestSanitizeTools:
    def test_sanitizes_openai_format_tools(self):
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "test_tool",
                    "description": "A test tool",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "language": {"type": "string", "default": "sv"},
                        },
                    },
                },
            }
        ]
        _sanitize_tools(tools)
        params = tools[0]["function"]["parameters"]
        assert params["properties"]["language"]["description"] == "language"

    def test_fixes_null_function_description(self):
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "no_desc",
                    "description": None,
                    "parameters": {"type": "object", "properties": {}},
                },
            }
        ]
        _sanitize_tools(tools)
        assert tools[0]["function"]["description"] == "no_desc"

    def test_fixes_missing_function_description(self):
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "no_desc",
                    "parameters": {"type": "object", "properties": {}},
                },
            }
        ]
        _sanitize_tools(tools)
        assert tools[0]["function"]["description"] == "no_desc"

    def test_handles_empty_tools_list(self):
        tools = []
        result = _sanitize_tools(tools)
        assert result == []

    def test_handles_non_dict_tools(self):
        tools = [None, "invalid", 42]
        result = _sanitize_tools(tools)
        assert len(result) == 3  # no crash
