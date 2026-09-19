import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
from src.main import app 

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


# HEALTH

@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["service"] == "astra-api"


# SATELLITES

@pytest.mark.asyncio
async def test_satellites_returns_list(client):
    r = await client.get("/satellites")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_satellites_structure():
    from src.routes import satellites as sat_route
    sat_route._tle_cache = [
        {"name": "ISS (ZARYA)", "norad_id": 25544, "line1": "1 25544U", "line2": "2 25544"}
    ]
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        r = await c.get("/satellites")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    sat = data[0]
    assert "name"     in sat
    assert "norad_id" in sat
    assert "line1"    in sat
    assert "line2"    in sat


# FLIGHTS

@pytest.mark.asyncio
async def test_flights_returns_list(client):
    r = await client.get("/flights")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_flights_cached():
    from src.routes import flights as fl_route
    import time
    fl_route._flight_cache = [
        {
            "icao24": "abc123", "callsign": "TEST01",
            "origin_country": "UK", "latitude": 51.5,
            "longitude": -0.1, "baro_altitude": 10000,
            "on_ground": False, "velocity": 250,
            "true_track": 90, "time_position": time.time(),
        }
    ]
    fl_route._flight_fetched_at = time.time()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        r = await c.get("/flights")

    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["icao24"] == "abc123"


# EARTHQUAKES

@pytest.mark.asyncio
async def test_earthquakes_returns_list(client):
    r = await client.get("/earthquakes")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_earthquakes_cached():
    from src.routes import earthquakes as eq_route
    import time
    eq_route._quake_cache = [
        {
            "id": "us7000test", "mag": 5.2, "place": "100 km NW of London",
            "time": time.time() * 1000, "tsunami": False,
            "lat": 52.0, "lon": -1.5, "depth_km": 10.0,
        }
    ]
    eq_route._quake_fetched_at = time.time()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        r = await c.get("/earthquakes")

    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["mag"] == 5.2


# FIRES

@pytest.mark.asyncio
async def test_fires_returns_list(client):
    r = await client.get("/fires")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# LAUNCHES

@pytest.mark.asyncio
async def test_launches_returns_list(client):
    r = await client.get("/launches")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_launches_structure():
    from src.routes import launches as la_route
    import time
    la_route._launch_cache = [
        {
            "id": "launch_001", "name": "Falcon 9 | Starlink",
            "provider": "SpaceX", "vehicle": "Falcon 9",
            "pad": "SLC-40", "lat": 28.56, "lon": -80.57,
            "net": "2026-09-20T00:00:00Z", "status": "Go",
            "description": "Starlink Group 6-1",
        }
    ]
    la_route._launch_fetched_at = time.time()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        r = await c.get("/launches")

    data = r.json()
    assert len(data) == 1
    assert data[0]["provider"] == "SpaceX"


# ANOMALIES

@pytest.mark.asyncio
async def test_anomalies_returns_list(client):
    r = await client.get("/anomalies")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_anomalies_detects_large_quake():
    from src.routes import earthquakes as eq_route
    from src.routes import flights     as fl_route
    from src.routes import fires       as fi_route
    import time

    eq_route._quake_cache = [
        {
            "id": "big_one", "mag": 7.5, "place": "Pacific Ocean",
            "time": time.time() * 1000, "tsunami": True,
            "lat": 35.0, "lon": 140.0, "depth_km": 30.0,
        }
    ]
    fl_route._flight_cache = []
    fi_route._fire_cache   = []

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        r = await c.get("/anomalies")

    data = r.json()
    assert len(data) >= 1
    top = data[0]
    assert top["severity"] in ("high", "critical")
    assert top["type"] == "seismic_swarm"
    assert "7.5" in top["title"]


@pytest.mark.asyncio
async def test_anomalies_sorted_by_severity():
    from src.routes import earthquakes as eq_route
    from src.routes import flights     as fl_route
    from src.routes import fires       as fi_route
    import time

    now = time.time() * 1000
    eq_route._quake_cache = [
        {"id": "a", "mag": 7.8, "place": "Japan", "time": now, "tsunami": False, "lat": 35.0, "lon": 139.0, "depth_km": 10.0},
        {"id": "b", "mag": 6.1, "place": "Italy", "time": now, "tsunami": False, "lat": 42.0, "lon":  13.0, "depth_km": 15.0},
    ]
    fl_route._flight_cache = []
    fi_route._fire_cache   = []

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        r = await c.get("/anomalies")

    data = r.json()
    assert len(data) >= 1
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    severities = [order[d["severity"]] for d in data]
    assert severities == sorted(severities)


