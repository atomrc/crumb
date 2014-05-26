/*global require, window*/

require.config({
    paths: {
        angular: "//ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular.min",
        g: "//blog.thomasbelin.fr/g.js/js/build/g.min"
    },

    shim: {
        angular: {
            exports: "angular"
        }
    }
});

require(["angular", "g"], function (angular, G) {
    "use strict";

    angular
        .module("g.js", [])
        .service("gManager", function () {
            return {
                points: [],
                container: null,

                run: function () {
                    if (!this.container) {
                        this.container = new G.Container();
                        this.container.forces.push(new G.GlobalForce(0, 0.5));
                    }

                    this.container.points = this.points;
                    if (this.container.isRunning()) {
                        return this.container.restart();
                    }
                    this.container.run();
                },

                pause: function () {
                    if (!this.container.isRunning()) {
                        return this.container.resume();
                    }
                    this.container.pause();
                },

                createPoint: function (params, render) {
                    var point = new G.Point(params, render);
                    return point;
                },

                addPoint: function (point) {
                    this.points.push(point);
                }
            };
        })
        .directive("gContainer", ["gManager", function (gManager) {
            return function ($scope, $element) {
                $scope.run = function () {
                    gManager.run();
                };

                $scope.pause = function () {
                    gManager.pause();
                };
            };
        }])

        .directive("gElement", ["gManager", function (gManager) {
            return function ($scope, $element, $attrs) {
                var point = gManager.createPoint({ x: 0, y: 0 }, function () {
                    $element.css("top", this.position.y + "px");
                    $element.css("left", this.position.x + "px");
                });

                $scope.$watch($attrs.gElement, function (val) {
                    point.position.x = val.x;
                    point.position.y = val.y;
                }, true);

                gManager.addPoint(point);

            };
        }]);


    angular
        .module("hereiam", ["g.js"])

        /**
         * all the social providers supported by the application
         *
         * @return Object
         */
        .value("socialProviders", [
            { id: "github",  name: "Github", pattern: "http://github.com/" },
            { id: "twitter", name: "Twitter", pattern: "http://twitter.com/" },
            { id: "googleplus", name: "Google+", pattern: "http://plus.google.com/" },
            { id: "facebook", name: "Facebook", pattern: "http://facebook.com/" }
        ])

        /**
         * find a provider from a given string
         *
         * @return Object
         */
        .factory("socialFinder", ["socialProviders", function (providers) {
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

        .directive("haSocialAutocomplete", ["socialFinder", function (socialFinder) {
            return {
                scope: { link: "=haSocialAutocomplete" },
                template: "<div>" +
                    "<input data-ng-model=\"link.url\">" +
                    "<div data-ng-repeat=\"provider in matches\" data-ng-bind=\"provider.name\"></div>" +
                "</div>",
                link: function ($scope/*, $element, $attrs*/) {
                    $scope.matches = [];

                    $scope.$watch("link.url", function (val) {
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

        .directive("haDraggable", ["$document", function ($document) {
            return {
                require: "?ngModel",
                link: function ($scope, $element, $attrs, $ngModel) {
                    var initPosition,
                        position = { x: 0, y: 0 },
                        move = function (event) {
                            event.preventDefault();
                            $scope.$apply(function () {
                                var dx = event.clientX - initPosition.x ,
                                    dy = event.clientY - initPosition.y;

                                position.x += dx;
                                position.y += dy;

                                if ($ngModel) {
                                    $ngModel.$setViewValue(position);
                                }
                                $element.css({ top: position.y + "px", left: position.x + "px" });
                                initPosition = { x: event.clientX, y : event.clientY };
                            });
                        };

                    if ($ngModel) {
                        $ngModel.$render = function () {
                            position = $ngModel.$modelValue;
                        };
                    }

                    $element.css({ position: 'absolute' });

                    $element.on("mousedown", function (event) {
                        //if the user is already dragging. Meaning we failed to catch a mouseup
                        //could happens if the user clicks outside the document
                        if (initPosition) { return; }
                        initPosition = { x: event.clientX, y : event.clientY };
                        $document.on("mousemove", move);
                    });

                    $document.on("mouseup", function () {
                        initPosition = null;
                        $document.off("mousemove", move);
                    });
                }
            };
        }])

        .controller("linksController", ["$scope", function ($scope) {
            $scope.links = [ { position: { x: 10, y: 10 }, url: "felix"} ];
            $scope.addLink = function () {
                var link = {
                    position: { x: 0, y: 0 }
                };
                $scope.links.push(link);
            };
        }]);

    angular.bootstrap(window.document.body, ["hereiam"]);
});
