import moment from 'moment';
import { loadModules } from 'esri-loader';

///////
// originally from: http://www.lizard-tail.com/isana/lab/astro_calc/terminator.js
// perhaps a better one here: https://github.com/kaktus621/google-maps-api-addons/tree/master/daynightoverlay
///////

///////
// originally from: http://www.lizard-tail.com/isana/lab/astro_calc/terminator.js
// perhaps a better one here: https://github.com/kaktus621/google-maps-api-addons/tree/master/daynightoverlay
//
var GST = GST || {};

GST.Time =
  GST.Time ||
  function (date) {
    if (!date) {
      var _date = new Date();
    } else {
      var _date = date;
    }

    var _getUTCArray = function (_date) {
      return {
        year: _date.getUTCFullYear(),
        month: _date.getUTCMonth() + 1,
        day: _date.getUTCDate(),
        hours: _date.getUTCHours(),
        minutes: _date.getUTCMinutes(),
        seconds: _date.getUTCSeconds(),
      };
    };

    var _utc = _getUTCArray(_date);

    var _jd = function () {
      var year = _utc.year;
      var month = _utc.month;
      var day = _utc.day;
      var calender = '';

      if (month <= 2) {
        var year = year - 1;
        var month = month + 12;
      }

      var julian_day =
        Math.floor(365.25 * (year + 4716)) +
        Math.floor(30.6001 * (month + 1)) +
        day -
        1524.5;

      if (calender == 'julian') {
        var transition_offset = 0;
      } else if (calender == 'gregorian') {
        var tmp = Math.floor(year / 100);
        var transition_offset = 2 - tmp + Math.floor(tmp / 4);
      } else if (julian_day < 2299160.5) {
        var transition_offset = 0;
      } else {
        var tmp = Math.floor(year / 100);
        var transition_offset = 2 - tmp + Math.floor(tmp / 4);
      }
      var jd = julian_day + transition_offset;
      return jd;
    };
    var _gmst = function () {
      var rad = Math.PI / 180;
      var time_in_sec = _utc.hours * 3600 + _utc.minutes * 60 + _utc.seconds;
      var jd = _jd();
      //gmst at 0:00
      var t = (jd - 2451545.0) / 36525;
      var gmst_at_zero =
        (24110.5484 +
          8640184.812866 * t +
          0.093104 * t * t +
          0.0000062 * t * t * t) /
        3600;
      if (gmst_at_zero > 24) {
        gmst_at_zero = gmst_at_zero % 24;
      }
      //gmst at target time
      var gmst = gmst_at_zero + (time_in_sec * 1.00273790925) / 3600;
      //mean obliquity of the ecliptic
      var e =
        23 +
        26.0 / 60 +
        21.448 / 3600 -
        (46.815 / 3600) * t -
        (0.00059 / 3600) * t * t +
        (0.001813 / 3600) * t * t * t;
      //nutation in longitude
      var omega =
        125.04452 - 1934.136261 * t + 0.0020708 * t * t + (t * t * t) / 450000;
      var long1 = 280.4665 + 36000.7698 * t;
      var long2 = 218.3165 + 481267.8813 * t;
      var phai =
        -17.2 * Math.sin(omega * rad) -
        -1.32 * Math.sin(2 * long1 * rad) -
        0.23 * Math.sin(2 * long2 * rad) +
        0.21 * Math.sin(2 * omega * rad);
      gmst = gmst + ((phai / 15) * Math.cos(e * rad)) / 3600;
      if (gmst < 0) {
        gmst = (gmst % 24) + 24;
      }
      if (gmst > 24) {
        gmst = gmst % 24;
      }
      return gmst;
    };

    return {
      date: _date,
      year: Number(_utc.year),
      month: Number(_utc.month),
      day: Number(_utc.day),
      hours: Number(_utc.hours),
      minutes: Number(_utc.minutes),
      seconds: Number(_utc.seconds),
      timezone: _date.getTimezoneOffset() / 60,
      jd: _jd,
      gmst: _gmst,
    }; // end of return Orb.Time
  }; // end of Orb.Time

