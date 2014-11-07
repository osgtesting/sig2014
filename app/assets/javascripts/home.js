var reqArray = [
  "esri/map",
  "esri/dijit/Geocoder",

  "esri/graphic",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/geometry/screenUtils",

  "dojo/dom",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/_base/Color",

  "dojo/domReady!"
];

$(function(){
  var map;
  var geocoder;
  var locations = [];

  require(reqArray, function(
    Map, Geocoder,Graphic, SimpleMarkerSymbol, screenUtils,
    dom, domConstruct, query, Color){
      // Map creation
      map = new Map("mapDiv", {
        basemap: "streets",
        center: [ -100, 40 ],
        zoom: 5
      });

      var dotsLayer = new esri.layers.GraphicsLayer("dotsLayer");
      dotsLayer.setInfoTemplate(new esri.InfoTemplate("${NAME}","${*}"));
      map.addLayer(dotsLayer);

      // Geocoder creation
      geocoder = new Geocoder({
        autoComplete: true,
        autoZoom: false,
        arcgisGeocoder: {
          placeholder: "Find a place"
        },
        autoNavigate: false,
        map: map
      }, dom.byId("search"));

      // Geocoder activation
      geocoder.startup();
      geocoder.on('select', showLocation);

      // CreateRoute button creation
      // TO DO

      function showLocation(event) {

        var point = event.result.feature.geometry;
        locations.push(point);
        var symbol = new SimpleMarkerSymbol()
            .setStyle("square")
            .setColor(new Color([255,0,0,0.5]));
        var graphic = new Graphic(point, symbol);
        dotsLayer.add(graphic);

        console.log(dotsLayer);
          console.log(map);


        map.infoWindow.setTitle("Search Result");
        map.infoWindow.setContent(event.result.name);
        map.infoWindow.show(event.result.feature.geometry);
      }

  });
});