/**
 * dial gauge directive for AngularJS
 *
 * Author: Chris Jackson
 *
 * License: MIT
 */
angular.module('angular-dialgauge', [
    'ngSanitize'
])
    .directive('ngDialGauge', function ($window, $sce) {
        return {
            restrict: 'E', // Use as element
            scope: { // Isolate scope
                ngModel: '='
            },
            template: '' +
                '<div style="width:100%" ng-bind-html="gauge"</div>',
            link: function ($scope, $element, $state) {
                if ($scope.dialWidth === undefined) {
                    $scope.dialWidth = 5;
                }

                $scope.borderWidth = 1;
                $scope.borderOffset = 3;
                $scope.borderColor = "#c0c0c0";
                $scope.trackColor = "#e0e0e0";
                $scope.barWidth = 3;
                $scope.barColor = "#ff0000";
                $scope.scaleOffset = 3;
                $scope.scaleMinorColor = "#606060";
                $scope.scaleMinorWidth = 0.5;
                $scope.scaleMinorLength = 3;
                $scope.scaleMinorSteps = 36;
                $scope.scaleMajorColor = "#606060";
                $scope.scaleMajorWidth = 1.0;
                $scope.scaleMajorLength = 5;
                $scope.scaleMajorSteps = 9;
                $scope.rotate = 180;
                $scope.angle = 250;
                $scope.lineCap = "round";

                var radDeg = 180 / Math.PI;

                // Sanitise the rotation
                // Rotation should start at the top, so we need to subtract 90 degrees
                var rotate = $scope.rotate - 90;
                if(rotate < 0) {
                    rotate += 360;
                }
                rotate = rotate + (360 - $scope.angle) / 2;

                // Calculate start and end angles - in radians
                var startAngle = rotate / radDeg;
                var endAngle = startAngle + $scope.angle / radDeg;
                if(endAngle > (Math.PI * 2)) {
                    endAngle -= (Math.PI * 2);
                }
                console.log("Start", startAngle);
                console.log("End", endAngle);

                var x = $element.height();
                var e = $element.parent();
                var width = e.width();
                var height = e.height();
                var center = Math.min(width, height);
                center = 70;
                var radius = center - $scope.dialWidth;

                var path = "";

                // Draw the BORDER
                if ($scope.borderWidth) {
                    // This is currently a full circle - maybe it should be an arc?
                    path += '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '"' +
                        'style="stroke:' + $scope.borderColor + ';' +
                        'stroke-width: ' + $scope.borderWidth + ';' +
                        'fill:transparent;"' +
                        '/>'

                    radius -= Math.ceil($scope.borderWidth / 2);
                    radius -= $scope.borderOffset;
                }

                // Calculate the maximum scale size
                var scaleLength = 0;
                if($scope.scaleMinorLength !== 0 || $scope.scaleMajorLength !== 0) {
                    scaleLength = Math.max($scope.scaleMajorLength, $scope.scaleMinorLength);
                }

                // Draw the minor scale
                if($scope.scaleMinorLength !== 0) {
                    path += '<path d="';
                    var scaleAngle = startAngle;
                    var inner = radius - scaleLength;
                    var outer = inner + $scope.scaleMinorLength;
                    var scaleSteps = $scope.scaleMinorSteps;
                    var scaleInc = $scope.angle / scaleSteps / radDeg;
                    do {
                        var cos = Math.cos(scaleAngle);
                        var sin = Math.sin(scaleAngle);

                        path += ' M' + (center + (cos * inner)) + ' ' + (center + (sin * inner));
                        path += ' L' + (center + (cos * outer)) + ' ' + (center + (sin * outer));

                        scaleAngle += scaleInc;
                        if(scaleAngle > (Math.PI * 2)) {
                            scaleAngle -= (Math.PI * 2);
                        }
                    }
                    while(scaleSteps-- > 0);

                    path += '" ';
                    path += 'stroke="' + $scope.scaleMinorColor + '" ' +
                        'stroke-width="' + $scope.scaleMinorWidth + '" '+
                        '/>';
                }

                // Draw the major scale
                if($scope.scaleMajorLength !== 0) {
                    path += '<path d="';
                    var scaleAngle = startAngle;
                    var inner = radius - scaleLength;
                    var outer = inner + $scope.scaleMajorLength;
                    var scaleSteps = $scope.scaleMajorSteps;
                    var scaleInc = $scope.angle / scaleSteps / radDeg;
                    do {
                        var cos = Math.cos(scaleAngle);
                        var sin = Math.sin(scaleAngle);

                        path += ' M' + (center + (cos * inner)) + ' ' + (center + (sin * inner));
                        path += ' L' + (center + (cos * outer)) + ' ' + (center + (sin * outer));

                        scaleAngle += scaleInc;
                        if(scaleAngle > (Math.PI * 2)) {
                            scaleAngle -= (Math.PI * 2);
                        }
                    }
                    while(scaleSteps-- > 0);

                    path += '" ';
                    path += 'stroke="' + $scope.scaleMajorColor + '" ' +
                        'stroke-width="' + $scope.scaleMajorWidth + '" '+
                        '/>';
                }

                if(scaleLength !== 0) {
                    radius -= scaleLength;
                    radius -= $scope.scaleOffset;
                }


                // Draw the TRACK
                if ($scope.trackColor) {
                    var arc = getArc(startAngle+0.0000001, endAngle-0.0000001);
                    path += '<path d="M' + arc.sX + ' ' + arc.sY;
                    path += ' A ' + radius + ' ' + radius + ',0,'+ arc.dir + ',1,' + arc.eX + ' ' + arc.eY + '" ';
                    path += 'stroke="' + $scope.trackColor + '" ' +
                        'stroke-linecap="' + $scope.lineCap + '" ' +
                        'stroke-width="' + $scope.barWidth + '" ' +
                        'fill="transparent"' +
                        '/>';

                }

                var arc = getArc(startAngle, endAngle);
                path += '<path d="M' + arc.sX + ' ' + arc.sY;
                path += ' A ' + radius + ' ' + radius + ',0,'+ arc.dir + ',1,' + arc.eX + ' ' + arc.eY + '" ';
                path += 'stroke="' + $scope.barColor + '" ' +
                    'stroke-linecap="' + $scope.lineCap + '" ' +
                    'stroke-width="' + $scope.barWidth + '" ' +
                    'fill="transparent"' +
                    '/>';

                path += '<text text-anchor="middle" x="' + center + '" y="' + center + '">' +
                    '<tspan class="dialgauge-value">12.3</tspan>' +
                    '<tspan class="dialgauge-unit">DegC</tspan>' +
                    '<tspan class="dialgauge-title" x="'+center+'" dy="20">Temperature</tspan>' +
                    '</text>';

                console.log(path);
                $scope.gauge = $sce.trustAsHtml("<svg>" + path + "</svg>");


                var w = angular.element($window);
                w.bind('resize', function () {
                    var x = $element.height();
                    var width = e.width();
                    var height = e.height();
                    //                    'h': w.height()
                    $scope.$apply();
                });

                function getArc(startAngle, endAngle) {
                    var startX = center + (Math.cos(startAngle) * radius);
                    var startY = center + (Math.sin(startAngle) * radius);
                    var endX = center + (Math.cos(endAngle) * radius);
                    var endY = center + (Math.sin(endAngle) * radius);
                    var dir = 0;
                    if(startAngle + endAngle > Math.PI) {
                        dir = 1;
                    }
                    else if(startAngle > endAngle) {
                        dir = 1;
                    }

                    return {sX:startX, sY:startY, eX: endX, eY: endY, dir: dir};
                }
            }
        };
    })
;

