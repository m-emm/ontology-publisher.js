import 'bootstrap/dist/css/bootstrap.css';

import angular from 'angular';
require ('angular-route');
require('./rdflib_loader');
import objectview from './objectview';
import tabController from './tab-controller';
import routeConfig from './routeConfig';
var owlservice = require('./owlservice');
var adminController = require('./admin');
var storageservice = require('./storageservice');
var settingsservice = require('./settingsservice');



import graph from './graph';
import objectViewController from './objectview';


var angularTranslate = require("angular-translate");

var ontoModule = angular.module('ontology-browser', ['ngRoute','pascalprecht.translate']);
ontoModule.config(routeConfig);
ontoModule.config( [
    '$compileProvider',
    function( $compileProvider )
    {   
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data|chrome-extension|file):/);
        // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
    }
]);

var en_translations = require('./locales/locale-en.json');

ontoModule.config(['$translateProvider', function ($translateProvider) {
	  // add translation table
	  $translateProvider.useSanitizeValueStrategy('escape')
	    .translations('en', en_translations)
	    .preferredLanguage('en');
	}]);

ontoModule.controller('TabCtrl',tabController);
ontoModule.controller('ObjectViewController',objectViewController);
ontoModule.controller('GraphController',graph);
ontoModule.controller('AdminController',adminController);

ontoModule.factory('owlservice',owlservice);
ontoModule.factory('storageservice',storageservice);
ontoModule.factory('settingsservice',settingsservice);

ontoModule.directive("fileread", [function () {
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                var reader = new FileReader();
                reader.onload = function (loadEvent) {
                    scope.$apply(function () {
                        scope.fileread = loadEvent.target.result;
                    });
                }
                reader.readAsDataURL(changeEvent.target.files[0]);
            });
        }
    }
}]);



