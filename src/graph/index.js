require('./index.html');
require('../webvowl/css/vowl.css');

var d3 = require('d3');
var rdfutil = require('../rdfutils');
var webvowl = require('../webvowl/js/entry.js');
var rdfloader = require('../rdflibutil/rdfloader');
var R = require('ramda');

module.exports = function($routeParams, $location, $timeout, $interval, $scope, owlservice, storageservice, settingsservice) {



  var vm = this;

  vm.editable = editable;
  vm.setEditability = setEditability;
  vm.saveAs = saveAs;
  vm.unfilterIri = unfilterIri;
  vm.startEdit = startEdit;


  var GRAPH_SELECTOR = "#graph";


  function createGraphHelpers(graph) {
    var graphHelpers = {};
    graphHelpers.colorExternalsSwitch = webvowl.modules.colorExternalsSwitch(graph);
    graphHelpers.compactNotationSwitch = webvowl.modules.compactNotationSwitch(graph);
    graphHelpers.datatypeFilter = webvowl.modules.datatypeFilter();
    graphHelpers.disjointFilter = webvowl.modules.disjointFilter();
    graphHelpers.focuser = webvowl.modules.focuser();
    graphHelpers.emptyLiteralFilter = webvowl.modules.emptyLiteralFilter();
    graphHelpers.nodeScalingSwitch = webvowl.modules.nodeScalingSwitch(graph);
    graphHelpers.objectPropertyFilter = webvowl.modules.objectPropertyFilter();
    graphHelpers.individualsFilter = webvowl.modules.individualsFilter();
    graphHelpers.classFilter = webvowl.modules.classFilter();
    graphHelpers.iriListFilter = webvowl.modules.iriListFilter();
    graphHelpers.pickAndPin = webvowl.modules.pickAndPin();
    graphHelpers.statistics = webvowl.modules.statistics();
    graphHelpers.subclassFilter = webvowl.modules.subclassFilter();
    graphHelpers.progress = document.getElementById("myProgress");
    graphHelpers.selectionDetailDisplayer = webvowl.modules.selectionDetailsDisplayer(updateSelectionInformation);
    graphHelpers.setOperatorFilter = webvowl.modules.setOperatorFilter();
    return graphHelpers;
  }


  vm.pickAndPin = false;
  vm.individuals = true;
  vm.classes = true;
  vm.disjoint = true;
  vm.graphBuilt = false;
  vm.savePositions = savePositions;
  vm.loadPositions = loadPositions;
  vm.filterIri = filterIri;
  vm.resetIriFilter = resetIriFilter;
  vm.updatePropertyFilter = updatePropertyFilter;
  vm.filteredIriList = [];
  if ($routeParams.view) {
    vm.view = $routeParams.view;
    if (vm.view === '___NEW_VIEW___') {
      vm.isNewView = true;
    }
  }
  if ($routeParams.ontologyName) {
    vm.ontologyName = $routeParams.ontologyName;
  }

  if (!vm.ontologyName) {
    if (owlservice.ontologyLoaded() && owlservice.getName()) {
      var newPath = '/graph/' + owlservice.getName();
      $location.path(newPath);
      return;
    }
    var ontologies = storageservice.getOntologiesList();
    if (ontologies.length > 0) {
      $location.path('/graph/' + ontologies[0].name);
      return;
    }
  } else {
    getViews();
    if (!vm.view) {
      var keyname;
      var defaultView;
      for (var k in vm.views) {
        if (vm.views.hasOwnProperty(k)) {
          var element = vm.views[k];
          if (element.default) {
            $location.path('/graph/' + vm.ontologyName + '/' + element.name);
            return;
          }
          defaultView = element;
        }
      }
      $location.path('/graph/' + vm.ontologyName + '/' + defaultView.name);
      return;
    }
  }


  $scope.$watch(
    // This function returns the value being watched. It is called for each turn
    // of the $digest loop
    function() {
      return vm.pickAndPin ? 'true' : 'false';
    },
    // This is the change listener, called when the value returned from the
    // above function changes
    function(newValue, oldValue) {
      if (vm.graphHelpers && vm.graphHelpers.pickAndPin)
        vm.graphHelpers.pickAndPin.enabled('true' == newValue);
    });
  $scope.$watch(
    // This function returns the value being watched. It is called for each turn
    // of the $digest loop
    function() {
      return vm.individuals
    },
    // This is the change listener, called when the value returned from the
    // above function changes
    function(newValue, oldValue) {
      if (vm.graphHelpers && vm.graphHelpers.individualsFilter) {
        vm.graphHelpers.individualsFilter.enabled(!newValue);
        if (vm.graphBuilt) {
          updateGraph();
        }
      }

    });

  $scope.$watch(
    // This function returns the value being watched. It is called for each turn
    // of the $digest loop
    function() {
      return vm.classes
    },
    // This is the change listener, called when the value returned from the
    // above function changes
    function(newValue, oldValue) {
      if (vm.graphHelpers && vm.graphHelpers.classFilter) {
        vm.graphHelpers.classFilter.enabled(!newValue);
        if (vm.graphBuilt) {
          updateGraph();
        }
      }

    });
  $scope.$watch(
    // This function returns the value being watched. It is called for
    // each turn
    // of the $digest loop
    function() {
      return vm.disjoint;
    },
    // This is the change listener, called when the value returned from
    // the
    // above function changes
    function(newValue, oldValue) {
      if (vm.graphHelpers && vm.graphHelpers.disjointFilter)
        vm.graphHelpers.disjointFilter.enabled(!newValue);
      if (vm.graphBuilt) {
        updateGraph();
      }
    });

  var maxMagnification = 3;
  var minMagnification = 0.4;

  if (vm.ontologyName) {
    if (!owlservice.ontologyLoaded() || owlservice.getName() !== vm.ontologyName) {
      var ontologyObject = storageservice.loadOntology(vm.ontologyName);
      if (ontologyObject.ontologyText) {
        owlservice.setOntologyText(vm.ontologyName, ontologyObject.ontologyText, ontologyObject.id);
      }
    }
  }

  $timeout(initGraph);

  function initGraph() {
    var graph = webvowl.graph();
    vm.graph = graph;
    var options = graph.graphOptions();
    vm.options = options;

    options.graphContainerSelector(GRAPH_SELECTOR);

    var graphHelpers = createGraphHelpers(graph);
    vm.graphHelpers = graphHelpers;

    options.selectionModules().push(graphHelpers.focuser);
    options.selectionModules().push(graphHelpers.selectionDetailDisplayer);
    options.selectionModules().push(graphHelpers.pickAndPin);
    options.filterModules().push(graphHelpers.emptyLiteralFilter);
    options.filterModules().push(graphHelpers.statistics);
    options.filterModules().push(graphHelpers.datatypeFilter);
    options.filterModules().push(graphHelpers.objectPropertyFilter);
    options.filterModules().push(graphHelpers.individualsFilter);
    options.filterModules().push(graphHelpers.classFilter);
    options.filterModules().push(graphHelpers.subclassFilter);
    options.filterModules().push(graphHelpers.disjointFilter);
    options.filterModules().push(graphHelpers.setOperatorFilter);
    options.filterModules().push(graphHelpers.nodeScalingSwitch);
    options.filterModules().push(graphHelpers.compactNotationSwitch);
    options.filterModules().push(graphHelpers.colorExternalsSwitch);
    options.filterModules().push(graphHelpers.iriListFilter);
    options.literalFilter(graphHelpers.emptyLiteralFilter);
    options.searchMenu = function() {
      return {
        requestDictionaryUpdate: function() {},
        clearText: function() {}
      };
    };

    d3.select(window).on("resize", adjustSize);
    graph.start();
    adjustSize();

    var store = owlservice.store();
    var data = rdfloader.parseRdf(store, owlservice.rootUri());
    options.data(data);
    graph.load();

    loadPositions(graph);
    vm.properties = rdfutil.properties(store).map(function(element) {
      return {
        iri: element,
        visible: true
      };
    });
    vm.graphBuilt = true;

  }

  function getViews() {
    vm.views = storageservice.getViewsObject(vm.ontologyName);
    if (vm.views) {
      for (var k in vm.views) {
        if (vm.view === vm.views[k].name) {
          vm.views[k].active = true;
        } else {
          vm.views[k].active = false;
        }
      }
    }
  }

  function adjustSize() {
    var graphContainer = d3.select(GRAPH_SELECTOR);
    var svg = graphContainer.select("svg");
    var height = window.innerHeight - 150;
    var width = window.innerWidth - 40;

    graphContainer.style("height", height + "px");
    svg.attr("width", width).attr("height", height);

    vm.options.width(width).height(height);
    vm.graph.updateStyle();
  }

  function updateSelectionInformation(selectedElement) {
    $timeout(function() {
      if (selectedElement) {

        vm.selectedElement = {
          iri: selectedElement.iri(),
          type: selectedElement.type(),
          short: selectedElement.iri().split('#')[1]
        };
      } else {
        vm.selectedElement = {};
      }
    });
  }

  function getViewDescription(name) {
    var nodePositions = vm.graph.nodePositions();
    var retval = {
      name: name || vm.view,
      ontologyName: owlservice.getName(),
      nodePositions: nodePositions,
      filteredIriList: vm.filteredIriList,
      scaleFactor: vm.graph.scaleFactor(),
      translation: vm.graph.translation(),
      options: {
        pickAndPin: vm.pickAndPin,
        individuals: vm.individuals,
        classes: vm.classes,
        disjoint: vm.disjoint
      }
    }
    if (vm.viewId) {
      retval.id = vm.viewId;
    }
    return retval;
  }

  function savePositions() {
    var storedView = storageservice.storeView(getViewDescription());
    if (storedView && storedView.id) {
      vm.viewId = storedView.id;
      vm.loadedView = storedView;
    }
  }

  function loadPositions(graph) {
    var viewDescription = storageservice.getView(owlservice.getName(), vm.view);
    vm.loadedView = viewDescription;
    if (viewDescription) {
      vm.viewId = viewDescription.id;
      if (viewDescription.name) {
        vm.view = viewDescription.name;
      }

      vm.ontologyName = viewDescription.ontologyName;
      vm.filteredIriList = viewDescription.filteredIriList;
      var index = 1;
      vm.filteredIriList.forEach(function(element) {
        element.id = index++;
      });

      vm.pickAndPin = viewDescription.options.pickAndPin;
      vm.disjoint = viewDescription.options.disjoint;
      vm.graphHelpers.disjointFilter.enabled(!vm.disjoint);
      vm.individuals = viewDescription.options.individuals;
      if (typeof viewDescription.options.classes != 'undefined') {
        vm.classes = viewDescription.options.classes;
      } else {
        vm.classes = true;
      }

      vm.graphHelpers.individualsFilter.enabled(!vm.individuals);
      vm.graphHelpers.classFilter.enabled(!vm.classes);

      vm.graphHelpers.pickAndPin.enabled(vm.pickAndPin);
      updateIriFilterInGraph();
      if (viewDescription.nodePositions) {
        graph.updateNodePositions(viewDescription.nodePositions);
      }
      if (viewDescription.scaleFactor && viewDescription.translation) {
        graph.zoomTo(viewDescription.scaleFactor, viewDescription.translation);
      }
      graph.update();
    }
  }

  function updateIriFilterInGraph() {
    vm.graphHelpers.iriListFilter.setIriList(vm.filteredIriList);
    vm.graphHelpers.iriListFilter.enabled(true);
  }

  function filterIri() {
    if (vm.selectedElement) {
      vm.filteredIriList.push({
        iri: vm.selectedElement.iri,
        type: vm.selectedElement.type,
        id: vm.filteredIriList.length + 1
      });
      updateIriFilterInGraph();
      updateGraph();
    }
  }

  function unfilterIri(filterEntry) {
    if (filterEntry.id) {
      vm.filteredIriList = R.reject(R.compose(R.equals(filterEntry.id), R.prop('id')), vm.filteredIriList);
      updateIriFilterInGraph();
      updateGraph();
    }
  }


  function resetIriFilter() {
    vm.filteredIriList = [];
    vm.graphHelpers.iriListFilter.enabled(false);
    updateGraph();
  }

  function updateGraph() {
    if (vm.graph) {
      vm.graph.update();
    }
  }

  function updatePropertyFilter(property) {
    if (!property.visible) {
      vm.filteredIriList.push({
        iri: property.iri,
        type: "owl:ObjectProperty"
      });
      vm.graphHelpers.iriListFilter.setIriList(vm.filteredIriList);
      vm.graphHelpers.iriListFilter.enabled(true);
      updateGraph();
    }
  }

  function editable() {
    return settingsservice.editable();
  }

  function startEdit() {
    setEditability(true);
  }

  function setEditability(editable) {
    settingsservice.setEditability(editable);
  }

  function saveAs() {
    if (vm.newViewName) {
      var viewDesc = getViewDescription(vm.newViewName);
      var storedView = storageservice.storeView(viewDesc);
      $location.path('/graph/' + vm.ontologyName + '/' + vm.newViewName);
    }
  }
}
