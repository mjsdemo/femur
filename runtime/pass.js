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

/*
 a pass has the following 3 key elements
 -> inputs  []  -> scene,viewpoint
 -> program
 -> outputs

 handleDidChange/handleWillChange inputs

 inputs -> program -> ouput (default to framebuffer)

 -> delegate , to give control to another client object
 */

require("runtime/dependencies/gl-matrix");
var Montage = require("montage").Montage;
var Node = require("runtime/node").Node;
var Projection = require("runtime/projection").Projection;
var Camera = require("runtime/camera").Camera;
var Utilities = require("runtime/utilities").Utilities;
var WebGLRenderer = require("runtime/webgl-renderer").WebGLRenderer;
var Transform = require("runtime/transform").Transform;
var ResourceDescription = require("runtime/resource-description").ResourceDescription;

var LinkedListNode = Object.create(Object.prototype, {

    _content: { value: null, writable:true},

    content: {
        get: function() {
            return this._content;
        },
        set: function(value) {
            this._content = value;
        }
    },

    _previous: { value: null, writable:true},

    previous: {
        get: function() {
            return this._previous;
        },
        set: function(value) {
            this._previous = value;
        }
    },

    _next: { value: null, writable:true},

    next: {
        get: function() {
            return this._next;
        },
        set: function(value) {
            this._next = value;
        }
    },

    init: {
        value: function(content) {
            this.content = content;
            this.previous = null;
            this.next = null;
        }
    },

    removeFromList: {
        value: function() {
            if (this.previous) {
                this.previous.next = this.next;
            }
            if (this.next) {
                this.next.previous = this.previous;
            }
            this.next = null;
            this.previous = null;
        }
    }

});

var LinkedList = Object.create(Object.prototype, {

    _tail: { value: null, writable:true},

    tail: {
        get: function() {
            return this._tail;
        },
        set: function(value) {
            this._tail = value;
        }
    },

    _head: { value: null, writable:true},

    head: {
        get: function() {
            return this._head;
        },
        set: function(value) {
            this._head = value;
        }
    },

    append: {
        value: function(node) {
            if (!this.head) {
                this.head = node;
            }
            if (this.tail) {
                node.previous = this.tail;
                this.tail.next = node;
            }
            this.tail = node;
        }
    },

    remove: {
        value: function(node) {
            var id = node.content.id;

            var isTail = false,isHead = false;
            if (this.tail === node) {
                isTail = true;
                this.tail = node.previous;
            }

            if (this.head === node) {
                isHead = true;
                this.head = node.next;
            }

            //node.removeFromList();
            /* consistency check
             for (cnode = this.head ; cnode != null ; cnode = cnode.next) {
             if (id === cnode.content.id) {
             console.log("ERROR: inconsistency found isTail:"+isTail+" isHead:"+isHead);
             }
             }
             */
        }
    }

});

//-- Render Target ---

var RenderTarget = exports.RenderTarget = Object.create(Object.prototype, {

    _extras: { value: null, writable:true},

    _width: { value: 0, writable:true},

    _height: { value: 0, writable:true},

    _attachments: { value: null, writable:true},

    attachments: {
        get: function() {
            return this._attachments;
        },
        set: function(value) {
            this._attachments = value;
        }
    },

    init : {
        value: function() {
            this.attachments = [];
            this.extras = {};
            return this;
        }
    },

    width : {
        get: function() {
            return this._width;
        },
        set: function(value) {
            this._width = value;
        }
    },

    height : {
        get: function() {
            return this._height;
        },
        set: function(value) {
            this._height = value;
        }
    },

    extras : {
        get: function() {
            return this._extras;
        },
        set: function(value) {
            this._extras = value;
        }
    }
});

//-- Pass ---

var Pass = Object.create(Object.prototype, {

    _extras: { value: null, writable:true},

    //constants
    PROGRAM: { value: "program", writable: false },
    SCENE: { value: "scene", writable: false },

    _type: { value: null, writable:true},

    type: {
        get: function() {
            return this._type;
        }
    },

    extras : {
        get: function() {
            return this._extras;
        },
        set: function(value) {
            this._extras = value;
        }
    }
});

