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
            var container = new G.Container();

            container.points = [];
            container.forces.push(new G.GlobalForce(0, 0.5));

            return {
                reset: function () {
                    container.points.length = 0;
                },

                run: function () {
                    if (container.isRunning()) {
                        container.pause();
                        return container.reset();
                    }
                    container.run();
                    container.resume();
                },

                pointFromLink: function (link, renderFn) {
                    var point = new G.Point({
                        position: {
                            x: link.physics.position.x,
                            y: link.physics.position.y
                        },
                        staticFriction: 0.1,
                        kineticFriction: 0.99
                    }, renderFn);

                    for (var i in link.physics.elastics) {
                        point.forces.push(new G.CenteredForce(link.physics.elastics[i]));
                    }
                    return point;
                },

                addPoint: function (point) {
                    container.points.push(point);
                }
            };
        })

        .directive("gContainer", ["gManager", function (gManager) {
            return function ($scope, $element, $attrs) {
                $scope.run = function () {
                    gManager.reset();
                    $scope.$broadcast("gContainer:run");
                    gManager.run();
                };
            };
        }])

        .directive("gElement", ["gManager", function (gManager) {
            return {
                link: function ($scope, $element, $attrs) {
                    var element = null;

                    $scope.$watch($attrs.gElement, function (val) {
                        element = val;
                    }, true);

                    $scope.$on("gContainer:run", function () {
                        if (!element) { return; }
                        var point = gManager.pointFromLink(element, function () {
                            $element.css("top", this.position.y + "px");
                            $element.css("left", this.position.x + "px");
                        });
                        gManager.addPoint(point);
                    });
                }
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
            { id: "default",  name: "Perso", color: "orange" },
            { id: "github",  name: "Github", color: "rgba(65, 131, 196, 1)" },
            { id: "twitter", name: "Twitter", color: "#0084B4" },
            { id: "googleplus", name: "Google+", color: "#D73D32" },
            { id: "facebook", name: "Facebook", color: "#4B67A8" }
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
                    if (matches.length === 0) {
                        matches.push(providers[0]);
                    }

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
                require: "ngModel",
                link: function ($scope, $element, $attrs, $ngModel) {
                    var initPosition,
                        move = function (event) {
                            event.preventDefault();
                            $scope.$apply(function () {
                                var currentPosition = $ngModel.$modelValue,
                                    dx = event.clientX - initPosition.x,
                                    dy = event.clientY - initPosition.y;

                                $ngModel.$setViewValue({
                                    x: currentPosition.x + dx,
                                    y: currentPosition.y + dy
                                });
                                initPosition = { x: event.clientX, y : event.clientY };
                                $ngModel.$render();
                            });
                        };

                    $ngModel.$render = function () {
                        if (!$ngModel.$modelValue) { return; }
                        $element.css({ top: $ngModel.$modelValue.y + "px", left: $ngModel.$modelValue.x + "px" });
                    };

                    $element.css({ position: "absolute" });

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
            var defaultLink = {
                url: "felix",
                physics: {
                    position: {
                        x: 10,
                        y: 10
                    },
                    elastics: [{
                        center: {
                            x: 100,
                            y: 100
                        },
                        stiffness: 0.01,
                        offset: 100
                    }]
                }
            };

            $scope.links = [];
            $scope.selectLink = function (link) {
                $scope.selectedLink = link;
            };
            $scope.createLink = function () {
                var link = angular.copy(defaultLink);
                this.selectLink(link);
                this.links.push(link);
            };
        }]);

    angular.bootstrap(window.document.body, ["hereiam"]);
});
