import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { radii, spacing, typography, useAppTheme, type ThemeColors } from '../theme';
import type { RouteOption } from '../types/trip';

type Props = {
  routes: RouteOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  origin?: { latitude: number; longitude: number; label?: string };
  destination?: { latitude: number; longitude: number; label?: string };
};

type LatLng = [number, number];

function parseGeometry(value: unknown): LatLng[][] {
  if (!value) return [];
  let geometry: unknown = value;
  if (typeof value === 'string') {
    try {
      geometry = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!geometry || typeof geometry !== 'object') return [];

  const typed = geometry as { type?: string; coordinates?: unknown; geometries?: unknown[] };
  if (typed.type === 'GeometryCollection' && Array.isArray(typed.geometries)) {
    return typed.geometries.flatMap((child) => parseGeometry(child));
  }

  const lines: LatLng[][] = [];
  const pushLine = (line: unknown[]) => {
    const pts: LatLng[] = [];
    for (const point of line) {
      if (Array.isArray(point) && typeof point[0] === 'number' && typeof point[1] === 'number') {
        pts.push([point[1], point[0]]); // GeoJSON [lng,lat] -> Leaflet [lat,lng]
      }
    }
    if (pts.length > 0) lines.push(pts);
  };

  const coords = typed.coordinates;
  if (!Array.isArray(coords)) return lines;
  if (typed.type === 'Point') {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return [[[coords[1] as number, coords[0] as number]]];
    }
    return [];
  }
  if (typed.type === 'LineString') {
    pushLine(coords as unknown[]);
    return lines;
  }
  // MultiLineString / Polygon / MultiPolygon-like nesting
  for (const item of coords) {
    if (!Array.isArray(item)) continue;
    if (item.length > 0 && Array.isArray(item[0]) && typeof item[0][0] === 'number') {
      pushLine(item as unknown[]);
    } else {
      for (const inner of item) {
        if (Array.isArray(inner)) pushLine(inner as unknown[]);
      }
    }
  }
  return lines;
}

function routeLines(route: RouteOption): LatLng[][] {
  const segmentLines = Array.isArray(route.segments)
    ? route.segments.flatMap((s) => parseGeometry(s.geometry))
    : [];
  if (segmentLines.length > 0) return segmentLines;
  return parseGeometry(route.geometry);
}