var ProgramPass = exports.ProgramPass = Montage.create(Pass, {

    _attributes: { value: null, writable: true },
    _uniforms: { value: null, writable: true },
    _states: { value: null, writable: true },
    _program: { value: null, writable: true },

    states: {
        get: function() {
            return this._states;
        },
        set: function(value) {
            this._states = value;
        }
    },

    program: {
        get: function() {
            return this._program;
        },
        set: function(value) {
            this._program = value;
        }
    },

    init: {
        value: function() {
            this.attributes = {};
            this.uniforms = {};
            this.states = {};
            this._type = Pass.PROGRAM;
            this.extras = {};
            return this;
        }
    }

});

var SceneRenderer = Object.create(Object.prototype, {

    _pathsInfosArray: { value: null, writable: true },

    _pathsInfos: { value: null, writable: true },

    _pathIDsForNodeID: { value: null, writable: true },

    _primitivesPerPass: { value: null, writable: true },

    _viewPoint: { value: null, writable: true },

    _scene: { value: null, writable: true },

    viewPoint: {
        get: function() {
            return this._viewPoint;
        },
        set: function(value) {
            if (this._viewPoint != value) {
                this._viewPoint = value;
            }
        }
    },

    setupNodeAtPath: {
        value:function(node, pathID) {

            if (node.meshes) {
                node.meshes.forEach( function(mesh) {

                    if (mesh.primitives) {
                        //go through all primitives within all meshes
                        //TODO: cache all this
                        mesh.primitives.forEach( function (primitive) {
                            if (primitive.material) {
                                var technique = primitive.material.technique;
                                if (technique) {
                                    if (technique.rootPass) {
                                        var passUniqueID = technique.rootPass.id;
                                        var passWithPrimitives = this._primitivesPerPass[passUniqueID];
                                        if (!passWithPrimitives) {
                                            passWithPrimitives = this._primitivesPerPass[passUniqueID] = {
                                                "pass" : technique.rootPass,
                                                "primitives" : []
                                            };
                                        }

                                        var pathInfo = this._pathsInfos[pathID];
                                        if (pathInfo) {
                                            var WORLD = WebGLRenderer.WORLD;
                                            var WORLDVIEW = WebGLRenderer.WORLDVIEW;
                                            var WORLDVIEWINVERSETRANSPOSE = WebGLRenderer.WORLDVIEWINVERSETRANSPOSE;

                                            var renderPrimitive = {};
                                            renderPrimitive["primitive"] = primitive;
                                            renderPrimitive[WORLD] = pathInfo[WORLD];
                                            renderPrimitive[WORLDVIEWINVERSETRANSPOSE] = pathInfo[WORLDVIEWINVERSETRANSPOSE];
                                            renderPrimitive[WORLDVIEW] = pathInfo[WORLDVIEW];
                                            renderPrimitive.nodeID = node.id;

                                            passWithPrimitives.primitives.push(renderPrimitive);
                                        }
                                    }
                                }
                            }
                        }, this);
                    }
                }, this);
            }
        }
    },

    getPathIDsForNodeID: {
        value: function(nodeID) {
            return this._pathIDsForNodeID[nodeID];
        }
    },

    addPathIDForNodeID: {
        value: function(nodeID, pathID) {
            var pathIDs = this.pathIDsForNodeID;
            if (!pathIDs) {
                pathIDs = [];
                this._pathIDsForNodeID[nodeID] = pathIDs;
            }

            pathIDs.push(pathID);
        }
    },

    updateTransforms: {
        value: function() {
            if (this.scene) {
                var self = this;
                var context = mat4.identity();
                this.scene.rootNode.apply( function(node, parent, context) {
                    var worldMatrix;
                    var pathID = self._pathIDsForNodeID[node.id];

                    var pathInfos = self._pathsInfos[pathID];
                    if (pathInfos) {
                        worldMatrix = pathInfos[WebGLRenderer.WORLD];
                    } else {
                        worldMatrix = parentMatrix;
                    }

                    var parentMatrix = context;
                    mat4.multiply(parentMatrix, node.transform.matrix , worldMatrix);

                    node.worldTransform = worldMatrix;

                    return worldMatrix;
                } , true, context);
            }
        }
    },

    sceneDidChange: {
        value: function() {
            //prepares all infos
            this._pathsInfos = {};
            this._pathIDsForNodeID = {};
            this._primitivesPerPass = {};
            this._pathsInfosArray = [];

            //TODO: expose list of nodes / cameras / light / material
            var nodes = {};

            //Assign a view point from available nodes with camera if none
            var self = this;
            var cameraNodes = [];
            var WORLD = WebGLRenderer.WORLD;
            var WORLDVIEW = WebGLRenderer.WORLDVIEW;
            var WORLDVIEWINVERSETRANSPOSE = WebGLRenderer.WORLDVIEWINVERSETRANSPOSE;

            var context = {};
            context["path"] = [];
            context[WORLD] = mat4.identity();
            var pathCount = 0;

            if (!this.scene)
                return;
            this.scene.rootNode.apply( function(node, parent, context) {
                var worldMatrix = mat4.create();

                mat4.multiply(context[WORLD], node.transform.matrix , worldMatrix);

                var path = context.path.concat([node.id]);
                var pathID = path.join('-');

                nodes[node.id] = node;

                var pathInfos = {};
                pathInfos[WORLD] = worldMatrix;
                pathInfos[WORLDVIEWINVERSETRANSPOSE] = mat3.create();
                pathInfos[WORLDVIEW] = mat4.create();
                pathInfos["path"] = path;

                self.addPathIDForNodeID(node.id, pathID);
                self._pathsInfos[pathID] = pathInfos;
                self._pathsInfosArray[pathCount++] = pathInfos;
                self.setupNodeAtPath(node, pathID);

                if (node.cameras) {
                    if (node.cameras.length)
                        cameraNodes = cameraNodes.concat(node);
                }

                var newContext = {};
                newContext["path"] = path;
                newContext[WORLD] = worldMatrix;

                return newContext;
            } , true, context);

            // arbitry set first coming camera as the view point
            if (cameraNodes.length) {
                this.viewPoint = cameraNodes[0];
            } else {
                //TODO: make that a default projection method
                var projection = Object.create(Projection);
                projection.initWithDescription( {   "projection":"perspective",
                    "yfov":45,
                    "aspectRatio":1,
                    "znear":0.1,
                    "zfar":100});

                //create camera
                var camera = Object.create(Camera).init();
                camera.projection = projection;
                //create node to hold the camera
                var cameraNode = Object.create(Node).init();
                camera.name = cameraNode.name = "camera01";
                cameraNode.id = "__default_camera";
                cameraNode.cameras.push(camera);
                this.scene.rootNode.children.push(cameraNode);
                this.viewPoint = cameraNode;
            }
        }
    },


    render: {
        value: function(webGLRenderer, options) {
            if (!this.scene)
                return;

            var picking = options ? ((options.picking == true) && (options.coords)) : false;
            if (picking) {
                this.pickingRenderTarget.extras.coords = options.coords;
                webGLRenderer.bindRenderTarget(this.pickingRenderTarget);
            }
            this.updateTransforms();

            var skinnedNode = this.scene.rootNode.nodeWithPropertyNamed("instanceSkin");
            if (skinnedNode) {
                skinnedNode.instanceSkin.skin.process(skinnedNode, webGLRenderer.resourceManager);
            }

            //set projection matrix
            webGLRenderer.projectionMatrix = this.viewPoint.cameras[0].projection.matrix;

            //get view matrix
            var viewMatrix = mat4.create();

            //FIXME: hack, need to properly expose world matrix, the app can't currently access it.
            var pathID = this._pathIDsForNodeID[this.viewPoint.id];
            if (pathID) {
                var pathInfo = this._pathsInfos[pathID];
                mat4.inverse(pathInfo[WebGLRenderer.WORLD], viewMatrix);
            } else {
                mat4.inverse(this.viewPoint.transform.matrix, viewMatrix);
            }
            webGLRenderer.viewMatrix = viewMatrix;
            //to be cached
            var count = this._pathsInfosArray.length;

            for (var i = 0 ; i < count ; i++) {
                var pathInfos = this._pathsInfosArray[i];
                var worldMatrix = pathInfos[webGLRenderer.WORLD];
                var worldViewMatrix = pathInfos[webGLRenderer.WORLDVIEW];
                var normalMatrix = pathInfos[webGLRenderer.WORLDVIEWINVERSETRANSPOSE];
                mat4.multiply(viewMatrix, worldMatrix, worldViewMatrix);
                mat4.toInverseMat3(worldViewMatrix, normalMatrix);
                mat3.transpose(normalMatrix);
            }

            var nonOpaquePassesWithPrimitives = [];
            var keys = Object.keys(this._primitivesPerPass);
            keys.forEach( function(key) {
                var passWithPrimitives = this._primitivesPerPass[key];
                var pass = picking ? this.pickingPass : passWithPrimitives.pass;

                var states = pass.states;
                //we do not check hitTesting for non-opaque elements
                if (states.blendEnable && !picking) {
                    nonOpaquePassesWithPrimitives.push(passWithPrimitives);
                } else {
                    if (this.pickingTechnique)
                        webGLRenderer.renderPrimitivesWithPass(passWithPrimitives.primitives, pass, this.pickingTechnique.parameters);
                }
            }, this);

            if (!picking) {
                nonOpaquePassesWithPrimitives.forEach( function(passWithPrimitives) {
                    webGLRenderer.renderPrimitivesWithPass(passWithPrimitives.primitives, passWithPrimitives.pass);
                }, this);
            } else {
                webGLRenderer.unbindRenderTarget(this.pickingRenderTarget);

                var pickedPixel = this.pickingRenderTarget.extras.pickedPixel;
                var selectedNodeID = null;
                var nodeIDs = Object.keys(this.pickingPass.extras.nodeIDToColor);
                nodeIDs.forEach( function(nodeID) {
                    var color = this.pickingPass.extras.nodeIDToColor[nodeID];

                    if (Math.abs(Math.round(color[0]*255) - pickedPixel[0]) <= 1 &&
                        Math.abs(Math.round(color[1]*255) - pickedPixel[1]) <= 1 &&
                        Math.abs(Math.round(color[2]*255) - pickedPixel[2]) <= 1)  {
                        selectedNodeID = nodeID;
                    }
                }, this);
                options.delegate.handleSelectedNode(selectedNodeID);
            }
        }
    },

    scene: {
        get: function() {
            return this._scene;
        },
        set: function(value) {
            if (this._scene != value) {
                this._scene = value;
                this.sceneDidChange();
            }
        }
    },

    _pickingPass: { value: null, writable: true },

    pickingPass: {
        get: function() {
            return this._pickingPass;
        },
        set: function(value) {
            this._pickingPass = value;
            this._pickingPass.id = "__PickingPass";
            this._pickingPass.extras.nodeIDToColor = {};
        }
    },

    _pickingTechnique: { value: null, writable: true },

    pickingTechnique: {
        get: function() {
            return this._pickingTechnique;
        },
        set: function(value) {
            this._pickingTechnique = value;
            this.pickingPass =this._pickingTechnique.rootPass;
        }
    },

    _pickingRenderTarget: { value: null, writable: true },

    pickingRenderTarget: {
        get: function() {
            return this._pickingRenderTarget;
        },
        set: function(value) {
            this._pickingRenderTarget = value;
        }
    },

    createPickingRenderTargetIfNeeded: {
        value: function() {
            if (!this._pickingRenderTarget) {
                this._pickingRenderTarget = Object.create(RenderTarget).init();
                this._pickingRenderTarget.attachments.push({
                    "semantic" : "COLOR_ATTACHMENT0",
                    "parameter" : "__pickingTexture"
                });
                this._pickingRenderTarget.attachments.push({
                    "semantic" : "DEPTH_ATTACHMENT",
                    "parameter" : "__pickingRenderBuffer"
                });
                this.pickingRenderTarget.extras.picking = true;
            }
            return this._pickingRenderTarget;
        }
    },

    init: {
        value: function() {
            this.pickingRenderTarget = this.createPickingRenderTargetIfNeeded();
            this.pickingRenderTarget.width = 512;
            this.pickingRenderTarget.height = 512;
            return this;
        }
    }

});