///////
GST.Terminator = function (option) {
  var shade = option.shade;
  var boundary = option.boundary;
  GST.Storage = GST.Storage || {};
  GST.Storage.Terminator = GST.Storage.Terminator || [];
  var rad = Math.PI / 180;

  var _roundAngle = function (angle) {
    if (angle > 360) {
      angle = angle % 360;
    } else if (angle < 0) {
      angle = (angle % 360) + 360;
    } else {
      angle = angle;
    }
    return angle;
  };

  var _getSunPosition = function (time) {
    var time_in_day =
      time.hours / 24 + time.minutes / 1440 + time.seconds / 86400;
    var jd = time.jd() + time_in_day;
    var t = (jd - 2451545.0) / 36525;
    //geometric_mean_longitude
    var mean_longitude = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
    //mean anomaly of the Sun
    var mean_anomaly = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
    //eccentricity of the Earth's orbit
    var eccentricity = 0.016708634 - 0.000042037 * t - 0.0000001267 * t * t;
    //Sun's equation of  the center
    var equation =
      (1.914602 - 0.004817 * t - 0.000014 * t * t) *
      Math.sin(mean_anomaly * rad);
    equation += (0.019993 - 0.000101 * t) * Math.sin(2 * mean_anomaly * rad);
    equation += 0.000289 * Math.sin(3 * mean_anomaly * rad);
    //true longitude of the Sun
    var true_longitude = mean_longitude + equation;
    //true anomary of the Sun
    var true_anomary = mean_anomaly + equation;
    //radius vector, distance between center of the Sun and the Earth
    var radius =
      (1.000001018 * (1 - eccentricity * eccentricity)) /
      (1 + eccentricity * Math.cos(true_anomary * rad));

    var nao = function (t) {
      var omega =
        (125.04452 -
          1934.136261 * t +
          0.0020708 * t * t +
          (t * t + t) / 450000) *
        rad;
      var L0 = (280.4665 + 36000.7698 * t) * rad;
      var L1 = (218.3165 + 481267.8813 * t) * rad;
      var nutation =
        (-17.2 / 3600) * Math.sin(omega) -
        (-1.32 / 3600) * Math.sin(2 * L0) -
        (0.23 / 3600) * Math.sin(2 * L1) +
        ((0.21 / 3600) * Math.sin(2 * omega)) / rad;
      var obliquity_zero =
        23 +
        26.0 / 60 +
        21.448 / 3600 -
        (46.815 / 3600) * t -
        (0.00059 / 3600) * t * t +
        (0.001813 / 3600) * t * t * t;
      var obliquity_delta =
        (9.2 / 3600) * Math.cos(omega) +
        (0.57 / 3600) * Math.cos(2 * L0) +
        (0.1 / 3600) * Math.cos(2 * L1) -
        (0.09 / 3600) * Math.cos(2 * omega);
      var obliquity = obliquity_zero + obliquity_delta;
      return {
        nutation: nutation,
        obliquity: obliquity,
      };
    };
    var nao = new nao(t);
    var nutation = nao.nutation;
    var obliquity = nao.obliquity;
    var apparent_longitude = true_longitude + nutation;
    var longitude = apparent_longitude;

    //right asantion of the Sun
    var ra = Math.atan2(
      Math.cos(obliquity * rad) * Math.sin(longitude * rad),
      Math.cos(longitude * rad)
    );
    ra = _roundAngle(ra / rad) / 15;
    //declination of the Sun
    var dec = Math.asin(Math.sin(obliquity * rad) * Math.sin(longitude * rad));
    dec = dec / rad;
    var distance = radius * 149597870;
    //rectanger
    var x = distance * Math.cos(longitude * rad);
    var y = distance * (Math.sin(longitude * rad) * Math.cos(obliquity * rad));
    var z = distance * (Math.sin(longitude * rad) * Math.sin(obliquity * rad));
    return {
      ra: ra,
      dec: dec,
      distance: distance,
      x: x,
      y: y,
      z: z,
    };
  };

  var _generateArray = function (time) {
    var rad = Math.PI / 180;
    var sun = _getSunPosition(time);
    var sun_ra = sun.ra;
    var sun_dec = sun.dec;
    var gmst = time.gmst();
    var sun_long = -(gmst * 15 - sun_ra * 15);
    if (sun_long > 360) {
      sun_long = sun_long % 360;
    }
    if (sun_long < 0) {
      sun_long = (sun_long % 360) + 360;
    }
    var sun_lat = sun_dec;

    if (sun_lat > 5) {
      var polar_night_flag = 'south';
    } else if (sun_lat < -5) {
      var polar_night_flag = 'north';
    } else {
      var polar_night_flag = 'none';
    }

    var NightCircle = function (start, end, rev) {
      var lat_array = [];
      var lng_array = [];
      for (var i = start; i <= end; i += 1) {
        var delta_lat =
          Math.asin(Math.cos(sun_lat * rad) * Math.sin(i * rad)) / rad;
        if (Math.abs(delta_lat) < 85) {
          var x =
            -Math.cos(sun_long * rad) *
              Math.sin(sun_lat * rad) *
              Math.sin(i * rad) -
            Math.sin(sun_long * rad) * Math.cos(i * rad);
          var y =
            -Math.sin(sun_long * rad) *
              Math.sin(sun_lat * rad) *
              Math.sin(i * rad) +
            Math.cos(sun_long * rad) * Math.cos(i * rad);
          var delta_long = Math.atan2(y, x) / rad;
          if (delta_long > 360) {
            delta_long = delta_long % 360;
          }
          if (delta_long < 0) {
            delta_long = (delta_long % 360) + 360;
          }
          lat_array.push(delta_lat);
          lng_array.push(delta_long);
        }
      }
      if (rev == true) {
        return {
          lat_array: lat_array.reverse(),
          lng_array: lng_array.reverse(),
        };
      } else {
        return {
          lat_array: lat_array,
          lng_array: lng_array,
        };
      }
    };
    var qtr = NightCircle(0, 90, true);
    var latitude_array_east = qtr.lat_array;
    var longitude_array_east = qtr.lng_array;

    var qtr = NightCircle(270, 360, true);
    latitude_array_east = latitude_array_east.concat(qtr.lat_array);
    longitude_array_east = longitude_array_east.concat(qtr.lng_array);

    var qtr = NightCircle(90, 180, false);
    var latitude_array_west = qtr.lat_array;
    var longitude_array_west = qtr.lng_array;

    var qtr = NightCircle(180, 270, false);
    latitude_array_west = latitude_array_west.concat(qtr.lat_array);
    longitude_array_west = longitude_array_west.concat(qtr.lng_array);

    if (sun_lat < 0) {
      latitude_array_west.reverse();
      longitude_array_west.reverse();
    } else if (sun_lat > 0) {
      latitude_array_east.reverse();
      longitude_array_east.reverse();
    }
    var latitude_array = latitude_array_east.concat(latitude_array_west);
    var longitude_array = longitude_array_east.concat(longitude_array_west);
    return {
      latitude_array: latitude_array,
      longitude_array: longitude_array,
      polar_night_flag: polar_night_flag,
    };
  };

  var splitArray = function (night_array) {
    var trm = night_array;
    var lng_array = trm.longitude_array;
    var lat_array = trm.latitude_array;
    var array_length = lng_array.length;
    var start_lng = lng_array[0];
    var last_lng = lng_array[array_length - 1];
    var split_size = 90; //4 parts

    if (start_lng > split_size) {
      var first_split_point =
        Math.floor(start_lng / split_size) * split_size + split_size;
      if (first_split_point <= 0) {
        first_split_point = 360;
      }
    } else {
      var first_split_point = split_size;
    }
    var last_split_point =
      Math.floor(last_lng / split_size) * split_size + split_size;

    var split_latitude = function (lat1, lng1, lat2, lng2, split_lng) {
      if (split_lng == 360) {
        var offset = 360;
      } else {
        var offset = 0;
      }
      var split_lat =
        lat1 + (split_lng - lng1) * ((lat2 - lat1) / (lng2 + offset - lng1));
      return split_lat;
    };

    var splitted_lng_array = [];
    var splitted_lat_array = [];

    var split_latlng_array = function (start, end, split_count, next) {
      for (var sp = start; sp <= end; sp = sp + split_size) {
        splitted_lng_array[split_count] = [];
        splitted_lat_array[split_count] = [];
        for (var i = next; i < array_length; i++) {
          if (sp > lng_array[i] && sp - split_size < lng_array[i]) {
            splitted_lng_array[split_count].push(lng_array[i]);
            splitted_lat_array[split_count].push(lat_array[i]);
          } else {
            var spl_lat = split_latitude(
              lat_array[i - 1],
              lng_array[i - 1],
              lat_array[i],
              lng_array[i],
              sp
            );
            splitted_lng_array[split_count].push(sp);
            splitted_lat_array[split_count].push(spl_lat);
            next = i;
            split_count++;
            break;
          }
        }
      }
      return {
        splitted_lng_array: splitted_lng_array,
        splitted_lat_array: splitted_lat_array,
        split_point: sp,
        split_count: split_count,
        next: next,
      };
    };

    if (start_lng < last_lng) {
      var sp = new split_latlng_array(
        first_split_point,
        last_split_point,
        0,
        0
      );
    } else {
      var sp = new split_latlng_array(first_split_point, 360, 0, 0);
      sp = new split_latlng_array(
        split_size,
        last_split_point,
        sp.split_count,
        sp.next
      );
    }

    var splitted_lng_array = sp.splitted_lng_array;
    var splitted_lat_array = sp.splitted_lat_array;

    var sp_length = splitted_lng_array.length;
    for (var i = 1; i < sp_length; i++) {
      var last_lng =
        splitted_lng_array[i - 1][splitted_lng_array[i - 1].length - 1];
      var last_lat =
        splitted_lat_array[i - 1][splitted_lat_array[i - 1].length - 1];
      if (last_lng == 360) {
        last_lng = 0;
      }
      splitted_lng_array[i].unshift(last_lng);
      splitted_lat_array[i].unshift(last_lat);
    }
    return {
      splitted_lng_array: splitted_lng_array,
      splitted_lat_array: splitted_lat_array,
    };
  };

  var _getTerminator = function (time) {
    var night_array = _generateArray(time);
    var splitted_array = splitArray(night_array);
    var splitted_lng_array = splitted_array.splitted_lng_array;
    var splitted_lat_array = splitted_array.splitted_lat_array;
    var polar_night_flag = night_array.polar_night_flag;

    //Generate Porygon Array
    if (polar_night_flag == 'north') {
      var lat_limit = 85;
    } else if (polar_night_flag == 'south') {
      var lat_limit = -85;
    }

    var _nightPathFactory = function (lng_array, lat_array, start_lat) {
      var polygon = [];
      var polyline = [];
      var lng_array_length = lng_array.length;
      var lat_array_length = lat_array.length;
      if (lng_array[0] > 180) {
        var true_lng = lng_array[0] - 360;
      } else {
        var true_lng = lng_array[0];
      }
      if (true_lng < 0) {
        lat_array.reverse();
        lng_array.reverse();
      }
      if (lng_array_length > 0) {
        if (polar_night_flag != 'none') {
          polygon.push([lat_limit, lng_array[0]]);
        }
        polygon.push([start_lat, lng_array[0]]);
        for (var i = 0; i < lat_array_length; i++) {
          polygon.push([lat_array[i], lng_array[i]]);
          polyline.push([lat_array[i], lng_array[i]]);
        }
        polygon.push([start_lat, lng_array[lng_array_length - 1]]);

        if (polar_night_flag != 'none') {
          polygon.push([lat_limit, lng_array[lng_array_length - 1]]);
        }
        polygon.push(polygon[0]);
        if (
          lat_array[lat_array_length - 1] == lat_array[lat_array_length - 2] &&
          lng_array[lng_array_length - 1] != lng_array[lng_array_length - 2]
        ) {
          polyline.pop();
        }
        if (lat_array[0] == lat_array[1] && lng_array[0] != lng_array[1]) {
          polyline.shift();
        }
      }
      return {
        polygon: polygon,
        polyline: polyline,
      };
    };

    var night_polygon_array = [];
    var night_polyline_array = [];
    var start_lat = splitted_lat_array[0][0];
    var al = splitted_lng_array.length;
    for (var j = 0; j < al; j++) {
      var p = new _nightPathFactory(
        splitted_lng_array[j],
        splitted_lat_array[j],
        start_lat
      );
      night_polygon_array[j] = p.polygon;
      night_polyline_array[j] = p.polyline;
    }
    if (shade) {
      return night_polygon_array;
      // GST.Storage.NightPorigon = [];
      // for (var k1 = 0, npl1 = night_polygon_array.length; k1 < npl1; k1++) {
      //   GST.Storage.NightPorigon[k1] = new google.maps.Polygon({
      //     paths: night_polygon_array[k1],
      //     strokeColor: '#000000',
      //     strokeOpacity: 1,
      //     strokeWeight: 0,
      //     fillColor: '#000000',
      //     fillOpacity: 0.35,
      //     clickable: false,
      //     zIndex: 101,
      //   });
      //   GST.Storage.NightPorigon[k1].setMap(map);
      // }
    }
    if (boundary) {
      return night_polyline_array;
      // GST.Storage.NightBoundaryPolyline = [];
      // for (var k2 = 0, npl2 = night_polyline_array.length; k2 < npl2; k2++) {
      //   GST.Storage.NightBoundaryPolyline[k2] = new google.maps.Polyline({
      //     path: night_polyline_array[k2],
      //     strokeColor: '#000000',
      //     strokeOpacity: 0.5,
      //     strokeWeight: 2,
      //     zIndex: 102,
      //   });
      //   GST.Storage.NightBoundaryPolyline[k2].setMap(map);
      // }
    }
  };

  var _removeTerminator = function () {
    if (shade) {
      for (
        var i = 0, data_length = GST.Storage.NightPorigon.length;
        i < data_length;
        i++
      ) {
        GST.Storage.NightPorigon[i].setMap(null);
      }
    }
    if (boundary) {
      for (
        var i = 0, data_length = GST.Storage.NightBoundaryPolyline.length;
        i < data_length;
        i++
      ) {
        GST.Storage.NightBoundaryPolyline[i].setMap(null);
      }
    }
  };

  return {
    get: function (date) {
      var time = new GST.Time(date);
      return _getTerminator(time);
    },
    remove: function () {
      _removeTerminator();
    },
    update: function (date) {
      _removeTerminator();
      var time = new GST.Time(date);
      return _getTerminator(time);
    },
  }; // end GST.Terminator return
};