# CHANGE DETECTION

@pytest.mark.asyncio
async def test_change_detection_valid(client):
    r = await client.get("/change-detection?lat=51.5&lon=-0.1&radius=50&before=2026-07-01&after=2026-08-01")
    assert r.status_code == 200
    data = r.json()
    assert "change_score"    in data
    assert "change_type"     in data
    assert "confidence"      in data
    assert "change_area_km2" in data
    assert "description"     in data


@pytest.mark.asyncio
async def test_change_detection_invalid_dates(client):
    r = await client.get("/change-detection?lat=51.5&lon=-0.1&before=2026-08-01&after=2026-07-01")
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_change_detection_invalid_lat(client):
    r = await client.get("/change-detection?lat=999&lon=0")
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_change_detection_bbox_returned(client):
    r = await client.get("/change-detection?lat=48.8&lon=2.3&radius=100&before=2026-06-01&after=2026-08-01")
    assert r.status_code == 200
    data = r.json()
    assert "bbox" in data
    bbox = data["bbox"]
    assert bbox["min_lat"] < 48.8 < bbox["max_lat"]
    assert bbox["min_lon"] < 2.3  < bbox["max_lon"]


# BRIEFING

@pytest.mark.asyncio
async def test_briefing_no_data(client):
    from src.routes import earthquakes as eq_route
    from src.routes import flights     as fl_route
    from src.routes import fires       as fi_route
    from src.routes import launches    as la_route

    eq_route._quake_cache  = []
    fl_route._flight_cache = []
    fi_route._fire_cache   = []
    la_route._launch_cache = []

    r = await client.get("/briefing?lat=0&lon=0&radius=500")
    assert r.status_code == 200
    data = r.json()
    assert "summary" in data
    assert "sources" in data
    assert isinstance(data["sources"], list)
    assert "normal parameters" in data["summary"].lower() or len(data["summary"]) > 20


@pytest.mark.asyncio
async def test_briefing_with_earthquakes():
    from src.routes import earthquakes as eq_route
    from src.routes import flights     as fl_route
    from src.routes import fires       as fi_route
    from src.routes import launches    as la_route
    import time

    eq_route._quake_cache = [
        {"id": "t1", "mag": 5.5, "place": "Test Region", "time": time.time() * 1000,
         "tsunami": False, "lat": 10.0, "lon": 10.0, "depth_km": 20.0},
    ]
    fl_route._flight_cache = []
    fi_route._fire_cache   = []
    la_route._launch_cache = []

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        r = await c.get("/briefing?lat=10&lon=10&radius=500")

    assert r.status_code == 200
    data = r.json()
    assert "summary" in data
    assert "USGS" in data["sources"]


@pytest.mark.asyncio
async def test_briefing_radius_filter():
    """Items outside the radius should not appear in the briefing."""
    from src.routes import earthquakes as eq_route
    from src.routes import flights     as fl_route
    from src.routes import fires       as fi_route
    from src.routes import launches    as la_route
    import time

    # Earthquake far away from query point (>500 km)
    eq_route._quake_cache = [
        {"id": "far", "mag": 6.0, "place": "Far Away", "time": time.time() * 1000,
         "tsunami": False, "lat": 80.0, "lon": 80.0, "depth_km": 10.0},
    ]
    fl_route._flight_cache = []
    fi_route._fire_cache   = []
    la_route._launch_cache = []

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        r = await c.get("/briefing?lat=0&lon=0&radius=500")

    data = r.json()
    assert "USGS" not in data["sources"]


# ANOMALY DETECTOR UNIT TESTS

