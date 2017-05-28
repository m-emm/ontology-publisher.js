export default function($location, $scope, $rootScope) {

		var vm = this;
		vm.isSelected = isSelected;
		vm.isActive = isActive;
		vm.isNavigationVisible = isNavigationVisible;
		vm.activate = activate;
		vm.go = go;
		vm.reservationActive = false;


		$rootScope.$on("$routeChangeStart", function(event, next, current) {
			routeUpdate();
		});
		
		$rootScope.$on("$locationChangeSuccess", function(event, next, current) {
			routeLanded();
		});

			initTabs();
		
		function routeLanded() {
		}

		function initTabs() {
			
			vm.tabs = [];
			vm.tabs.push({
				id : 0,
				title : 'GRAPH',
				route : "graph",
				navigationVisible : true
			});
			vm.tabs.push({
				id : 1,
				title : 'OBJECTVIEW',
				route : "objectview",
				navigationVisible : true
			});
			vm.tabs.push({
				id : 1,
				title : 'ADMIN',
				route : "admin",
				navigationVisible : true
			});	
			

			vm.tabsByRoute = {};
			vm.tabs.forEach(function(tab) {
				vm.tabsByRoute['/' + tab.route] = tab;
			});
			activate(vm.tabs[0]);
		}

		function activate(tab) {		
			vm.activeTab = tab.id;			
		}

		function isSelected(candidate) {
			return candidate.id == vm.activeTab;
		}

		function isActive(tabRoute) {
			var pathPart = $location.path().substr(1);
			var splitPath = pathPart.split('/');			
			var pathRoot; 
			if(splitPath.length > 1) {
				pathRoot = splitPath[0];
			} else {
				pathRoot = pathPart;
			}
			return (tabRoute) === pathRoot;
		}

		function routeUpdate() {
			if (vm.tabsByRoute) {
				var tab = vm.tabsByRoute[$location.path()];
				if (null != tab) {
					activate(tab);
				}
			}
		}

		function isNavigationVisible() {
			if(vm.tabs) {
				return vm.tabs[vm.activeTab].navigationVisible;
			}
			return true;
		}

		function go(path) {
			$location.path(path);
		}

		routeUpdate();

	}