const getNightPaths = (date) => {
  const terminator_options = {
    shade: true,
    boundary: false,
  };
  const terminator = new GST.Terminator(terminator_options);

  const LatLongPaths = terminator.get(date);
  // console.log(LatLongPaths[2]);
  return LatLongPaths.map((paths) => {
    return paths.map((coord) => wrap(coord[0], coord[1]));
    // return paths.map((coord) => [coord[1], coord[0]]);
  });
};

/**
 * Source: https://gist.github.com/missinglink/d0a085188a8eab2ca66db385bb7c023a
  normalize co-ordinates that lie outside of the normal ranges.
  longitude wrapping simply requires adding +- 360 to the value until it comes
  in to range.
  for the latitude values we need to flip the longitude whenever the latitude
  crosses a pole.
**/

const wrap = (lat, lon) => {
  var point = { lat: lat, lon: lon };
  var quadrant = Math.floor(Math.abs(lat) / 90) % 4;
  var pole = lat > 0 ? 90 : -90;
  var offset = lat % 90;

  switch (quadrant) {
    case 0:
      point.lat = offset;
      break;
    case 1:
      point.lat = pole - offset;
      point.lon += 180;
      break;
    case 2:
      point.lat = -offset;
      point.lon += 180;
      break;
    case 3:
      point.lat = -pole + offset;
      break;
  }

  if (point.lon > 180 || point.lon < -180) {
    point.lon -= Math.floor((point.lon + 180) / 360) * 360;
  }
  // console.log([point.lat, point.lon]);
  return [point.lon, point.lat];
};

