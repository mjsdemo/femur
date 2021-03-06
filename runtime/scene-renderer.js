// Copyright (c) 2012, Motorola Mobility, Inc.
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
//  * Neither the name of the Motorola Mobility, Inc. nor the names of its
//    contributors may be used to endorse or promote products derived from this
//    software without specific prior written permission.
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
var Technique = require("runtime/technique").Technique;
var ScenePass = require("runtime/pass").ScenePass;
var BuiltInAssets = require("runtime/builtin-assets").BuiltInAssets;

exports.SceneRenderer = Object.create(Object.prototype, {

    loadPickingTechnique: {
        value: function() {
            var self = this;
            var techniquePromise = BuiltInAssets.assetWithName( "pickingTechnique");

            techniquePromise.then(function (asset) {
                self.technique.rootPass.sceneRenderer.pickingTechnique = asset;
            }, function (error) {
            }, function (progress) {
            });
        }
    },

    createTechniqueIfNeeded: {
        value: function() {
            if (!this._technique) {
                this._technique = Object.create(Technique).init();
                var pass = Object.create(ScenePass).init();
                //there is just one pass, so passName will be automatically set to "defaultPass"
                this._technique.passes = { "defaultPass": pass };
            }
        }
    },

    _webGLRenderer: { value: null, writable: true },

    _technique: { value: null, writable: true },

    technique: {
        get: function() {
            return this._technique;
        },
        set: function(value) {
            this._technique = value;
        }
    },

    //All the code within the compressedMeshDelegate comes from webgl-loader project
    //http://www.apache.org/licenses/LICENSE-2.0
    compressedMeshDelegate: {
        value: {

            handleError: function(errorCode, info) {
                console.log("ERROR:vertexAttributeBufferDelegate:"+errorCode+" :"+info);
            },

            decompressAttribsInner_: function(str, inputStart, inputEnd,
                                             output, outputStart, stride,
                                             decodeOffset, decodeScale) {
                var prev = 0;
                for (var j = inputStart; j < inputEnd; j++) {
                    var code = str.charCodeAt(j);
                    prev += (code >> 1) ^ (-(code & 1));
                    output[outputStart] = decodeScale * (prev + decodeOffset);
                    outputStart += stride;
                }
            },

            decompressIndices_: function(str, inputStart, numIndices,
                                         output, outputStart) {
                var highest = 0;
                for (var i = 0; i < numIndices; i++) {
                    var code = str.charCodeAt(inputStart++);
                    output[outputStart++] = highest - code;
                    if (code == 0) {
                        highest++;
                    }
                }
            },

            decompressMesh: function(str, meshParams, decodeParams, callback)  {
                // Extract conversion parameters from attribArrays.
                var stride = decodeParams.decodeScales.length;
                var decodeOffsets = decodeParams.decodeOffsets;
                var decodeScales = decodeParams.decodeScales;
                var attribStart = meshParams.attribRange[0];
                var numVerts = meshParams.attribRange[1];

                // Decode attributes.
                var inputOffset = attribStart;
                var attribsOut = new Float32Array(stride * numVerts);
                for (var j = 0; j < stride; j++) {
                    var end = inputOffset + numVerts;
                    var decodeScale = decodeScales[j];
                    if (decodeScale) {
                        // Assume if decodeScale is never set, simply ignore the
                        // attribute.
                        this.decompressAttribsInner_(str, inputOffset, end,
                            attribsOut, j, stride,
                            decodeOffsets[j], decodeScale);
                    }
                    inputOffset = end;
                }

                var indexStart = meshParams.indexRange[0];
                var numIndices = 3*meshParams.indexRange[1];
                var indicesOut = new Uint16Array(numIndices);
                this.decompressIndices_(str, inputOffset, numIndices, indicesOut, 0);

                // Decode bboxen.
                /*
                var bboxen = undefined;
                var bboxOffset = meshParams.bboxes;
                if (bboxOffset) {
                    bboxen = decompressAABBs_(str, bboxOffset, meshParams.names.length,
                        decodeOffsets, decodeScales);
                }
                */
                callback(attribsOut, indicesOut, null, meshParams);
            },


            convert: function (resource, ctx) {

                var outputBuffer = Module.testDecode(resource);
                var compression = ctx.mesh.compression;

                var trianglesCount = 0;
                var vertexCount = 0;
                var mesh = ctx.mesh;
                if (compression.compressedData) {
                    //Currently the converter guarantees that compressed mesh just have single primitive
                    vertexCount = compression.compressedData.verticesCount;
                    trianglesCount = compression.compressedData.indicesCount / 3;
                }

                var buf = new ArrayBuffer(outputBuffer.length); // 2 bytes for each char
                var bufView = new Uint8Array(buf);
                for (var i=0, strLen=outputBuffer.length; i<strLen; i++) {
                    bufView[i] = outputBuffer.charCodeAt(i);
                }

                var indicesShort = new Uint16Array(buf, 0, trianglesCount * 3);
                for (var i = 0 ; i < trianglesCount * 3 ; i++) {
                    indicesShort[i] = bufView[i * 4] | bufView[(i * 4) + 1] << 8;
                }

                var bufPos = buf.slice(Uint32Array.BYTES_PER_ELEMENT * trianglesCount * 3 , (Uint32Array.BYTES_PER_ELEMENT * trianglesCount * 3 ) + Float32Array.BYTES_PER_ELEMENT * vertexCount * 3);
                var positions = new Float32Array(bufPos);

                var offsetNormal = (Uint32Array.BYTES_PER_ELEMENT * trianglesCount * 3) + Float32Array.BYTES_PER_ELEMENT * vertexCount * 3;
                var normPos = buf.slice(offsetNormal, offsetNormal + Float32Array.BYTES_PER_ELEMENT * vertexCount * 3);
                var normals = new Float32Array(normPos);

                var offsetTexcoord = offsetNormal + Float32Array.BYTES_PER_ELEMENT * vertexCount * 3;
                var texCoordPos = buf.slice(offsetTexcoord, offsetTexcoord + Float32Array.BYTES_PER_ELEMENT * vertexCount * 2);
                var texCoords = new Float32Array(texCoordPos);


                ctx.renderer.setupCompressedMesh2(ctx.mesh, vertexCount, positions, normals, texCoords, indicesShort);

                /*
                var indexRange = compression.indexRange;
                if (indexRange) {
                    var meshEnd = indexRange[0] + 3*indexRange[1];
                    var callback = null;
                    this.decompressMesh(resource, compression, compression,
                        function(attribsOut, indicesOut, bboxen, meshParams) {
                            ctx.webGLRenderer.setupCompressedMesh(ctx.mesh, attribsOut, indicesOut);
                    });
                }
                */

                return resource;
            },

            resourceAvailable: function (glResource, ctx) {
            }
        }
    },

    scene: {
        get: function() {
            return this.technique.rootPass.scene;
        },
        set: function(value) {
            var self = this;
            var scene = this.technique.rootPass.scene;
            if (scene != value) {
                this.technique.rootPass.scene = value;

                this.scene.rootNode.apply( function(node, parent, context) {
                    if (node.meshes) {
                        node.meshes.forEach(function (mesh) {
                            if (mesh.compression) {
                                var requestType = "text";
                                if (mesh.compression.compressedData.mode) {
                                    if (mesh.compression.compressedData.mode == "binary") {
                                        requestType = "arraybuffer";
                                    }
                                }

                                mesh.compression.compressedData.requestType = requestType;

                                self.webGLRenderer.resourceManager.getResource(mesh.compression.compressedData, self.compressedMeshDelegate,
                                    { "mesh" : mesh, "renderer" : self.webGLRenderer});
                            }
                        }, this);
                    }
                } , true, null);

            }
        }
    },

    webGLRenderer: {
        get: function() {
            return this._webGLRenderer;
        },
        set: function(value) {
            this._webGLRenderer = value;
        }
    },

    init: {
        value: function( webGLRenderer, options) {
            this.webGLRenderer = webGLRenderer;
            this.createTechniqueIfNeeded();
            this.loadPickingTechnique();
            return this;
        }
    },

    render: {
        value: function(options) {
            if (this.technique)
                this.technique.execute(this.webGLRenderer, options);
        }
    }

});

