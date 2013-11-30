define(
	[
  	'bpn.controllers'
	],
  function (bpnControllers) {
    'use strict';

    return bpnControllers.controller('bpn.controllers.SelectionOverlay',
      [
        '$scope',
        '$filter',
        '$compile',
        function ($scope, $filter, $compile) {
          // init
          $scope.sortingOrder = 'name';
          $scope.reverse = false;
          $scope.filteredItems = [];
          $scope.groupedItems = [];
          $scope.itemsPerPage = 6;
          $scope.pagedItems = [];
          $scope.currentPage = 0;
          // $scope.overlayItems = []; //defined in parent controller

          var searchMatch = function (haystack, needle) {
            if (!needle) {
              return true;
            }
            return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
          };

          // init the filtered items
          $scope.search = function () {
            $scope.filteredItems = $filter('filter')($scope.overlayItems, function (item) {
              for (var attr in item) {
                if (searchMatch(item[attr].toString(), $scope.query))
                  return true;
              }
              return false;
            });
            // take care of the sorting order
            if ($scope.sortingOrder !== '') {
              $scope.filteredItems = $filter('orderBy')($scope.filteredItems, $scope.sortingOrder, $scope.reverse);
            }
            $scope.currentPage = 0;
            // now group by pages
            $scope.groupToPages();
          };

          // calculate page in place
          $scope.groupToPages = function () {
            $scope.pagedItems = [];

            for (var i = 0; i < $scope.filteredItems.length; i++) {
              if (i % $scope.itemsPerPage === 0) {
                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [ $scope.filteredItems[i] ];
              } else {
                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
              }
            }
          };

          $scope.range = function (start, end) {
            var ret = [];
            if (!end) {
              end = start;
              start = 0;
            }
            for (var i = start; i < end; i++) {
              ret.push(i);
            }
            return ret;
          };

          $scope.prevPage = function () {
            if ($scope.currentPage > 0) {
              $scope.currentPage--;
            }
          };

          $scope.nextPage = function () {
            if ($scope.currentPage < $scope.pagedItems.length - 1) {
              $scope.currentPage++;
            }
          };

          $scope.setPage = function () {
            console.log(this.n)
            $scope.currentPage = this.n;
          };

          // functions have been describe process the data for display
          $scope.search();

          // change sorting order
          $scope.sort_by = function (newSortingOrder) {
            if ($scope.sortingOrder == newSortingOrder) {
            	$scope.reverse = !$scope.reverse;
            }
              
            $scope.sortingOrder = newSortingOrder;
          };
        }
      ]
    )
  }
);