const getTimeExtent = (now) => {
  const setDate = moment(now);
  const tomorrow = setDate.add(1, 'day').endOf('day').toDate();
  const yesterday = setDate.subtract(2, 'day').startOf('day').toDate();

  return {
    tomorrow,
    yesterday,
  };
};

const generateCones = async (now, graphicsLayer, opacity) => {
  const [Graphic, Polygon, geodesicUtils, normalizeUtils, webMercatorUtils] =
    await loadModules(
      [
        'esri/Graphic',
        'esri/geometry/Polygon',
        'esri/geometry/support/geodesicUtils',
        'esri/geometry/support/normalizeUtils',
        'esri/geometry/support/webMercatorUtils',
      ],
      {
        css: true,
      }
    );

  const nightPaths = getNightPaths(now);

  nightPaths.forEach(async (path) => {
    const polygon = new Polygon({
      rings: path,
    });

    const simpleFillSymbol = {
      type: 'simple-fill',
      color: [0, 0, 0, opacity],
      outline: {
        color: [0, 0, 0, opacity],
        width: 0,
      },
    };

    let geom = geodesicUtils.geodesicDensify(polygon, 1000000);
    const mercatorPolygon = webMercatorUtils.geographicToWebMercator(geom);

    const geom2 = await normalizeUtils.normalizeCentralMeridian(
      mercatorPolygon
    );

    const polygonGraphic = new Graphic({
      geometry: geom2[0],
      symbol: simpleFillSymbol,
    });
    graphicsLayer.add(polygonGraphic);
  });
};

export { getNightPaths, wrap, getTimeExtent, generateCones };
