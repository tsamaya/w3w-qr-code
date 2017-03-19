var coords = [51.521251, -0.203586];

// Get the user's w3w API key via prompt
if (!localStorage.getItem('w3wkey')) {
  localStorage.setItem(
    'w3wkey',
    prompt('What is your w3w API key?')
  );
}
var dragging = false;
var lang = 'en';
var key = localStorage.getItem('w3wkey');

L.Marker.prototype.animateDragging = function() {

  var iconMargin, shadowMargin;

  this.on('dragstart', function() {
    dragging = true;
    if (!iconMargin) {
      iconMargin = parseInt(L.DomUtil.getStyle(this._icon, 'marginTop'));
      shadowMargin = parseInt(L.DomUtil.getStyle(this._shadow, 'marginLeft'));
    }

    this._icon.style.marginTop = (iconMargin - 15) + 'px';
    this._shadow.style.marginLeft = (shadowMargin + 8) + 'px';
  });

  return this.on('dragend', function() {
    dragging = false;
    this._icon.style.marginTop = iconMargin + 'px';
    this._shadow.style.marginLeft = shadowMargin + 'px';
  });
};

function markGeocode(result) {
  result = result.geocode || result;
  map.fitBounds(result.bbox);
  // if (this._geocodeMarker) {
  // 	this._map.removeLayer(this._geocodeMarker);
  // }
  //
  // this._geocodeMarker = new L.Marker(result.center)
  // 	.bindPopup(result.html || result.name)
  // 	.addTo(this._map)
  // 	.openPopup();
}

var toner = L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png'
});

var openStreetBlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
  maxNativeZoom: 18,
  maxZoom: 20,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

var openTopoMap = L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxNativeZoom:17,
  maxZoom: 20,
  attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

var map = L.map('map', {
  center: coords,
  zoom: 6,
  layers: [toner]
});

var baseMaps = {
  'Topo': openTopoMap,
  'Grayscale': openStreetBlackAndWhite,
  'Black and White': toner
};

L.control.layers(baseMaps).addTo(map);

var geocoder = L.Control.Geocoder.what3words(key);
L.Control.geocoder({
  geocoder: geocoder,
  placeholder: 'word.word.word',
  markgeocode: markGeocode
}).addTo(map);

var myIcon = L.icon({
  iconUrl: './img/marker.png',
  iconSize: [90, 90],
  iconAnchor: [45, 90],
  shadowUrl: './img/marker-shadow.png',
  shadowSize: [68, 95],
  shadowAnchor: [22, 94]
});
var w3wmarker = L.marker(coords, {
    draggable: true,
    icon: myIcon
  })
  .on('dragend', updateW3w2)
  .on('move', updateW3w)
  .animateDragging()
  .addTo(map);

updateW3w();

$('#lang').on('change', function() {
  lang = $('#lang').val();
  updateW3w();
});

$('#export-png').click(function() {
  $('#export-png').hide();

  html2canvas($('#qr-wrapper'), {
    onrendered: function(canvas) {
      console.log('canvas created');
      var data = canvas.toDataURL();
      var newData = data.replace(/^data:image\/png/, "data:application/octet-stream");
      $('#export-png-button').attr("download", "w3w-qrcode.png").attr("href", newData);
      // var evt = document.createEvent("HTMLEvents");
      // evt.initEvent("click");
      $('#export-png-button').get(0).click();
    }
  });
  //downloadCanvas(this, 'qr-wrapper', 'test.png');
  setTimeout(function() {
    $('#export-png').show();
  }, 1000);
});

// https://davidshimjs.github.io/qrcodejs/
var qrcode = new QRCode('qr-code', {
  text: "http://w3w.co/index.home.raft",
  width: 256,
  height: 256,
  colorDark: "#000000",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H
});

map.on('click', onMapClick);

function onMapClick(evt) {
  var latlon = evt.latlng;
  var lat = latlon.lat;
  var lon = latlon.lng;
  w3wmarker.setLatLng(L.latLng(lat, lon));
}

function updateW3w2(evt) {
  dragging = false;
  updateW3w(evt);
}

function updateW3w(e) {
  var position;
  if (dragging) {
    return;
  }
  if (e === undefined || e.latLng === undefined) {
    position = L.latLng(w3wmarker.getLatLng().lat, w3wmarker.getLatLng().lng).wrap();
  } else {
    position = L.latLng(e.latLng).wrap();
  }
  var data = {
    'key': key,
    'lang': lang,
    'coords': position.lat + ',' + position.lng
  };

  $.get('https://api.what3words.com/v2/reverse', data, function(response) {
    var w3wAddress = response.words;
    var w3wAddressLink = 'http://w3w.co/' + w3wAddress;
    $('#w3w').text(w3wAddress);
    $('#w3wlink').attr('href', w3wAddressLink);
    if (qrcode) {
      qrcode.clear(); // clear the code.
      qrcode.makeCode(w3wAddressLink); // make another code.
    }
  });

}
