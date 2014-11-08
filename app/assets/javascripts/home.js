var reqArray = [
  "esri/config",
  "esri/urlUtils",
  "esri/map",
  "esri/dijit/Geocoder",

  "esri/graphic",
  "esri/tasks/RouteTask",
  "esri/tasks/RouteParameters",

  "esri/tasks/FeatureSet",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/geometry/screenUtils",

  "esri/Color",
  "dojo/on",
  "dijit/registry",

  "dojo/dom",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/_base/Color",

  "dojo/domReady!",

  "dijit/layout/BorderContainer",
  "dijit/layout/ContentPane",
  "dijit/form/HorizontalSlider",
  "dijit/form/HorizontalRuleLabels"
];

$(function(){
  var map;
  var geocoder;
  var locations = [];
  var routeSymbol;

  require(reqArray, function(
    esriConfig, urlUtils, Map, Geocoder,Graphic, RouteTask, RouteParameters, FeatureSet,
    SimpleMarkerSymbol, SimpleLineSymbol, screenUtils, Color, on, registry,
    dom, domConstruct, query, Color){

      esriConfig.defaults.io.corsDetection = false;

      // Map creation
      map = new Map("mapDiv", {
        basemap: "streets",
        center: [ -100, 40 ],
        zoom: 5
      });

      routeSymbol = new SimpleLineSymbol().setColor(new dojo.Color([0, 0, 255, 0.5])).setWidth(5);

      var dotsLayer = new esri.layers.GraphicsLayer("dotsLayer");
      dotsLayer.setInfoTemplate(new esri.InfoTemplate("${NAME}","${*}"));
      dotsLayer.id = 'pointsLayer';
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

      $('#createRouteButton').bind('click', function() {bindCreateRoute()});

      function showLocation(event) {

        var point = event.result.feature.geometry;
        locations.push(point);
        var symbol = new SimpleMarkerSymbol()
            .setStyle("square")
            .setColor(new Color([255,0,0,0.5]));
        var graphic = new Graphic(point, symbol);
        dotsLayer.add(graphic);

        map.infoWindow.setTitle("Search Result");
        map.infoWindow.setContent(event.result.name);
        map.infoWindow.show(event.result.feature.geometry);
      }

      //Adds the solved route to the map as a graphic
      function showRoute(evt) {
        var routeLayer = new esri.layers.GraphicsLayer("dotsLayer");
        routeLayer.graphics.push(evt.result.routeResults[0].route);

        map.addLayer(routeLayer);
//        var tmp = evt.result.routeResults[0].route.setSymbol(routeSymbol);
//        map.graphics.add(routeLayer);
        console.log('fefefe');
      }

      function bindCreateRoute() {
        routeTask = new RouteTask("http://tasks.arcgisonline.com/ArcGIS/rest/services/NetworkAnalysis/ESRI_Route_NA/NAServer/Route");


        //setup the route parameters
        routeParams = new RouteParameters();
        routeParams.stops = new FeatureSet();
        routeParams.stops.features = dotsLayer.graphics;
        routeParams.outSpatialReference = {
          "wkid" : 102100
        };

        routeParams.findBestSequence=true;
        routeParams.preserveFirstStop=false;
        routeParams.preserveLastStop=false;
        routeParams.returnStops = true;

        routeTask.on("solve-complete", showRoute);

        routeTask.solve(routeParams);
      }

  });
});

//var p = new Point(ev.feature.geometry.x,ev.feature.geometry.y,ev.feature.geometry.spatialReference);
//console.log(p);
//points.push(p);
//var simpleMarkerSymbol = new SimpleMarkerSymbol();
//var graphic = new Graphic(p, simpleMarkerSymbol);
//
//
//require(["esri/IdentityManager"], function(IdentityManager) {
//  IdentityManager.registerToken({
//    'userId': 'TU USERID DE LA CUENTA DEL TRIAL',
//    'expires': 7200,
//    'server': 'http://www.arcgis.com/sharing/rest',
//    'ssl': false,
//    'token': EL TOKEN GENERADO,
//  })
//});
//EL TOKEN GENERADO lo obtuvimos con un $.get()
