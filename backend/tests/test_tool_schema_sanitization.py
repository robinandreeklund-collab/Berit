"""Tests for tool schema sanitization.

Ensures all tool parameter descriptions are non-null so LM Studio's
JavaScript Jinja engine does not crash with:
"Cannot read properties of null (reading 'description')"
"""

from unittest.mock import patch

import pytest
from pydantic import BaseModel, Field

from src.tools.tools import _sanitize_tool_schemas


class _SchemaWithMissing(BaseModel):
    """Test schema where some params lack descriptions."""

    good_param: str = Field(description="Has a description")
    bad_param: str = Field(default="val")
    also_bad: int = 42


class _SchemaAllGood(BaseModel):
    """Test schema where all params have descriptions."""

    alpha: str = Field(description="Alpha param")
    beta: int = Field(description="Beta param")


class _FakeTool:
    """Minimal stand-in for a LangChain BaseTool."""

    def __init__(self, name: str, args_schema):
        self.name = name
        self.args_schema = args_schema


class TestSanitizeToolSchemas:
    def test_adds_description_to_params_missing_it(self):
        tool = _FakeTool("test_tool", _SchemaWithMissing)
        _sanitize_tool_schemas([tool])

        fields = _SchemaWithMissing.model_fields
        assert fields["good_param"].description == "Has a description"
        assert fields["bad_param"].description is not None
        assert fields["also_bad"].description is not None

    def test_preserves_existing_descriptions(self):
        tool = _FakeTool("test_tool", _SchemaAllGood)
        _sanitize_tool_schemas([tool])

        fields = _SchemaAllGood.model_fields
        assert fields["alpha"].description == "Alpha param"
        assert fields["beta"].description == "Beta param"

    def test_handles_tool_without_args_schema(self):
        tool = _FakeTool("no_schema", None)
        result = _sanitize_tool_schemas([tool])
        assert len(result) == 1  # no crash

    def test_returns_same_list(self):
        tools = [_FakeTool("a", _SchemaAllGood), _FakeTool("b", None)]
        result = _sanitize_tool_schemas(tools)
        assert result is tools
