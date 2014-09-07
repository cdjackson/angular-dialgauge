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
                scaleMin: '@',
                scaleMax: '@',
                rotate: '@',
                angle: '@',
                units: '@',
                title: '@',
                dialWidth: '@',
                borderWidth: '@',
                borderOffset: '@',
                borderColor: '@',
                trackColor: '@',
                barColor: '@',
                barWidth: '@',
                barAngle: '@',
                scaleOffset: '@',
                lineCap: '@',
                scaleMinorColor: '@',
                scaleMinorWidth: '@',
                scaleMinorLength: '@',
                scaleMinorSteps: '@',
                scaleMajorColor: '@',
                scaleMajorWidth: '@',
                scaleMajorLength: '@',
                scaleMajorSteps: '@'
            },
            template: '' +
                '<div style="width:100%" ng-bind-html="gauge"</div>',
            //         link: function ($scope, $element, $state) {
            controller: function ($scope, $element) {
                // Define variables for this gauge
                var radDeg = 180 / Math.PI;
                var staticPath = "";
                var pathRadius = 0;
                var valueScale = 0;
                var startAngle = 0;
                var endAngle = 0;
                var barAngle = 0;
                var fullAngle = 0;
                var valWindow = null;
                var currentValue = null;
                var intermediateValue = null;
                var timer = null;
                var height;
                var width;


                var rect = $element[0].getBoundingClientRect();
                var center = Math.floor(Math.min(rect.width, rect.height) / 2);
                height = width = center * 2;

                $scope.getElementDimensions = function () {
                    var rect = $element[0].getBoundingClientRect();
                    return { 'h': rect.height, 'w': rect.width };
                };

                $scope.$watch($scope.getElementDimensions, function (newValue, oldValue) {
                    var c = Math.floor(Math.min(newValue.w, newValue.h) / 2);

                    // Update the static path for the gauge if it's changed
                    if (c != center) {
                        center = c;
                        height = width = center * 2;
                        staticPath = createStaticPath();
                        updateBar(currentValue);
                    }
                }, true);


                // Add a watch on all configuration variables.
                // If anything changes, update the static path
                $scope.$watch([
                    'rotate',
                    'angle',
                    'scaleMin',
                    'scaleMax',
                    'lineCap',
                    'barWidth',
                    'barColor',
                    'barAngle',
                    'trackColor',
                    'scaleOffset',
                    'scaleMinorSteps',
                    'scaleMajorColor',
                    'scaleMajorWidth',
                    'scaleMajorLength',
                    'scaleMajorSteps',
                    'scaleMinorLength',
                    'scaleMinorWidth',
                    'scaleMinorColor',
                    'dialWidth',
                    'borderWidth',
                    'borderOffset',
                    'borderColor',
                    'units'
                ], function () {
                    $scope.rotate = $scope.rotate || 180;
                    $scope.angle = $scope.angle || 250;
                    $scope.lineCap = $scope.lineCap || "round";
                    $scope.trackColor = $scope.trackColor || "#e0e0e0";
                    $scope.scaleMinorSteps = $scope.scaleMinorSteps || 36;
                    $scope.scaleMajorColor = $scope.scaleMajorColor || "#606060";
                    $scope.scaleMajorWidth = $scope.scaleMajorWidth || 1.0;
                    $scope.scaleMajorLength = $scope.scaleMajorLength || 5;
                    $scope.scaleMajorSteps = $scope.scaleMajorSteps || 9;
                    $scope.scaleMinorLength = $scope.scaleMinorLength || 3;
                    $scope.scaleMinorWidth = $scope.scaleMinorWidth || 0.5;
                    $scope.scaleMinorColor = $scope.scaleMinorColor || "#606060";
                    $scope.barAngle = $scope.barAngle || 0;
                    $scope.barWidth = $scope.barWidth || 3;
                    $scope.barColor = $scope.barColor || "#ff0000";
                    $scope.scaleOffset = $scope.scaleOffset || 3;
                    $scope.dialWidth = $scope.dialWidth || 5;
                    $scope.borderWidth = $scope.borderWidth || 1;
                    $scope.borderOffset = $scope.borderOffset || 3;
                    $scope.borderColor = $scope.borderColor || "#c0c0c0";
                    $scope.scaleMin = $scope.scaleMin || 0;
                    $scope.scaleMax = $scope.scaleMax || 100;

                    barAngle = $scope.barAngle / radDeg / 2;
                    fullAngle = $scope.angle / radDeg;

                    // Calculate the minimum step used when moving the pointer
                    // If the step is below this value, then we set to the final value
                    valWindow = ($scope.scaleMax - $scope.scaleMin) / 2000

                    // Update the static path for the gauge
                    staticPath = createStaticPath();
                }, true);

                // Set a watch on the model so we can update the dynamic part of the gauge
                $scope.$watch("ngModel", function (value) {
                    // The gauge isn't updated immediately.
                    // We use a timer to update the gauge dynamically
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
                    timer = $interval(function () {
                            var step = (currentValue - intermediateValue) / 10;
                            if (Math.abs(step) < valWindow) {
                                intermediateValue = currentValue;
                                $interval.cancel(timer);
                            }
                            else {
                                intermediateValue += step;
                            }
                            updateBar(intermediateValue);
                        },
                        20, 100);
                });

                // Create the static part of the gauge
                function createStaticPath() {
                    // Sanity check
                    if(center <= 0) {
                        return;
                    }
                    var radius = center - $scope.dialWidth;

                    // Sanitise the rotation
                    // Rotation should start at the top, so we need to subtract 90 degrees
                    var rotate = $scope.rotate - 90;
                    if (rotate < 0) {
                        rotate += 360;
                    }
                    rotate = rotate + (360 - $scope.angle) / 2;

                    // Calculate start and end angles - in radians
                    startAngle = rotate / radDeg;
                    if (startAngle > Math.PI * 2) {
                        startAngle -= Math.PI * 2;
                    }
                    endAngle = startAngle + $scope.angle / radDeg;
                    if (endAngle > (Math.PI * 2)) {
                        endAngle -= (Math.PI * 2);
                    }

                    // Calculate the scaling factor for the value
                    // This accounts for the actual scale from the user, the rotation angle,
                    // and the conversion to radians
                    valueScale = ($scope.scaleMax - $scope.scaleMin) / $scope.scaleMax / 100 * $scope.angle /
                        radDeg;

                    // Keep all the static parts of the path separately cached
                    var path = "";

                    // Draw the BORDER
                    if ($scope.borderWidth != 0) {
                        // This is currently a full circle - maybe it should be an arc?
                        path += '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '" ' +
                            'style="stroke:' + $scope.borderColor + ';' +
                            'stroke-width:' + $scope.borderWidth + ';' +
                            'fill:transparent;' +
                            '"/>'

                        radius -= Math.ceil($scope.borderWidth / 2);
                        radius -= $scope.borderOffset;
                    }

                    // Calculate the maximum scale size
                    var scaleLength = 0;
                    if ($scope.scaleMinorLength != 0 || $scope.scaleMajorLength != 0) {
                        scaleLength = Math.max($scope.scaleMajorLength, $scope.scaleMinorLength);
                    }

                    // Draw the minor scale
                    if ($scope.scaleMinorLength != 0) {
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
                            if (scaleAngle > (Math.PI * 2)) {
                                scaleAngle -= (Math.PI * 2);
                            }
                        }
                        while (scaleSteps-- > 0);

                        path += '" ';
                        path += 'stroke="' + $scope.scaleMinorColor + '" ' +
                            'stroke-width="' + $scope.scaleMinorWidth + '" ' +
                            '/>';
                    }

                    // Draw the major scale
                    if ($scope.scaleMajorLength != 0) {
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
                            if (scaleAngle > (Math.PI * 2)) {
                                scaleAngle -= (Math.PI * 2);
                            }
                        }
                        while (scaleSteps-- > 0);

                        path += '" ';
                        path += 'stroke="' + $scope.scaleMajorColor + '" ' +
                            'stroke-width="' + $scope.scaleMajorWidth + '" ' +
                            '/>';
                    }

                    // Alter the radius to account for the scale
                    if (scaleLength !== 0) {
                        radius -= scaleLength;
                        radius -= $scope.scaleOffset;
                    }

                    // Draw the TRACK
                    pathRadius = radius;
                    if ($scope.trackColor != "none") {
                        var arc = getArc(radius, startAngle + 0.0000001, endAngle - 0.0000001);
                        path += '<path d="M' + arc.sX + ' ' + arc.sY;
                        path +=
                            ' A ' + radius + ' ' + radius + ',0,' + arc.dir + ',1,' + arc.eX + ' ' + arc.eY + '" ';
                        path += 'stroke="' + $scope.trackColor + '" ' +
                            'stroke-linecap="' + $scope.lineCap + '" ' +
                            'stroke-width="' + $scope.barWidth + '" ' +
                            'fill="transparent"' +
                            '/>';
                    }

                    if ($scope.title) {
                        path += '<text text-anchor="middle" x="' + center + '" y="' + (center + 20) +
                            '" class="dialgauge-title">' + $scope.title + '</text>';
                    }

                    return path;
                }

                // Update the dynamic part of the gauge
                function updateBar(newValue) {
                    // Sanity check the value
                    var value = newValue;
                    if (value > $scope.scaleMax) {
                        value = $scope.scaleMax;
                    }
                    if (value < $scope.scaleMin) {
                        value = $scope.scaleMin;
                    }

                    // Turn value into a percentage of the max angle
                    value = value * valueScale;

                    // Create the bar.
                    // If we've specified a barAngle, then only a small knob is required
                    // Otherwise we start from the beginning
                    var start, end;
                    if (barAngle !== 0) {
                        start = value - barAngle;
                        if (start < 0) {
                            start = 0;
                        }
                        end = start + (barAngle * 2);
                        if (end > fullAngle) {
                            end = fullAngle;
                            start = end - (barAngle * 2);
                        }

                        start = start + startAngle;
                        if (start > Math.PI * 2) {
                            start -= Math.PI * 2;
                        }
                        end = end + startAngle;
                    }
                    else {
                        start = startAngle;
                        end = value + startAngle;
                    }
                    if (end > Math.PI * 2) {
                        end -= Math.PI * 2;
                    }

                    var arc = getArc(pathRadius, start, end);

                    var path = "";
                    path += '<path d="M' + arc.sX + ' ' + arc.sY;
                    path +=
                        ' A ' + pathRadius + ' ' + pathRadius + ',0,' + arc.dir + ',1,' + arc.eX + ' ' + arc.eY + '" ';
                    path += 'stroke="' + $scope.barColor + '" ' +
                        'stroke-linecap="' + $scope.lineCap + '" ' +
                        'stroke-width="' + $scope.barWidth + '" ' +
                        'fill="transparent"' +
                        '/>';

                    path += '<text text-anchor="middle" x="' + center + '" y="' + center + '">' +
                        '<tspan class="dialgauge-value">' + Math.floor(newValue) + '</tspan>';

                    if ($scope.units != undefined) {
                        path += '<tspan dx="3" class="dialgauge-unit">' + $scope.units + '</tspan>';
                    }
                    path += '</text>';

                    $scope.gauge =
                        $sce.trustAsHtml('<svg width="' + width + 'pt" height="' + height + 'pt">' + staticPath + path +
                            '</svg>');
                }

                // Calculate the start and end positions
                // Also calculate the large-arc flag.
                // This is 1 for long, and 0 for short arc
                function getArc(radius, startAngle, endAngle) {
                    var startX = center + (Math.cos(startAngle) * radius);
                    var startY = center + (Math.sin(startAngle) * radius);
                    var endX = center + (Math.cos(endAngle) * radius);
                    var endY = center + (Math.sin(endAngle) * radius);
                    var dir = 0;

                    if (startAngle > endAngle && (Math.PI * 2 - startAngle + endAngle) > Math.PI) {
                        dir = 1;
                    }
                    else if (endAngle - startAngle < Math.PI) {
                        dir = 0;
                    }
                    else if (startAngle + endAngle > Math.PI) {
                        dir = 1;
                    }

                    return {sX: startX, sY: startY, eX: endX, eY: endY, dir: dir};
                }
            }
        };
    })
;