var ScenePass = exports.ScenePass = Object.create(Pass, {

    _sceneRenderer: { value: null, writable: true },

    createSceneRendererIfNeeded: {
        value: function() {
            if (!this._sceneRenderer) {
                this._sceneRenderer = Object.create(SceneRenderer).init();
            }
        }
    },

    sceneRenderer: {
        get: function() {
            this.createSceneRendererIfNeeded();
            return this._sceneRenderer;
        },
        set: function(value) {
            this.createSceneRendererIfNeeded();
            if (this._sceneRenderer != value) {
                this._sceneRenderer = value;
            }
        }
    },

    viewPoint: {
        get: function() {
            return this.sceneRenderer ? this.sceneRenderer.viewPoint : null;
        },
        set: function(viewpoint) {
            if (this.sceneRenderer) {
                this.sceneRenderer.viewPoint = viewpoint;
            }
        }
    },

    scene: {
        get: function() {
            return this.sceneRenderer.scene;
        },
        set: function(value) {
            this.sceneRenderer.scene = value;
        }
    },

    execute: {
        value: function(webGLRenderer, options) {
            //pickingRenderTarget
            this.sceneRenderer.render(webGLRenderer, options);
        }
    },

    init: {
        value: function() {
            this._type = Pass.SCENE;
            this.extras = {};
            return this;
        }
    }

});