class TestAnomalyDetector:
    def test_haversine_same_point(self):
        from src.services.anomaly_detector import haversine
        assert haversine(51.5, -0.1, 51.5, -0.1) == 0.0

    def test_haversine_known_distance(self):
        from src.services.anomaly_detector import haversine
        # London to Paris ~341 km
        dist = haversine(51.5074, -0.1278, 48.8566, 2.3522)
        assert 330 < dist < 360

    def test_detect_large_earthquakes_filters_small(self):
        from src.services.anomaly_detector import detect_large_earthquakes
        import time
        quakes = [
            {"id": "s", "mag": 4.5, "place": "X", "time": time.time() * 1000,
             "tsunami": False, "lat": 0, "lon": 0, "depth_km": 10},
        ]
        result = detect_large_earthquakes(quakes)
        assert result == []

    def test_detect_large_earthquakes_flags_m6(self):
        from src.services.anomaly_detector import detect_large_earthquakes
        import time
        quakes = [
            {"id": "big", "mag": 6.5, "place": "Pacific", "time": time.time() * 1000,
             "tsunami": False, "lat": 35.0, "lon": 140.0, "depth_km": 30},
        ]
        result = detect_large_earthquakes(quakes)
        assert len(result) == 1
        assert result[0].severity == "high"

    def test_detect_large_earthquakes_critical_at_m8(self):
        from src.services.anomaly_detector import detect_large_earthquakes
        import time
        quakes = [
            {"id": "massive", "mag": 8.2, "place": "Cascadia", "time": time.time() * 1000,
             "tsunami": True, "lat": 47.0, "lon": -125.0, "depth_km": 15},
        ]
        result = detect_large_earthquakes(quakes)
        assert result[0].severity == "critical"

    def test_seismic_swarm_requires_three(self):
        from src.services.anomaly_detector import detect_seismic_swarms
        import time
        now = time.time() * 1000
        quakes = [
            {"id": "q1", "mag": 3.0, "place": "X", "time": now, "lat": 35.0, "lon": 139.0, "depth_km": 10},
            {"id": "q2", "mag": 2.8, "place": "X", "time": now, "lat": 35.1, "lon": 139.1, "depth_km": 10},
        ]
        result = detect_seismic_swarms(quakes)
        assert result == []

    def test_seismic_swarm_detects_cluster(self):
        from src.services.anomaly_detector import detect_seismic_swarms
        import time
        now = time.time() * 1000
        quakes = [
            {"id": f"q{i}", "mag": 3.0, "place": "Japan", "time": now, "lat": 35.0 + i * 0.01, "lon": 139.0, "depth_km": 10}
            for i in range(5)
        ]
        result = detect_seismic_swarms(quakes)
        assert len(result) == 1
        assert result[0].severity == "medium"

    def test_fire_cluster_requires_frp_threshold(self):
        from src.services.anomaly_detector import detect_fire_clusters
        fires = [
            {"lat": 10.0 + i * 0.01, "lon": 20.0, "frp": 10.0}
            for i in range(15)
        ]
        result = detect_fire_clusters(fires)
        # total FRP = 150 MW, below 500 threshold
        assert result == []

    def test_fire_cluster_detects_high_frp(self):
        from src.services.anomaly_detector import detect_fire_clusters
        fires = [
            {"lat": 10.0 + i * 0.01, "lon": 20.0, "frp": 100.0}
            for i in range(15)
        ]
        result = detect_fire_clusters(fires)
        # total FRP = 1500 MW
        assert len(result) == 1
        assert result[0].type == "activity_cluster"

    def test_run_all_returns_dicts(self):
        from src.services.anomaly_detector import run_all
        result = run_all(earthquakes=[], flights=[], vessels=[], fires=[])
        assert isinstance(result, list)
        if result:
            assert isinstance(result[0], dict)

    def test_run_all_sorted(self):
        from src.services.anomaly_detector import run_all
        import time
        now = time.time() * 1000
        quakes = [
            {"id": "m7", "mag": 7.5, "place": "A", "time": now, "tsunami": False, "lat": 35.0, "lon": 139.0, "depth_km": 10},
            {"id": "m6", "mag": 6.2, "place": "B", "time": now, "tsunami": False, "lat": 42.0, "lon": 13.0,  "depth_km": 15},
        ]
        result = run_all(earthquakes=quakes, flights=[], vessels=[], fires=[])
        order  = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        sevs   = [order[r["severity"]] for r in result]
        assert sevs == sorted(sevs)


# SENTINEL UNIT TESTS

