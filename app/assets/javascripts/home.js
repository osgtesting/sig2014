var reqArray = [
  "esri/config",
  "esri/urlUtils",
  "esri/map",
  "esri/tasks/locator",
  "esri/dijit/Geocoder",

  "esri/graphic",
  "esri/tasks/RouteTask",
  "esri/tasks/RouteParameters",
  "esri/tasks/GeometryService",
  "esri/tasks/BufferParameters",
  "esri/geometry/webMercatorUtils",
  "esri/InfoTemplate",

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
  var puntoSim;
  var location;
  var locator;
  var infoTemplate;
  var symbol8;
  var estado;
  var bufferUnit = 'Kilometros';
  var bufferValue = "10";


  require(reqArray, function(
    esriConfig, urlUtils, Map, Locator, Geocoder, Graphic, RouteTask, RouteParameters, GeometryService,
    BufferParameters, webMercatorUtils, InfoTemplate, FeatureSet, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
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

      // Hide Buttons when looking for a stop
      $('#search').bind('click', function(){
        $('#create-route-button').hide();
        $('#create-sim-button').hide();
      });

      // Show buttons when not looking for a stop
      $('#search').bind('focusout', function(){
        $('#create-route-button').show();
        $('#create-sim-button').show();
      });

      $("input[name='value-spinner']").TouchSpin({
        initval: 10,
        max: 10000
      });

      $('#buffer-save').bind('click', function() {
        bufferUnit = $('#unit').find(":selected").text();
        bufferValue = $('#value-spinner')[0].value;
        $('#myModal').modal('hide');
      });

      $('#create-route-button').bind('click', function() {bindCreateRoute()});

      $('#create-sim-button').bind('click', function() {bindCreateSimulation()});

      function showLocation(event) {

        var point = event.result.feature.geometry;
        locations.push(point);
        var path = 'M9.5,3v10c8,0,8,4,16,4V7C17.5,7,17.5,3,9.5,3z M6.5,29h2V3h-2V29z'
        var symbol = new SimpleMarkerSymbol()
            .setPath(path)
            .setColor(new Color([255,0,0,0.5]));
        var graphic = new Graphic(point, symbol);
        dotsLayer.add(graphic);

        $.bootstrapGrowl("Stop agregado en: " + event.result.name, { type: 'success', align: 'center', width: 450, allow_dismiss: true });

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
      var movilPath = 'M28.59,10.781h-2.242c-0.129,0-0.244,0.053-0.333,0.133c-0.716-1.143-1.457-2.058-2.032-2.633c-2-2-14-2-16,0C7.41,8.854,6.674,9.763,5.961,10.898c-0.086-0.069-0.19-0.117-0.309-0.117H3.41c-0.275,0-0.5,0.225-0.5,0.5v1.008c0,0.275,0.221,0.542,0.491,0.594l1.359,0.259c-1.174,2.619-1.866,5.877-0.778,9.14v1.938c0,0.553,0.14,1,0.313,1h2.562c0.173,0,0.313-0.447,0.313-1v-1.584c2.298,0.219,5.551,0.459,8.812,0.459c3.232,0,6.521-0.235,8.814-0.453v1.578c0,0.553,0.141,1,0.312,1h2.562c0.172,0,0.312-0.447,0.312-1l-0.002-1.938c1.087-3.261,0.397-6.516-0.775-9.134l1.392-0.265c0.271-0.052,0.491-0.318,0.491-0.594v-1.008C29.09,11.006,28.865,10.781,28.59,10.781zM7.107,18.906c-1.001,0-1.812-0.812-1.812-1.812s0.812-1.812,1.812-1.812s1.812,0.812,1.812,1.812S8.108,18.906,7.107,18.906zM5.583,13.716c0.96-2.197,2.296-3.917,3.106-4.728c0.585-0.585,3.34-1.207,7.293-1.207c3.953,0,6.708,0.622,7.293,1.207c0.811,0.811,2.146,2.53,3.106,4.728c-2.133,0.236-6.286-0.31-10.399-0.31S7.716,13.952,5.583,13.716zM24.857,18.906c-1.001,0-1.812-0.812-1.812-1.812s0.812-1.812,1.812-1.812s1.812,0.812,1.812,1.812S25.858,18.906,24.857,18.906z';

      polilinea = ruta.geometry;

      var symbol2 = new SimpleMarkerSymbol()
          .setPath(movilPath)
          .setColor(new Color([255, 255, 190, 255]));
      var graphic2 = new Graphic(polilinea.getPoint(0, 0), symbol2,new InfoTemplate("Estado", "State: ${State}"));
      simLayer.add(graphic2);
      estado=graphic2.getContent();
      simLayerBuffer()
      totalRuta = polilinea.paths[0].length - 1;
      tramoAux=0;
      int = setInterval(Timer, 5000);
    }

    function Timer() {
        var movilPath = 'M28.59,10.781h-2.242c-0.129,0-0.244,0.053-0.333,0.133c-0.716-1.143-1.457-2.058-2.032-2.633c-2-2-14-2-16,0C7.41,8.854,6.674,9.763,5.961,10.898c-0.086-0.069-0.19-0.117-0.309-0.117H3.41c-0.275,0-0.5,0.225-0.5,0.5v1.008c0,0.275,0.221,0.542,0.491,0.594l1.359,0.259c-1.174,2.619-1.866,5.877-0.778,9.14v1.938c0,0.553,0.14,1,0.313,1h2.562c0.173,0,0.313-0.447,0.313-1v-1.584c2.298,0.219,5.551,0.459,8.812,0.459c3.232,0,6.521-0.235,8.814-0.453v1.578c0,0.553,0.141,1,0.312,1h2.562c0.172,0,0.312-0.447,0.312-1l-0.002-1.938c1.087-3.261,0.397-6.516-0.775-9.134l1.392-0.265c0.271-0.052,0.491-0.318,0.491-0.594v-1.008C29.09,11.006,28.865,10.781,28.59,10.781zM7.107,18.906c-1.001,0-1.812-0.812-1.812-1.812s0.812-1.812,1.812-1.812s1.812,0.812,1.812,1.812S8.108,18.906,7.107,18.906zM5.583,13.716c0.96-2.197,2.296-3.917,3.106-4.728c0.585-0.585,3.34-1.207,7.293-1.207c3.953,0,6.708,0.622,7.293,1.207c0.811,0.811,2.146,2.53,3.106,4.728c-2.133,0.236-6.286-0.31-10.399-0.31S7.716,13.952,5.583,13.716zM24.857,18.906c-1.001,0-1.812-0.812-1.812-1.812s0.812-1.812,1.812-1.812s1.812,0.812,1.812,1.812S25.858,18.906,24.857,18.906z';
        random = (Math.random())*10;
        if (random <= 3) {

            tramo = 30;
            var symbol3 = new SimpleMarkerSymbol()
                .setPath(movilPath)
                .setColor(new Color("yellow"));

        } else if (random > 3 && random < 6) {

            tramo = 80;
            var symbol3 = new SimpleMarkerSymbol()
                .setPath(movilPath)
                .setColor(new Color("blue"));
        } else {

            tramo = 120;
            var symbol3 = new SimpleMarkerSymbol()
                .setPath(movilPath)
                .setColor(new Color("green"));

        }
        if ((tramoAux + tramo) >= totalRuta) {      /*termina*/

            var symbol3 = new SimpleMarkerSymbol()
                .setPath(movilPath)
                .setColor(new Color("yellow"));
            puntoSim = polilinea.getPoint(0, totalRuta);
            var graphic3 = new Graphic(puntoSim, symbol3);
            simLayer.clear();
            simLayer.add(graphic3);
            simLayerBuffer();
            encontrarEstado();

            clearInterval(int);

        } else {

            tramoAux = tramoAux + tramo;

            puntoSim = polilinea.getPoint(0, tramoAux.toFixed());

            var graphic3 = new Graphic(puntoSim, symbol3);
            simLayer.clear();
            simLayer.add(graphic3);
          simLayerBuffer();
          encontrarEstado();

        }
    };

    function encontrarEstado() {

        map.infoWindow.hide();
        symbol8 = new SimpleMarkerSymbol()
            .setStyle("triangle")
            .setColor(new Color([255, 255, 190, 255]));
        infoTemplate = new InfoTemplate("Estado", "State: ${State}");

        locator.locationToAddress(puntoSim, 1000);
        console.log(puntoSim.getLatitude());
        console.log(puntoSim.getLongitude());

    }
    locator = new Locator("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Locators/ESRI_Geocode_USA/GeocodeServer");

    locator.on("location-to-address-complete", function(evt) {
          if (evt.address.address) {
              var address = evt.address.address;
              var location = webMercatorUtils.geographicToWebMercator(evt.address.location);
              //this service returns geocoding results in geographic - convert to web mercator to display on map
              // var location = webMercatorUtils.geographicToWebMercator(evt.location);
              var graphic = new Graphic(location, symbol8, address, infoTemplate);


              if (graphic.getContent()!= estado) {
                  estado=graphic.getContent();
                  $.bootstrapGrowl("Se ingresó en el estado: " + evt.address.address.State, { type: 'info', align: 'center' });
              }
          }
      });


    function simLayerBuffer() {
      var simLayerPoint = map.getLayer('simLayer').graphics[0];
      var gsvc = new GeometryService('http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer');
      var bufferParams = new BufferParameters();

      var unit;

      if(bufferUnit == 'Kilometros')
        unit = GeometryService.UNIT_KILOMETER;
      else
        unit = GeometryService.UNIT_METER;

      bufferParams.geometries = [simLayerPoint.geometry];
      bufferParams.distances = [parseInt(bufferValue)];
      bufferParams.unit = unit;
      bufferParams.outSpatialReference = map.spatialReference;

      gsvc.buffer(bufferParams, drawBuffer);
    }

    function drawBuffer(geometries) {
      var symbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new dojo.Color([199,216,217,0.65]), 2
          ),
          new dojo.Color([199,216,217,0.65])
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

