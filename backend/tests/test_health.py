"""Tests for the health check endpoint."""
import pytest


@pytest.mark.asyncio
async def test_health_returns_200(client):
    response = await client.get("/api/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_returns_status_ok(client):
    response = await client.get("/api/health")
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_health_returns_version(client):
    response = await client.get("/api/health")
    data = response.json()
    assert "version" in data
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_health_returns_json_content_type(client):
    response = await client.get("/api/health")
    assert "application/json" in response.headers["content-type"]