export function RouteMap({ routes, selectedIndex, onSelect, origin, destination }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const webRef = useRef<any>(null);
  const readyRef = useRef(false);

  const mapData = useMemo(() => {
    return routes.map((route, index) => ({
      index,
      type: route.type || 'Route',
      name: route.name || 'Route option',
      available: route.available,
      lines: routeLines(route),
    }));
  }, [routes]);

  const html = useMemo(() => {
    const dataJson = JSON.stringify(mapData).replace(/</g, '\\u003c');
    const originJson = JSON.stringify(origin ?? null).replace(/</g, '\\u003c');
    const destJson = JSON.stringify(destination ?? null).replace(/</g, '\\u003c');
    const selected = selectedIndex;
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin:0; padding:0; width:100%; height:100%; background:#eef3f1; }
  .leaflet-control-attribution { font-size:10px; }
  .marker-label { background:rgba(15,23,42,0.82); color:#fff; border:none; border-radius:10px; padding:2px 8px; font:600 11px/1.4 -apple-system,BlinkMacSystemFont,sans-serif; box-shadow:none; }
  .marker-label::before { display:none; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const routes = ${dataJson};
  const origin = ${originJson};
  const destination = ${destJson};
  let selectedIndex = ${selected};
  const map = L.map('map', { zoomControl: true, preferCanvas: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);

  const groups = [];
  const allBounds = [];

  function baseColor(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('car') || t.includes('driv')) return '#3B82F6';
    if (t.includes('train') || t.includes('rail')) return '#8B5CF6';
    if (t.includes('bus') || t.includes('coach')) return '#F59E0B';
    if (t.includes('flight') || t.includes('plane')) return '#EF4444';
    if (t.includes('walk') || t.includes('foot') || t.includes('bike') || t.includes('cycl')) return '#10B981';
    return '#64748B';
  }

  function styleFor(route, isSelected) {
    return {
      color: isSelected ? '#0C7A6B' : baseColor(route.type),
      weight: isSelected ? 6 : 4,
      opacity: isSelected ? 0.98 : route.available ? 0.55 : 0.25,
      dashArray: (route.type || '').toLowerCase().includes('flight') ? '8 8' : null,
      lineCap: 'round',
      lineJoin: 'round'
    };
  }

  function bringSelectedToFront() {
    groups.forEach((g, i) => {
      if (!g) return;
      if (i === selectedIndex) g.bringToFront();
    });
  }

  function renderRoutes() {
    groups.forEach(g => g && g.remove());
    groups.length = 0;
    routes.forEach((route, idx) => {
      if (!route.lines || route.lines.length === 0) { groups[idx] = null; return; }
      const group = L.featureGroup();
      route.lines.forEach(line => {
        if (!line || line.length < 2) return;
        const poly = L.polyline(line, styleFor(route, idx === selectedIndex));
        poly.on('click', () => {
          selectedIndex = idx;
          applySelection();
          if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', index: idx }));
        });
        poly.addTo(group);
        line.forEach(pt => allBounds.push(pt));
      });
      group.addTo(map);
      groups[idx] = group;
    });
    bringSelectedToFront();
  }

  function applySelection() {
    routes.forEach((route, idx) => {
      const g = groups[idx];
      if (!g) return;
      g.eachLayer(layer => { if (layer.setStyle) layer.setStyle(styleFor(route, idx === selectedIndex)); });
    });
    bringSelectedToFront();
  }

  function addMarker(pt, label) {
    if (!pt || typeof pt.latitude !== 'number' || typeof pt.longitude !== 'number') return;
    const latlng = [pt.latitude, pt.longitude];
    allBounds.push(latlng);
    L.circleMarker(latlng, { radius: 7, color: '#fff', weight: 2, fillColor: '#0F172A', fillOpacity: 1 }).addTo(map)
      .bindTooltip(label, { permanent: true, direction: 'top', offset: [0, -8], className: 'marker-label' });
  }

  renderRoutes();
  addMarker(origin, origin?.label || 'Origin');
  addMarker(destination, destination?.label || 'Destination');

  if (allBounds.length > 0) {
    map.fitBounds(L.latLngBounds(allBounds), { padding: [28, 28] });
  } else if (origin && destination) {
    map.fitBounds(L.latLngBounds([[origin.latitude, origin.longitude], [destination.latitude, destination.longitude]]), { padding: [28, 28] });
  } else {
    map.setView([20, 0], 2);
  }

  function setSelected(idx) {
    selectedIndex = idx;
    applySelection();
  }

  window.__setSelected = setSelected;
  window.__mapReady = true;
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
</script>
</body>
</html>`;
  }, [mapData, origin, destination]); // eslint-disable-line react-hooks/exhaustive-deps -- initial selection is injected via JS to avoid WebView reloads

  useEffect(() => {
    readyRef.current = false;
  }, [html]);

  useEffect(() => {
    if (!readyRef.current) return;
    const js = `if (window.__setSelected) { window.__setSelected(${selectedIndex}); } true;`;
    webRef.current?.injectJavaScript(js);
  }, [selectedIndex]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type?: string; index?: number };
      if (msg.type === 'ready') {
        readyRef.current = true;
        webRef.current?.injectJavaScript(`if (window.__setSelected) { window.__setSelected(${selectedIndex}); } true;`);
      }
      if (msg.type === 'select' && typeof msg.index === 'number') {
        onSelect(msg.index);
      }
    } catch {
      // ignore malformed messages
    }
  };

  const hasAnyGeometry = mapData.some((r) => r.lines.length > 0);

  return (
    <View style={styles.container}>
      {(() => {
        const MapWebView = WebView as any;
        return (
          <MapWebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html }}
            style={styles.webview}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            setSupportMultipleWindows={false}
          />
        );
      })()}
      {!hasAnyGeometry ? (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <Text style={styles.emptyText}>Route geometry unavailable. You can still select routes below.</Text>
        </View>
      ) : null}
      <View style={styles.legend} pointerEvents="none">
        <Text style={styles.legendText}>Tap a route line to select it</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      height: 280,
      borderRadius: radii.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.lineSoft,
      backgroundColor: colors.canvas,
      marginHorizontal: spacing.screenX,
      marginBottom: spacing.xxl,
    },
    webview: { flex: 1, backgroundColor: 'transparent' },
    emptyOverlay: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      bottom: spacing.md,
      backgroundColor: 'rgba(255,255,255,0.94)',
      borderRadius: radii.sm,
      padding: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.lineSoft,
    },
    emptyText: { ...typography.caption, color: colors.body, textAlign: 'center' },
    legend: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.lineSoft,
    },
    legendText: { fontSize: 11, fontWeight: '600', color: colors.ink },
  });
}
