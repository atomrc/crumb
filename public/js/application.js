/*global require*/

require.config({
    paths: {
        angular: "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular.min"
    },

    shim: {
        angular: {
            exports: 'angular'
        }
    }
});

require(['angular'], function (angular) {
    'use strict';
    angular
        .module('hereiam', [])

        /**
         * all the social providers supported by the application
         *
         * @return Object
         */
        .value('socialProviders', [
            { id: 'github',  name: 'Github', pattern: 'http://github.com/' },
            { id: 'twitter', name: 'Twitter', pattern: 'http://twitter.com/' },
            { id: 'googleplus', name: 'Google+', pattern: 'http://plus.google.com/' },
            { id: 'facebook', name: 'Facebook', pattern: 'http://facebook.com/' }
        ])

        /**
         * find a provider from a given string
         *
         * @return Object
         */
        .factory('socialFinder', ['socialProviders', function (providers) {
            return {
                find: function (val) {
                    var matches = [];
                    angular.forEach(providers, function (provider) {
                        //check if the user input looks like the name of the provider
                        var lcVal = val.toLowerCase();
                        if (provider.id.match(lcVal) || lcVal.match(provider.id)) {
                            matches.push(provider);
                        }
                    });

                    return matches;
                }
            };
        }])

        .directive('socialAutocomplete', ['socialFinder', function (socialFinder) {
            return {
                scope: { link: '=socialAutocomplete' },
                template: '<div>' +
                    '<input data-ng-model="link.url">' +
                    '<div data-ng-repeat="provider in matches" data-ng-bind="provider.name"></div>' +
                '</div>',
                link: function ($scope/*, $element, $attrs*/) {
                    $scope.matches = [];

                    $scope.$watch('link.url', function (val) {
                        var matches = [];
                        $scope.matches = [];
                        $scope.link.provider = null;
                        if (!val || val.length < 2) { return; }
                        matches = socialFinder.find(val);

                        //if there is only one match, then apply the found provider to the link being edited
                        if (matches.length === 1) {
                            $scope.link.provider = matches.pop();
                        }
                        $scope.matches = matches;
                    });
                }
            };
        }])

        .controller('linksController', ['$scope', function ($scope) {
            //TODO retrieve user links from the server
            $scope.links = [];
            $scope.addLink = function () {
                $scope.links.push({});
            };
        }]);

    angular.bootstrap(window.document.body, ['hereiam']);
});
