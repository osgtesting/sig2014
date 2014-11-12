var reqArray = [
  "esri/config",
  "esri/urlUtils",
  "esri/map",
  "esri/dijit/Geocoder",

  "esri/graphic",
  "esri/tasks/RouteTask",
  "esri/tasks/RouteParameters",
  "esri/tasks/GeometryService",
  "esri/tasks/BufferParameters",

  "esri/tasks/FeatureSet",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
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
  var ruta;
  var polilinea;
  var totalRuta;
  var tramo;
  var tramoAux;
  var int;
  var random;


  require(reqArray, function(
    esriConfig, urlUtils, Map, Geocoder,Graphic, RouteTask, RouteParameters, GeometryService,
    BufferParameters, FeatureSet, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
    screenUtils, Color, on, registry, dom, domConstruct, query, Color){

      esriConfig.defaults.io.corsDetection = false;
      esriConfig.defaults.io.corsEnabledServers.push("server.arcgisonline.com");

      // Map creation
      map = new Map("mapDiv", {
        basemap: "streets",
        center: [ -100, 40 ],
        zoom: 5
      });

      // Demographic QueryTask
      var queryTask = new esri.tasks.QueryTask("http://server.arcgisonline.com/ArcGIS/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer/3");

      // Demographic Query
      var query = new esri.tasks.Query();
      query.returnGeometry = true;
      query.outFields = ['NAME','ST_ABBREV','TOTPOP_CY']
      query.outSpatialReference = {"wkid":102100};

      routeSymbol = new SimpleLineSymbol().setColor(new dojo.Color([0, 0, 255, 0.5])).setWidth(5);

      var dotsLayer = new esri.layers.GraphicsLayer("dotsLayer");
      dotsLayer.setInfoTemplate(new esri.InfoTemplate("${NAME}","${*}"));
      dotsLayer.id = 'pointsLayer';
      map.addLayer(dotsLayer);

      var simLayer = new esri.layers.GraphicsLayer("simLayer");
      simLayer.setInfoTemplate(new esri.InfoTemplate("${NAME}","${*}"));
      simLayer.id = 'simLayer';
      map.addLayer(simLayer);

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

      $('#createSimButton').bind('click', function() {bindCreateSimulation()});

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

        // Clear search input
        $('#search_input')[0].value = '';
      }

      //Adds the solved route to the map as a graphic
      function showRoute(evt) {
        var tmp = map.graphics.graphics[0];
        map.graphics.clear();
        map.graphics.add(tmp)

        map.graphics.add(evt.result.routeResults[0].route.setSymbol(routeSymbol));
        ruta =evt.result.routeResults[0].route;
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


    function bindCreateSimulation() {

      polilinea = ruta.geometry;

      var symbol2 = new SimpleMarkerSymbol()
          .setStyle("triangle")
          .setColor(new Color([255, 255, 190, 255]));
      var graphic2 = new Graphic(polilinea.getPoint(0, 0), symbol2);
      simLayer.add(graphic2);
      simLayerBuffer()
      totalRuta = polilinea.paths[0].length - 1;
      tramoAux=0;
      int = setInterval(Timer, 5000);
    }

    function Timer() {
        random = (Math.random())*10;
        if (random <= 3) {

            tramo = 30;
            var symbol3 = new SimpleMarkerSymbol()
                .setStyle("triangle")
                .setColor(new Color("yellow"));

        } else if (random > 3 && random < 6) {

            tramo = 80;
            var symbol3 = new SimpleMarkerSymbol()
                .setStyle("triangle")
                .setColor(new Color("blue"));
        } else {

            tramo = 120;
            var symbol3 = new SimpleMarkerSymbol()
                .setStyle("triangle")
                .setColor(new Color("green"));

        }
        if ((tramoAux + tramo) >= totalRuta) {      /*termina*/

            var symbol3 = new SimpleMarkerSymbol()
                .setStyle("triangle")
                .setColor(new Color("yellow"));
            var puntoSim = polilinea.getPoint(0, totalRuta);
            var graphic3 = new Graphic(puntoSim, symbol3);
            simLayer.clear();
            simLayer.add(graphic3);
            simLayerBuffer();

            clearInterval(int);

        } else {

            tramoAux = tramoAux + tramo;

            var puntoSim = polilinea.getPoint(0, tramoAux.toFixed());

            var graphic3 = new Graphic(puntoSim, symbol3);
            simLayer.clear();
            simLayer.add(graphic3);
          simLayerBuffer();
        }
    };

    function simLayerBuffer() {
      var simLayerPoint = map.getLayer('simLayer').graphics[0];
      var gsvc = new GeometryService('http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer');
      var bufferParams = new BufferParameters();


      bufferParams.geometries = [simLayerPoint.geometry];
      bufferParams.distances = [10];
      bufferParams.unit = GeometryService.UNIT_KILOMETER;
      bufferParams.outSpatialReference = map.spatialReference;

      gsvc.buffer(bufferParams, drawBuffer);
    }

    function drawBuffer(geometries) {
      var symbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new dojo.Color([0,0,255,0.65]), 2
          ),
          new dojo.Color([0,0,255,0.35])
      );

      dojo.forEach(geometries, function(geometry) {
        var graphic = new esri.Graphic(geometry,symbol);
        simLayer.add(graphic);
      });

      query.geometry = esri.geometry.webMercatorToGeographic(geometries[0]);
      query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
      queryTask.execute(query);
    };

    dojo.connect(queryTask, "onComplete", function(graphics) {
      firstGraphic = graphics.features[0];
      var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new dojo.Color([100,100,100]), 3), new dojo.Color([255,0,0,0.20]));

      console.log(graphics);

      var resultFeatures = graphics.features;
      for (var i=0, il=resultFeatures.length; i<il; i++) {
        var graphic = resultFeatures[i];
        graphic.setSymbol(symbol);
        simLayer.add(graphic);
      }
    });

  });
});