/*
 hitTest: {
 value: function(position, viewport, options) {

 if (this.inputs.scene && this.inputs.viewPoint) {
 var results = [];
 var cameraMatrix = mat4.create();
 var viewerMat =  this.inputs.viewPoint.transform;
 var viewer = vec3.createFrom(viewerMat[12],viewerMat[13], viewerMat[14]);
 var self = this;
 mat4.inverse(viewerMat, cameraMatrix);
 var origin = vec3.create();
 var dest = vec3.create();
 var camera = this.inputs.viewPoint.cameras[0];
 var screenSpaceVec1 = [position[0], viewport[3] - position[1],  camera.projection.znear];
 var screenSpaceVec2 = [position[0], viewport[3] - position[1],  camera.projection.zfar];

 var projectionMatrix = camera.projection.matrix;
 vec3.unproject(screenSpaceVec1, cameraMatrix, projectionMatrix, viewport, origin);
 vec3.unproject(screenSpaceVec2, cameraMatrix, projectionMatrix, viewport, dest);

 var X = 0;
 var Y = 1;
 var Z = 2;
 var direction = vec3.create();
 var originTr = vec3.create();
 var directionTr = vec3.create();
 var ctx = mat4.identity();
 this.inputs.scene.rootNode.apply( function(node, parent, parentTransform) {
 var modelMatrix = mat4.create();
 var modelViewMatrix = mat4.create();
 mat4.multiply( parentTransform, node.transform, modelMatrix);
 mat4.multiply( cameraMatrix, modelMatrix, modelViewMatrix);

 if (node.boundingBox) {
 var modelMatrixInv = mat4.create();
 mat4.inverse(modelMatrix, modelMatrixInv);

 mat4.multiplyVec3(modelMatrixInv, origin, originTr);
 mat4.multiplyVec3(modelMatrixInv, dest, directionTr);
 vec3.subtract(directionTr, originTr);
 vec3.normalize(directionTr);

 var bbox = node.boundingBox;
 if (Utilities.intersectsBBOX(bbox, [originTr , directionTr])) {
 var meshes = node.meshes;
 meshes.forEach( function(mesh) {
 var box = mesh.boundingBox;
 if (box) {
 if (Utilities.intersectsBBOX(box, [originTr , directionTr])) {
 Utilities.rayIntersectsMesh([originTr , directionTr], mesh, modelViewMatrix, results, options);
 }
 }
 }, this);
 if (results.length > 0) {
 results.sort( function(a,b) {

 var dist = vec3.create();
 vec3.subtract(a.intersection, viewer, dist);
 var d1 = vec3.dot(dist,dist);
 vec3.subtract(b.intersection, viewer, dist);
 var d2 = vec3.dot(dist,dist);
 return d1 - d2 }
 );
 }
 }
 }
 return modelMatrix;

 }, true, ctx);
 }
 return results;
 }
 },*/
