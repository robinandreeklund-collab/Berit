"""Tests for SanitizedChatOpenAI tool schema sanitization and strict mode.

Verifies that all tool schemas sent to LM Studio have non-null descriptions
at every level of the JSON Schema tree, and that strict mode is enabled with
the required schema constraints (additionalProperties, required, no defaults).
"""

from src.models.sanitized_openai import _make_strict_compatible, _sanitize_schema, _sanitize_tools


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


class TestMakeStrictCompatible:
    def test_sets_additional_properties_false(self):
        schema = {"type": "object", "properties": {"a": {"type": "string"}}}
        _make_strict_compatible(schema)
        assert schema["additionalProperties"] is False

    def test_sets_required_to_all_properties(self):
        schema = {"type": "object", "properties": {"a": {"type": "string"}, "b": {"type": "integer"}}}
        _make_strict_compatible(schema)
        assert set(schema["required"]) == {"a", "b"}

    def test_strips_default_values(self):
        schema = {"type": "object", "properties": {"lang": {"type": "string", "default": "sv"}}}
        _make_strict_compatible(schema)
        assert "default" not in schema["properties"]["lang"]

    def test_recurses_into_nested_objects(self):
        schema = {
            "type": "object",
            "properties": {
                "nested": {
                    "type": "object",
                    "properties": {
                        "inner": {"type": "string", "default": "x"},
                    },
                },
            },
        }
        _make_strict_compatible(schema)
        nested = schema["properties"]["nested"]
        assert nested["additionalProperties"] is False
        assert nested["required"] == ["inner"]
        assert "default" not in nested["properties"]["inner"]

    def test_recurses_into_array_items(self):
        schema = {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"val": {"type": "string"}},
            },
        }
        _make_strict_compatible(schema)
        assert schema["items"]["additionalProperties"] is False

    def test_recurses_into_anyof(self):
        schema = {
            "anyOf": [
                {"type": "object", "properties": {"x": {"type": "string"}}},
                {"type": "string"},
            ]
        }
        _make_strict_compatible(schema)
        assert schema["anyOf"][0]["additionalProperties"] is False

    def test_handles_non_dict(self):
        assert _make_strict_compatible("not a dict") == "not a dict"

    def test_handles_schema_without_properties(self):
        schema = {"type": "string"}
        _make_strict_compatible(schema)
        assert "additionalProperties" not in schema


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

    def test_enables_strict_mode(self):
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "my_tool",
                    "description": "A tool",
                    "parameters": {
                        "type": "object",
                        "properties": {"q": {"type": "string", "description": "query"}},
                    },
                },
            }
        ]
        _sanitize_tools(tools)
        assert tools[0]["function"]["strict"] is True

    def test_strict_mode_adds_required_and_no_additional(self):
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "my_tool",
                    "description": "A tool",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "a": {"type": "string", "description": "a"},
                            "b": {"type": "integer", "description": "b"},
                        },
                    },
                },
            }
        ]
        _sanitize_tools(tools)
        params = tools[0]["function"]["parameters"]
        assert params["additionalProperties"] is False
        assert set(params["required"]) == {"a", "b"}

    def test_strict_mode_strips_defaults(self):
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "my_tool",
                    "description": "A tool",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "lang": {"type": "string", "description": "language", "default": "sv"},
                        },
                    },
                },
            }
        ]
        _sanitize_tools(tools)
        assert "default" not in tools[0]["function"]["parameters"]["properties"]["lang"]

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
