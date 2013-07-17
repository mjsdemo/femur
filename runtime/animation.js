// Copyright (c) 2013, Fabrice ROBINET.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//  * Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//  * Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
// THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

require("runtime/dependencies/gl-matrix");
var Base = require("runtime/base").Base;

var Channel = exports.Channel = Object.create(Base, {

    _sampler: { value: null, writable: true },

    sampler: {
        get: function() {
            return this._sampler;
        },
        set: function(value ) {
            this._sampler = value;
        }
    },

    _target: { value: null, writable: true },

    target: {
        get: function() {
            return this._target;
        },
        set: function(value ) {
            this._target = value;
        }
    },

    _path: { value: null, writable: true },

    path: {
        get: function() {
            return this._path;
        },
        set: function(value ) {
            this._path = value;
        }
    },

    parameterDelegate: {
        value: {
            handleError: function(errorCode, info) {
                console.log("ERROR:parameterDelegate:"+errorCode+" :"+info);
            },

            convert: function (resource, ctx) {
                //FIXME:harcode float32
                return new Float32Array(resource);
            },

            resourceAvailable: function (convertedResource, ctx) {
            }
        }
    },

    getParameterArray: {
        value: function(parameter, resourceManager) {
            return resourceManager.getResource(parameter, this.parameterDelegate, null);
        }
    },

    //This is not definitive... it's like this just for early testing
    updateTargetsAtTime: {
        value: function(time, resourceManager) {

            var inputParameter = this.sampler.input;
            var outputParameter = this.sampler.output;
            var inputArray = this.getParameterArray(inputParameter, resourceManager);
            var outputArray = this.getParameterArray(outputParameter, resourceManager);
            if (inputArray && outputArray) {
                time /= 1000;
                var count = inputParameter.count;
                var duration = inputArray[count - 1];
                time %= duration;
                var lastKeyIndex = 0;
                var i;
                var keyIndex = 0;
                var ratio = 0;
                var timeDelta = 0;
                if (count > 0) {
                    for (i = lastKeyIndex ; i < count - 1 ; i++) {
                        if ((inputArray[i] <= time) && (time < inputArray[i+1])) {
                            lastKeyIndex = i;
                            if (inputArray[i+1] != inputArray[i]) {
                                timeDelta = inputArray[i+1] - inputArray[i];
                                ratio = (time - inputArray[i]) / timeDelta;
                            }
                        }
                    }
                    var interpolatedValue = null;
                    switch (outputParameter.componentsPerAttribute) {
                        case 4 :
                            interpolatedValue = vec4.create();
                            break;
                        case 3 :
                            interpolatedValue = vec3.create();
                            break;
                        case 2 :
                            interpolatedValue = vec2.create();
                            break;
                        case 1 :
                            console.log("float interpolation not handled yet");
                            break;
                        default:
                            break;
                    }

                    this.index = lastKeyIndex;

                    var idx1 = lastKeyIndex * outputParameter.componentsPerAttribute;
                    var idx2 = idx1 + outputParameter.componentsPerAttribute;
                    if (this.path == "rotation") {
                        var AXIS_ANGLE_INTERP = 0;
                        var AXIS_ANGLE_INTERP_NAIVE = 1;
                        var QUATERNION = 2;

                        var interpolationType = QUATERNION;//AXIS_ANGLE_INTERP_NAIVE;

                        var axisAngle1 = vec4.createFrom(outputArray[idx1 + 0],outputArray[idx1 + 1],outputArray[idx1 + 2],outputArray[idx1 + 3]);
                        var axisAngle2 = vec4.createFrom(outputArray[idx2 + 0],outputArray[idx2 + 1],outputArray[idx2 + 2],outputArray[idx2 + 3]);
                        if (interpolationType == AXIS_ANGLE_INTERP) {
                            vec3.normalize(axisAngle1); //FIXME: do that upfront
                            vec3.normalize(axisAngle2);
                            //get the rotation axis from the cross product
                            var rotAxis = vec3.create();
                            vec3.cross(axisAngle1, axisAngle2, rotAxis);

                            var lA1 = Math.sqrt(vec3.dot(axisAngle1,axisAngle1));
                            var lA2 = Math.sqrt(vec3.dot(axisAngle2,axisAngle2));
                            //var rotAxis = vec3.createFrom(Bx,By,Bz);
                            //vec3.normalize(rotAxis);

                            //now the rotation angle
                            var angle = Math.acos(vec3.dot(axisAngle1,axisAngle2));
                            var axisAngleRotMat = mat4.identity();
                            mat4.rotate(axisAngleRotMat, angle * ratio, rotAxis);

                            mat4.multiplyVec3(axisAngleRotMat, axisAngle1, rotAxis);
                            vec3.normalize(rotAxis);

                            var interpolatedAngle = axisAngle1[3]+((axisAngle2[3]-axisAngle1[3]) * ratio);
                            quat4.fromAngleAxis(interpolatedAngle, rotAxis, interpolatedValue);
                        } else if (interpolationType == AXIS_ANGLE_INTERP_NAIVE) {
                            //direct linear interpolation of components, to be considered for small angles
                            for (i = 0 ; i < interpolatedValue.length ; i++) {
                                var v1 = axisAngle1[ i];
                                var v2 = axisAngle2[ i];
                                axisAngle2[i] = v1 + ((v2 - v1) * ratio);
                            }
                            quat4.fromAngleAxis(axisAngle2[3], axisAngle2, interpolatedValue);
                        } else if (interpolationType == QUATERNION) {
                            var k1 = quat4.create();
                            var k2 = quat4.create();
                            quat4.fromAngleAxis(outputArray[idx1 + 3],
                                vec3.createFrom(outputArray[idx1 + 0],outputArray[idx1 +1],outputArray[idx1 + 2]), k1);
                            quat4.fromAngleAxis(outputArray[idx2 + 3],
                                vec3.createFrom(outputArray[idx2 + 0],outputArray[idx2 + 1],outputArray[idx2 + 2]), k2);
                            quat4.slerp(k1, k2, ratio, interpolatedValue);
                        }

                    } else {
                        for (i = 0 ; i < interpolatedValue.length ; i++) {
                            var v1 = outputArray[idx1 + i];
                            var v2 = outputArray[idx2 + i];
                            interpolatedValue[i] = v1 + ((v2 - v1) * ratio);
                        }
                    }
                    this.target.transform[this.path] = interpolatedValue;
                }
            }
        }
    },

    initWithDescription: {
        value: function(description) {
            this.init();
            this.index = 0;
            this.target = description.target; //this will be overriden with the object

            return this;
        }
    },

    init: {
        value: function() {
            this.__Base_init();
            return this;
        }
    },


});