class TestSentinel:
    def test_bbox_wkt(self):
        from src.services.sentinel import BBox
        bbox = BBox(min_lat=48.0, min_lon=1.0, max_lat=49.0, max_lon=2.0)
        wkt  = bbox.wkt()
        assert wkt.startswith("POLYGON((")
        assert "48.0" in wkt
        assert "49.0" in wkt

    def test_bbox_area(self):
        from src.services.sentinel import BBox
        bbox = BBox(min_lat=0.0, min_lon=0.0, max_lat=1.0, max_lon=1.0)
        area = bbox.area_km2()
        # ~111 x 111 km = ~12321 km²
        assert 10000 < area < 15000

    def test_bbox_cache_key_stable(self):
        from src.services.sentinel import BBox
        b1 = BBox(min_lat=48.0, min_lon=1.0, max_lat=49.0, max_lon=2.0)
        b2 = BBox(min_lat=48.0, min_lon=1.0, max_lat=49.0, max_lon=2.0)
        assert b1.cache_key() == b2.cache_key()

    def test_estimate_change_no_products(self):
        from src.services.sentinel import BBox, estimate_change
        bbox   = BBox(min_lat=48.0, min_lon=1.0, max_lat=49.0, max_lon=2.0)
        result = estimate_change([], [], bbox, "2026-06-01", "2026-08-01")
        assert result.error is not None
        assert result.change_score == 0.0

    def test_estimate_change_with_products(self):
        from src.services.sentinel import BBox, estimate_change
        bbox    = BBox(min_lat=48.0, min_lon=1.0, max_lat=49.0, max_lon=2.0)
        mock_p  = [{"Id": "abc123", "Attributes": [{"Name": "cloudCover", "Value": 5.0}]}]
        result  = estimate_change(mock_p, mock_p, bbox, "2026-03-01", "2026-08-01")
        assert result.change_score > 0.0
        assert result.change_type in ("construction", "vegetation", "water", "fire", "unknown")
        assert result.confidence in ("low", "medium", "high")

    def test_infer_change_type_tropical(self):
        from src.services.sentinel import BBox, infer_change_type
        bbox = BBox(min_lat=-5.0, min_lon=0.0, max_lat=5.0, max_lon=10.0)
        ct   = infer_change_type(bbox, 30)
        assert ct in ("vegetation", "fire")

    def test_infer_change_type_arctic(self):
        from src.services.sentinel import BBox, infer_change_type
        bbox = BBox(min_lat=70.0, min_lon=0.0, max_lat=80.0, max_lon=10.0)
        ct   = infer_change_type(bbox, 30)
        assert ct == "water"


# BRIEFING SERVICE UNIT TESTS

class TestBriefingService:
    def test_filter_region_by_distance(self):
        from src.services.briefing import filter_region
        items = [
            {"lat": 51.5, "lon": -0.1},   # London — within 100km
            {"lat": 53.5, "lon": -2.2},   # Manchester — ~260km away
        ]
        result = filter_region(items, 51.5, -0.1, 100)
        assert len(result) == 1
        assert result[0]["lat"] == 51.5

    def test_filter_region_missing_coords(self):
        from src.services.briefing import filter_region
        items  = [{"name": "no coords"}, {"lat": 0.0, "lon": 0.0}]
        result = filter_region(items, 0.0, 0.0, 100)
        assert len(result) == 1

    def test_fallback_briefing_empty(self):
        from src.services.briefing import fallback_briefing, RegionContext
        ctx    = RegionContext(lat=0, lon=0, radius_km=500, earthquakes=[], flights=[], vessels=[], fires=[], anomalies=[], launches=[])
        result = fallback_briefing(ctx)
        assert "summary" in result
        assert "sources" in result
        assert result["ai"]     is False
        assert result["model"]  is None
        assert "normal parameters" in result["summary"].lower()

    def test_fallback_briefing_with_data(self):
        from src.services.briefing import fallback_briefing, RegionContext
        import time
        ctx = RegionContext(
            lat=0, lon=0, radius_km=500,
            earthquakes=[{"id": "x", "mag": 5.5, "place": "Test", "time": time.time() * 1000, "tsunami": False, "lat": 0, "lon": 0, "depth_km": 10}],
            flights=[{"latitude": 0, "longitude": 0, "on_ground": False, "is_military": False}],
            vessels=[],
            fires=[],
            anomalies=[],
            launches=[],
        )
        result = fallback_briefing(ctx)
        assert "Seismic" in result["summary"]
        assert "Aviation" in result["summary"]
        assert "USGS"    in result["sources"]
        assert "OpenSky" in result["sources"]

    def test_build_context_summary_empty(self):
        from src.services.briefing import build_context_summary, RegionContext
        ctx  = RegionContext(lat=51.5, lon=-0.1, radius_km=200, earthquakes=[], flights=[], vessels=[], fires=[], anomalies=[], launches=[])
        text = build_context_summary(ctx)
        assert "51.500" in text
        assert "No significant activity" in text

    def test_build_context_summary_with_quake(self):
        from src.services.briefing import build_context_summary, RegionContext
        import time
        ctx = RegionContext(
            lat=35.0, lon=139.0, radius_km=500,
            earthquakes=[{"id": "j1", "mag": 6.8, "place": "Japan", "time": time.time() * 1000, "tsunami": True, "lat": 35.0, "lon": 139.0, "depth_km": 30}],
            flights=[], vessels=[], fires=[], anomalies=[], launches=[],
        )
        text = build_context_summary(ctx)
        assert "Seismic" in text
        assert "6.8"     in text