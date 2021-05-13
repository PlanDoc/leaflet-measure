// calc.js
// measure calculations

import length from '@turf/length';
import area from '@turf/area';

function pad(num) {
  return num < 10 ? '0' + num.toString() : num.toString();
}

function ddToDms(coordinate, posSymbol, negSymbol) {
  const dd = Math.abs(coordinate),
    d = Math.floor(dd),
    m = Math.floor((dd - d) * 60),
    s = Math.round((dd - d - m / 60) * 3600 * 100) / 100,
    directionSymbol = dd === coordinate ? posSymbol : negSymbol;
  return pad(d) + '&deg; ' + pad(m) + "' " + pad(s) + '" ' + directionSymbol;
}

/* calc measurements for an array of points */
export default function calc(latlngs, map, ppm) {
  const last = latlngs[latlngs.length - 1];
  const path = latlngs.map(latlng => [latlng.lat, latlng.lng]);

  const polyline = L.polyline(path),
    polygon = L.polygon(path);
  const meters = getMeters(latlngs, map, ppm, polyline);
  const sqMeters = getArea(latlngs, map, ppm, polygon);

  return {
    lastCoord: {
      dd: {
        x: last.lng,
        y: last.lat
      },
      dms: {
        x: ddToDms(last.lng, 'E', 'W'),
        y: ddToDms(last.lat, 'N', 'S')
      }
    },
    length: meters,
    area: sqMeters
  };
}

function getMeters(latlngs, map, ppm, polyline) {
  let meters;
  if (isSimpleMap(map)) {
    if (!ppm) ppm = 1;
    meters = 0;
    if (latlngs) {
      for (let i = 0; i < latlngs.length - 1; i++) {
        meters += map.options.crs.distance(latlngs[i], latlngs[i + 1]);
      }
    }
    meters = meters / ppm;
  } else {
    meters = length(polyline.toGeoJSON(), { units: 'kilometers' }) * 1000;
  }
  return meters;
}

function getArea(latlngs, map, ppm, polygon) {
  let res;
  if (isSimpleMap(map)) {
    if (!ppm) ppm = 1;
    res = calcPolygonArea(latlngs) / (ppm * ppm);
  } else {
    res = area(polygon.toGeoJSON());
  }
  return res;
}

function calcPolygonArea(vertices) {
  let total = 0;

  for (let i = 0, l = vertices.length; i < l; i++) {
    const addX = vertices[i].lat;
    const addY = vertices[i === vertices.length - 1 ? 0 : i + 1].lng;
    const subX = vertices[i === vertices.length - 1 ? 0 : i + 1].lat;
    const subY = vertices[i].lng;

    total += addX * addY * 0.5;
    total -= subX * subY * 0.5;
  }

  return Math.abs(total);
}

function isSimpleMap(map) {
  return map && map.options && map.options.crs === L.CRS.Simple;
}