var Sampler = Object.create(Base, {
    _input: { value: null, writable: true },

    input: {
        get: function() {
            return this._input;
        },
        set: function(value ) {
            this._input = value;
        }
    },

    _output: { value: null, writable: true },

    output: {
        get: function() {
            return this._output;
        },
        set: function(value ) {
            this._output = value;
        }
    },

    initWithDescription: {
        value: function(description) {
            this.init();

            return this;
        }
    },

    init: {
        value: function() {
            this.__Base_init();
            return this;
        }
    }

});

exports.Animation = Object.create(Base, {

    _count: { value: 0, writable: true },

    _parameters: { value: null, writable: true },

    _channels: { value: null, writable: true },

    _samplers: { value: null, writable: true },

    _duration: { value: 0, writable: true },

    channels: {
        get: function() {
            return this._channels;
        },
        set: function(value ) {
            this._channels = value;
        }
    },

    samplers: {
        get: function() {
            return this._samplers;
        },
        set: function(value ) {
            this._samplers = value;
        }
    },

    parameters: {
        get: function() {
            return this._parameters;
        },
        set: function(value ) {
            this._parameters = value;
        }
    },

    count: {
        get: function() {
            return this._count;
        },
        set: function(value ) {
            this._count = value;
        }
    },

    duration: {
        get: function() {
            return this._duration;
        },
        set: function(value ) {
            this._duration = value;
        }
    },

    updateTargetsAtTime: {
        value: function(time, resourceManager) {
            this.channels.forEach( function(channel) {
                channel.updateTargetsAtTime(time, resourceManager);
            }, this);
        }

    },

    initWithDescription: {
        value: function(description) {
            this.init();

            this.count = description.count;

            var parameters = {};
            Object.keys(description.samplers).forEach( function(samplerID) {
                var samplerDescription = description.samplers[samplerID];
                var sampler = Object.create(Sampler).initWithDescription(samplerDescription);
                this.samplers[samplerID] = sampler;
            }, this);


            description.channels.forEach( function(channelDescription) {
                var animationChannel = Object.create(Channel).initWithDescription(channelDescription);

                animationChannel.sampler = this.samplers[channelDescription.sampler];
                animationChannel.target = channelDescription.target;

                this.channels.push(animationChannel);
            }, this);

            return this;
        }
    },

    init: {
        value: function() {
            this.__Base_init();
            this.channels = [];
            this.samplers = {};
            return this;
        }
    }
});

