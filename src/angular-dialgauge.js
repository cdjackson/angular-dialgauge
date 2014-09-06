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
    .directive('ngDialGauge', function ($window, $sce, $interval) {
        return {
            restrict: 'E', // Use as element
            scope: { // Isolate scope
                ngModel: '=',
                scaleMin: '=',
                scaleMax: '=',
                rotate: '=',
                units: '@',
                borderWidth: '@'
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
                if (rotate < 0) {
                    rotate += 360;
                }
                rotate = rotate + (360 - $scope.angle) / 2;

                // Calculate start and end angles - in radians
                var startAngle = rotate / radDeg;
                var endAngle = startAngle + $scope.angle / radDeg;
                if (endAngle > (Math.PI * 2)) {
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

                // Calculate the scaling factor for the value
                var valueScale = ($scope.scaleMax - $scope.scaleMin) / $scope.scaleMax / 100 * $scope.angle / radDeg;
                console.log("Value scale is", valueScale);

                // Keep all the static parts of the path separately cached
                var staticPath = "";

                // Draw the BORDER
                if ($scope.borderWidth) {
                    // This is currently a full circle - maybe it should be an arc?
                    staticPath += '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '"' +
                        'style="stroke:' + $scope.borderColor + ';' +
                        'stroke-width: ' + $scope.borderWidth + ';' +
                        'fill:transparent;"' +
                        '/>'

                    radius -= Math.ceil($scope.borderWidth / 2);
                    radius -= $scope.borderOffset;
                }

                // Calculate the maximum scale size
                var scaleLength = 0;
                if ($scope.scaleMinorLength !== 0 || $scope.scaleMajorLength !== 0) {
                    scaleLength = Math.max($scope.scaleMajorLength, $scope.scaleMinorLength);
                }

                // Draw the minor scale
                if ($scope.scaleMinorLength !== 0) {
                    staticPath += '<path d="';
                    var scaleAngle = startAngle;
                    var inner = radius - scaleLength;
                    var outer = inner + $scope.scaleMinorLength;
                    var scaleSteps = $scope.scaleMinorSteps;
                    var scaleInc = $scope.angle / scaleSteps / radDeg;
                    do {
                        var cos = Math.cos(scaleAngle);
                        var sin = Math.sin(scaleAngle);

                        staticPath += ' M' + (center + (cos * inner)) + ' ' + (center + (sin * inner));
                        staticPath += ' L' + (center + (cos * outer)) + ' ' + (center + (sin * outer));

                        scaleAngle += scaleInc;
                        if (scaleAngle > (Math.PI * 2)) {
                            scaleAngle -= (Math.PI * 2);
                        }
                    }
                    while (scaleSteps-- > 0);

                    staticPath += '" ';
                    staticPath += 'stroke="' + $scope.scaleMinorColor + '" ' +
                        'stroke-width="' + $scope.scaleMinorWidth + '" ' +
                        '/>';
                }

                // Draw the major scale
                if ($scope.scaleMajorLength !== 0) {
                    staticPath += '<path d="';
                    var scaleAngle = startAngle;
                    var inner = radius - scaleLength;
                    var outer = inner + $scope.scaleMajorLength;
                    var scaleSteps = $scope.scaleMajorSteps;
                    var scaleInc = $scope.angle / scaleSteps / radDeg;
                    do {
                        var cos = Math.cos(scaleAngle);
                        var sin = Math.sin(scaleAngle);

                        staticPath += ' M' + (center + (cos * inner)) + ' ' + (center + (sin * inner));
                        staticPath += ' L' + (center + (cos * outer)) + ' ' + (center + (sin * outer));

                        scaleAngle += scaleInc;
                        if (scaleAngle > (Math.PI * 2)) {
                            scaleAngle -= (Math.PI * 2);
                        }
                    }
                    while (scaleSteps-- > 0);

                    staticPath += '" ';
                    staticPath += 'stroke="' + $scope.scaleMajorColor + '" ' +
                        'stroke-width="' + $scope.scaleMajorWidth + '" ' +
                        '/>';
                }

                // Alter the radius to account for the scale
                if (scaleLength !== 0) {
                    radius -= scaleLength;
                    radius -= $scope.scaleOffset;
                }

                // Draw the TRACK
                if ($scope.trackColor) {
                    var arc = getArc(startAngle + 0.0000001, endAngle - 0.0000001);
                    staticPath += '<path d="M' + arc.sX + ' ' + arc.sY;
                    staticPath +=
                        ' A ' + radius + ' ' + radius + ',0,' + arc.dir + ',1,' + arc.eX + ' ' + arc.eY + '" ';
                    staticPath += 'stroke="' + $scope.trackColor + '" ' +
                        'stroke-linecap="' + $scope.lineCap + '" ' +
                        'stroke-width="' + $scope.barWidth + '" ' +
                        'fill="transparent"' +
                        '/>';
                }

                if(true) {
                    staticPath += '<text text-anchor="middle" x="' + center + '" y="' + (center + 20) +
                        '" class="dialgauge-title">Temperature</text>';
                }

                var valWindow = ($scope.scaleMax - $scope.scaleMin) / 2000;
                var currentValue = null;
                var intermediateValue = null;
                var timer = null;
                $scope.$watch("ngModel", function (value) {
                    if (currentValue == null) {
                        currentValue = value;
                        updateBar(value);
                        return;
                    }
                    if (timer != null) {
                        $interval.cancel(timer);
                        timer = null;
                    }
                    intermediateValue = currentValue;
                    currentValue = value;
                    console.log("Value is updated to", value);
                    timer = $interval(function () {
                            var step = (currentValue - intermediateValue) / 10;
                            if(Math.abs(step) < valWindow) {
                                intermediateValue = currentValue;
                                $interval.cancel(timer);
                            }
                            else {
                                intermediateValue += step;
                            }
                            console.log("Updating to", intermediateValue, "Destination", currentValue);
                            updateBar(intermediateValue);
                        },
                        20, 100);
                });

                var w = angular.element($window);
                w.bind('resize', function () {
                    var x = $element.height();
                    var width = e.width();
                    var height = e.height();
                    //                    'h': w.height()
                    $scope.$apply();
                });


//                updateBar($scope.ngModel);

                // Sanity check the value
                function updateBar(newValue) {
                    var value = newValue;
                    if (value > $scope.scaleMax) {
                        value = $scope.scaleMax;
                    }
                    if (value < $scope.scaleMin) {
                        value = $scope.scaleMin;
                    }

                    // Turn value into a percentage of the max angle
                    console.log("Value is", value);
                    value = value * valueScale;
                    console.log("Value angle is", value);
                    var valueAngle = value + startAngle;
                    if (valueAngle > Math.PI * 2) {
                        valueAngle -= Math.PI * 2;
                    }

                    var arc = getArc(startAngle, valueAngle);

                    var path = "";
                    path += '<path d="M' + arc.sX + ' ' + arc.sY;
                    path += ' A ' + radius + ' ' + radius + ',0,' + arc.dir + ',1,' + arc.eX + ' ' + arc.eY + '" ';
                    path += 'stroke="' + $scope.barColor + '" ' +
                        'stroke-linecap="' + $scope.lineCap + '" ' +
                        'stroke-width="' + $scope.barWidth + '" ' +
                        'fill="transparent"' +
                        '/>';

                    path += '<text text-anchor="middle" x="' + center + '" y="' + center + '">' +
                        '<tspan class="dialgauge-value">' + Math.floor(newValue) + '</tspan>' +
                        '<tspan dx="3" class="dialgauge-unit">' + $scope.units + '</tspan>' +
                        '</text>';

                    //               console.log(path);
                    $scope.gauge = $sce.trustAsHtml("<svg>" + staticPath + path + "</svg>");
                }

                // Calculate the start and end positions
                // Also calculate the large-arc flag.
                // This is 1 for long, and 0 for short arc
                function getArc(startAngle, endAngle) {
                    console.log("Start/End :", startAngle, endAngle);

                    var startX = center + (Math.cos(startAngle) * radius);
                    var startY = center + (Math.sin(startAngle) * radius);
                    var endX = center + (Math.cos(endAngle) * radius);
                    var endY = center + (Math.sin(endAngle) * radius);
                    var dir = 0;

                    if (startAngle > endAngle && (Math.PI * 2 - startAngle + endAngle) > Math.PI) {
                        console.log("Case 3");
                        dir = 1;
                    }
                    else if (endAngle - startAngle < Math.PI) {
                        console.log("Case 1");
                        dir = 0;
                    }
                    else if (startAngle + endAngle > Math.PI) {
                        console.log("Case 2");
                        dir = 1;
                    }

                    return {sX: startX, sY: startY, eX: endX, eY: endY, dir: dir};
                }
            }
        };
    })
;

