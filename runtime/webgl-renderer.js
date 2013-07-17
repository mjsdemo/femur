// Copyright (c) 2013, Fabrice Robinet
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
var GLSLProgram = require("runtime/glsl-program").GLSLProgram;
var ResourceManager = require("runtime/helpers/resource-manager").ResourceManager;

exports.WebGLRenderer = Object.create(Object.prototype, {

    WORLD: { value: "WORLD", writable: false},
    VIEW: { value: "VIEW", writable: false},
    PROJECTION: { value: "PROJECTION", writable: false},
    WORLDVIEW: { value: "WORLDVIEW", writable: false},
    VIEWPROJECTION: { value: "VIEWPROJECTION", writable: false},
    WORLDVIEWPROJECTION: { value: "WORLDVIEWPROJECTION", writable: false},
    WORLDINVERSE: { value: "WORLDINVERSE", writable: false},
    VIEWINVERSE: { value: "VIEWINVERSE", writable: false},
    PROJECTIONINVERSE: { value: "PROJECTIONINVERSE", writable: false},
    WORLDVIEWINVERSE: { value: "WORLDVIEWINVERSE", writable: false},
    VIEWPROJECTIONINVERSE: { value: "VIEWPROJECTIONINVERSE", writable: false},
    WORLDVIEWPROJECTIONINVERSE: { value: "WORLDVIEWPROJECTIONINVERSE", writable: false},
    WORLDTRANSPOSE: { value: "WORLDTRANSPOSE", writable: false},
    VIEWTRANSPOSE: { value: "VIEWTRANSPOSE", writable: false},
    PROJECTIONTRANSPOSE: { value: "PROJECTIONTRANSPOSE", writable: false},
    WORLDVIEWTRANSPOSE: { value: "WORLDVIEWTRANSPOSE", writable: false},
    VIEWPROJECTIONTRANSPOSE: { value: "VIEWPROJECTIONTRANSPOSE", writable: false},
    WORLDVIEWPROJECTIONTRANSPOSE: { value: "WORLDVIEWPROJECTIONTRANSPOSE", writable: false},
    WORLDINVERSETRANSPOSE: { value: "WORLDINVERSETRANSPOSE", writable: false},
    VIEWINVERSETRANSPOSE: { value: "VIEWINVERSETRANSPOSE", writable: false},
    PROJECTIONINVERSETRANSPOSE: { value: "PROJECTIONINVERSETRANSPOSE", writable: false},
    WORLDVIEWINVERSETRANSPOSE: { value: "WORLDVIEWINVERSETRANSPOSE", writable: false},
    VIEWPROJECTIONINVERSETRANSPOSE: { value: "VIEWPROJECTIONINVERSETRANSPOSE", writable: false},
    WORLDVIEWPROJECTIONINVERSETRANSPOSE: { value: "WORLDVIEWPROJECTIONINVERSETRANSPOSE", writable: false},

    //private accessors
    _bindedProgram: { value: null, writable: true },

    _debugProgram: { value: null, writable: true },

    _lambertProgram: { value: null, writable: true },

    _resourceManager: { value: null, writable: true },

    _webGLContext: { value : null, writable: true },

    _projectionMatrix: { value : null, writable: true },

    //default values
    shininess: { value: 200, writable: true },

    light: { value: [0, 0, -1], writable: true },

    specularColor: { value: [1, 1, 1], writable: true },

    _GLEnumFromString: {
        value: null, writable: true
    },

    GLContextDidChange: {
        value: function(value) {
            this._GLEnumFromString = [];
            var GL = this.webGLContext;
            //var maxUniforms = GL.getParameter(GL.MAX_VERTEX_UNIFORM_VECTORS);

            /* BeginMode */
            this._GLEnumFromString["POINTS"] = GL.POINTS;
            this._GLEnumFromString["LINES"] = GL.LINES;
            this._GLEnumFromString["LINE_LOOP"] = GL.LINE_LOOP;
            this._GLEnumFromString["LINE_STRIP"] = GL.LINE_STRIP;
            this._GLEnumFromString["TRIANGLES"] = GL.TRIANGLES;
            this._GLEnumFromString["TRIANGLES"] = GL.TRIANGLES;
            this._GLEnumFromString["TRIANGLE_STRIP"] = GL.TRIANGLE_STRIP;
            this._GLEnumFromString["TRIANGLE_FAN"] = GL.TRIANGLE_FAN;

            /* BlendingFactorDest */
            this._GLEnumFromString["ZERO"] = GL.ZERO;
            this._GLEnumFromString["ONE"] = GL.ONE;
            this._GLEnumFromString["SRC_COLOR"] = GL.SRC_COLOR;
            this._GLEnumFromString["ONE_MINUS_SRC_COLOR"] = GL.ONE_MINUS_SRC_COLOR;
            this._GLEnumFromString["SRC_ALPHA"] = GL.SRC_ALPHA;
            this._GLEnumFromString["ONE_MINUS_SRC_ALPHA"] = GL.ONE_MINUS_SRC_ALPHA;
            this._GLEnumFromString["DST_ALPHA"] = GL.DST_ALPHA;
            this._GLEnumFromString["ONE_MINUS_DST_ALPHA"] = GL.ONE_MINUS_DST_ALPHA;

            /* BlendingFactorSrc */
            this._GLEnumFromString["DST_COLOR"] = GL.DST_COLOR;
            this._GLEnumFromString["ONE_MINUS_DST_COLOR"] = GL.ONE_MINUS_DST_COLOR;
            this._GLEnumFromString["SRC_ALPHA_SATURATE"] = GL.SRC_ALPHA_SATURATE;

            /* BlendEquationSeparate */
            this._GLEnumFromString["FUNC_ADD"] = GL.FUNC_ADD;
            this._GLEnumFromString["BLEND_EQUATION"] = GL.BLEND_EQUATION;
            this._GLEnumFromString["BLEND_EQUATION_RGB"] = GL.BLEND_EQUATION_RGB;
            this._GLEnumFromString["BLEND_EQUATION_ALPHA"] = GL.BLEND_EQUATION_ALPHA;

            /* BlendSubtract */
            this._GLEnumFromString["FUNC_SUBTRACT"] = GL.FUNC_SUBTRACT;
            this._GLEnumFromString["FUNC_REVERSE_SUBTRACT"] = GL.FUNC_REVERSE_SUBTRACT;

            /* Separate Blend Functions */
            this._GLEnumFromString["BLEND_DST_RGB"] = GL.BLEND_DST_RGB;
            this._GLEnumFromString["BLEND_SRC_RGB"] = GL.BLEND_SRC_RGB;
            this._GLEnumFromString["BLEND_DST_ALPHA"] = GL.BLEND_DST_ALPHA;
            this._GLEnumFromString["BLEND_SRC_ALPHA"] = GL.BLEND_SRC_ALPHA;
            this._GLEnumFromString["CONSTANT_COLOR"] = GL.CONSTANT_COLOR;
            this._GLEnumFromString["ONE_MINUS_CONSTANT_COLOR"] = GL.ONE_MINUS_CONSTANT_COLOR;
            this._GLEnumFromString["CONSTANT_ALPHA"] = GL.CONSTANT_ALPHA;
            this._GLEnumFromString["ONE_MINUS_CONSTANT_ALPHA"] = GL.ONE_MINUS_CONSTANT_ALPHA;
            this._GLEnumFromString["BLEND_COLOR"] = GL.BLEND_COLOR;

            /* Buffer Objects */
            this._GLEnumFromString["ARRAY_BUFFER"] = GL.ARRAY_BUFFER;
            this._GLEnumFromString["ELEMENT_ARRAY_BUFFER"] = GL.ELEMENT_ARRAY_BUFFER;
            this._GLEnumFromString["ARRAY_BUFFER_BINDING"] = GL.ARRAY_BUFFER_BINDING;
            this._GLEnumFromString["ELEMENT_ARRAY_BUFFER_BINDING"] = GL.ELEMENT_ARRAY_BUFFER_BINDING;

            this._GLEnumFromString["STREAM_DRAW"] = GL.STREAM_DRAW;
            this._GLEnumFromString["STATIC_DRAW"] = GL.STATIC_DRAW;
            this._GLEnumFromString["DYNAMIC_DRAW"] = GL.DYNAMIC_DRAW;

            this._GLEnumFromString["BUFFER_SIZE"] = GL.BUFFER_SIZE;
            this._GLEnumFromString["BUFFER_USAGE"] = GL.BUFFER_USAGE;

            this._GLEnumFromString["CURRENT_VERTEX_ATTRIB"] = GL.CURRENT_VERTEX_ATTRIB;

            /* CullFaceMode */
            this._GLEnumFromString["FRONT"] = GL.FRONT;
            this._GLEnumFromString["BACK"] = GL.BACK;
            this._GLEnumFromString["FRONT_AND_BACK"] = GL.FRONT_AND_BACK;

            /* EnableCap */
            this._GLEnumFromString["CULL_FACE"] = GL.CULL_FACE;
            this._GLEnumFromString["BLEND"] = GL.BLEND;
            this._GLEnumFromString["STENCIL_TEST"] = GL.STENCIL_TEST;
            this._GLEnumFromString["DEPTH_TEST"] = GL.DEPTH_TEST;
            this._GLEnumFromString["SCISSOR_TEST"] = GL.SCISSOR_TEST;
            this._GLEnumFromString["POLYGON_OFFSET_FILL"] = GL.POLYGON_OFFSET_FILL;
            this._GLEnumFromString["SAMPLE_ALPHA_TO_COVERAGE"] = GL.SAMPLE_ALPHA_TO_COVERAGE;
            this._GLEnumFromString["SAMPLE_COVERAGE"] = GL.SAMPLE_COVERAGE;

            /* FrontFaceDirection */
            this._GLEnumFromString["CW"] = GL.CW;
            this._GLEnumFromString["CCW"] = GL.CCW;

            /* DataType */
            this._GLEnumFromString["BYTE"] = GL.BYTE;
            this._GLEnumFromString["UNSIGNED_BYTE"] = GL.UNSIGNED_BYTE;
            this._GLEnumFromString["SHORT"] = GL.SHORT;
            this._GLEnumFromString["UNSIGNED_SHORT"] = GL.UNSIGNED_SHORT;
            this._GLEnumFromString["INT"] = GL.INT;
            this._GLEnumFromString["UNSIGNED_INT"] = GL.UNSIGNED_INT;
            this._GLEnumFromString["FLOAT"] = GL.FLOAT;

            /* PixelFormat */
            this._GLEnumFromString["DEPTH_COMPONENT"] = GL.DEPTH_COMPONENT;
            this._GLEnumFromString["ALPHA"] = GL.ALPHA;
            this._GLEnumFromString["RGB"] = GL.RGB;
            this._GLEnumFromString["RGBA"] = GL.RGBA;
            this._GLEnumFromString["LUMINANCE"] = GL.LUMINANCE;
            this._GLEnumFromString["LUMINANCE_ALPHA"] = GL.LUMINANCE_ALPHA;

            /* PixelType */
            /*      UNSIGNED_BYTE */
            this._GLEnumFromString["UNSIGNED_SHORT_4_4_4_4"] = GL.UNSIGNED_SHORT_4_4_4_4;
            this._GLEnumFromString["UNSIGNED_SHORT_5_5_5_1"] = GL.UNSIGNED_SHORT_5_5_5_1;
            this._GLEnumFromString["UNSIGNED_SHORT_5_6_5"] = GL.UNSIGNED_SHORT_5_6_5;

            /* StencilFunction */
            this._GLEnumFromString["NEVER"] = GL.NEVER;
            this._GLEnumFromString["LESS"] = GL.LESS;
            this._GLEnumFromString["EQUAL"] = GL.EQUAL;
            this._GLEnumFromString["LEQUAL"] = GL.LEQUAL;
            this._GLEnumFromString["GREATER"] = GL.GREATER;
            this._GLEnumFromString["NOTEQUAL"] = GL.NOTEQUAL;
            this._GLEnumFromString["GEQUAL"] = GL.GEQUAL;
            this._GLEnumFromString["ALWAYS"] = GL.ALWAYS;

            /* StencilOp */
            this._GLEnumFromString["KEEP"] = GL.KEEP;
            this._GLEnumFromString["REPLACE"] = GL.REPLACE;
            this._GLEnumFromString["INCR"] = GL.INCR;
            this._GLEnumFromString["DECR"] = GL.DECR;
            this._GLEnumFromString["INVERT"] = GL.INVERT;
            this._GLEnumFromString["INCR_WRAP"] = GL.INCR_WRAP;
            this._GLEnumFromString["DECR_WRAP"] = GL.DECR_WRAP;

            /* TextureMagFilter */
            this._GLEnumFromString["NEAREST"] = GL.NEAREST;
            this._GLEnumFromString["LINEAR"] = GL.LINEAR;

            /* TextureMinFilter */
            this._GLEnumFromString["NEAREST_MIPMAP_NEAREST"] = GL.NEAREST_MIPMAP_NEAREST;
            this._GLEnumFromString["LINEAR_MIPMAP_NEAREST"] = GL.LINEAR_MIPMAP_NEAREST;
            this._GLEnumFromString["NEAREST_MIPMAP_LINEAR"] = GL.NEAREST_MIPMAP_LINEAR;
            this._GLEnumFromString["LINEAR_MIPMAP_LINEAR"] = GL.LINEAR_MIPMAP_LINEAR;

            /* TextureParameterName */
            this._GLEnumFromString["TEXTURE_MAG_FILTER"] = GL.TEXTURE_MAG_FILTER;
            this._GLEnumFromString["TEXTURE_MIN_FILTER"] = GL.TEXTURE_MIN_FILTER;
            this._GLEnumFromString["TEXTURE_WRAP_S"] = GL.TEXTURE_WRAP_S;
            this._GLEnumFromString["TEXTURE_WRAP_T"] = GL.TEXTURE_WRAP_T;

            /* TextureTarget */
            this._GLEnumFromString["TEXTURE_CUBE_MAP"] = GL.TEXTURE_CUBE_MAP;
            this._GLEnumFromString["TEXTURE_CUBE_MAP_POSITIVE_X"] = GL.TEXTURE_CUBE_MAP_POSITIVE_X;
            this._GLEnumFromString["TEXTURE_CUBE_MAP_NEGATIVE_X"] = GL.TEXTURE_CUBE_MAP_NEGATIVE_X;
            this._GLEnumFromString["TEXTURE_CUBE_MAP_POSITIVE_Y"] = GL.TEXTURE_CUBE_MAP_POSITIVE_Y;
            this._GLEnumFromString["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = GL.TEXTURE_CUBE_MAP_NEGATIVE_Y;
            this._GLEnumFromString["TEXTURE_CUBE_MAP_POSITIVE_Z"] = GL.TEXTURE_CUBE_MAP_POSITIVE_Z;
            this._GLEnumFromString["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = GL.TEXTURE_CUBE_MAP_NEGATIVE_Z;
            this._GLEnumFromString["MAX_CUBE_MAP_TEXTURE_SIZE"] = GL.MAX_CUBE_MAP_TEXTURE_SIZE;

            /* TextureWrapMode */
            this._GLEnumFromString["REPEAT"] = GL.REPEAT;
            this._GLEnumFromString["CLAMP_TO_EDGE"] = GL.CLAMP_TO_EDGE;
            this._GLEnumFromString["MIRRORED_REPEAT"] = GL.MIRRORED_REPEAT;

            /* Uniform Types */
            this._GLEnumFromString["FLOAT_VEC2"] = GL.FLOAT_VEC2;
            this._GLEnumFromString["FLOAT_VEC3"] = GL.FLOAT_VEC3;
            this._GLEnumFromString["FLOAT_VEC4"] = GL.FLOAT_VEC4;
            this._GLEnumFromString["INT_VEC2"] = GL.INT_VEC2;
            this._GLEnumFromString["INT_VEC3"] = GL.INT_VEC3;
            this._GLEnumFromString["INT_VEC4"] = GL.INT_VEC4;
            this._GLEnumFromString["BOOL"] = GL.BOOL;
            this._GLEnumFromString["BOOL_VEC2"] = GL.BOOL_VEC2;
            this._GLEnumFromString["BOOL_VEC3"] = GL.BOOL_VEC3;
            this._GLEnumFromString["BOOL_VEC3"] = GL.BOOL_VEC3;
            this._GLEnumFromString["BOOL_VEC4"] = GL.BOOL_VEC4;
            this._GLEnumFromString["FLOAT_VEC2"] = GL.FLOAT_VEC2;
            this._GLEnumFromString["FLOAT_VEC3"] = GL.FLOAT_VEC3;
            this._GLEnumFromString["FLOAT_VEC4"] = GL.FLOAT_VEC4;
            this._GLEnumFromString["INT_VEC2"] = GL.INT_VEC2;
            this._GLEnumFromString["INT_VEC3"] = GL.INT_VEC3;
            this._GLEnumFromString["INT_VEC4"] = GL.INT_VEC4;
            this._GLEnumFromString["FLOAT_MAT2"] = GL.FLOAT_MAT2;
            this._GLEnumFromString["FLOAT_MAT3"] = GL.FLOAT_MAT3;
            this._GLEnumFromString["FLOAT_MAT4"] = GL.FLOAT_MAT4;

            /* Framebuffer Object. */
            this._GLEnumFromString["RGBA4"] = GL.RGBA4;
            this._GLEnumFromString["RGB5_A1"] = GL.RGB5_A1;
            this._GLEnumFromString["RGB565"] = GL.RGB565;
            this._GLEnumFromString["DEPTH_COMPONENT16"] = GL.DEPTH_COMPONENT16;
            this._GLEnumFromString["STENCIL_INDEX"] = GL.STENCIL_INDEX;
            this._GLEnumFromString["STENCIL_INDEX8"] = GL.STENCIL_INDEX8;
            this._GLEnumFromString["DEPTH_STENCIL"] = GL.DEPTH_STENCIL;
        }
    },

    initWithWebGLContext: {
        value: function(value) {
            this.webGLContext = value;
            return this;
        }
    },

    init: {
        value: function() {
            return this;
        }
    },

    bindedProgram: {
        get: function() {
            return this._bindedProgram;
        },
        set: function(value) {
            if ((this._bindedProgram !== value) && this._webGLContext) {
                this._bindedProgram = value;
                if (this._bindedProgram) {
                    this._bindedProgram.use(this._webGLContext, false);
                }
            }
        }
    },

    projectionMatrix: {
        get: function() {
            return this._projectionMatrix;
        },
        set: function(value) {
            this._projectionMatrix = value;
        }
    },

    //FIXME:needs to be updated to reflect latest changes
    debugProgram: {
        get: function() {
            if (!this._debugProgram) {
                this._debugProgram = Object.create(GLSLProgram);
                var debugVS =   "precision highp float;" +
                    "attribute vec3 vert;"  +
                    "uniform mat4 u_mvMatrix; " +
                    "uniform mat4 u_projMatrix; " +
                    "void main(void) { " +
                    "gl_Position = u_projMatrix * u_mvMatrix * vec4(vert,1.0); }"

                var debugFS =   "precision highp float;" +
                    "void main(void) { " +
                    "gl_FragColor = vec4(1.,0.,0.,1.); }";

                this._debugProgram.initWithShaders( { "x-shader/x-vertex" : debugVS , "x-shader/x-fragment" : debugFS } );
                if (!this._debugProgram.build(this.webGLContext)) {
                    console.log(this._debugProgram.errorLogs);
                }

            }

            return this._debugProgram;
        }
    },

    //FIXME:needs to be updated to reflect latest changes
    lambertProgram: {
        get: function() {
            if (!this._lambertProgram) {
                this._lambertProgram = Object.create(GLSLProgram);

                var lambertVS = "precision highp float;" +
                    "attribute vec3 vert;"  +
                    "attribute vec3 normal; " +
                    "varying vec3 v_normal; " +
                    "uniform mat4 u_mvMatrix; " +
                    "uniform mat3 u_normalMatrix; " +
                    "uniform mat4 u_projMatrix; " +
                    "void main(void) { " +
                    "v_normal = normalize(u_normalMatrix * normal); " +
                    "gl_Position = u_projMatrix * u_mvMatrix * vec4(vert,1.0); }"

                var lambertFS = "precision highp float;" +
                    " uniform vec3 color;" +
                    " varying vec3 v_normal;" +
                    " void main(void) { " +
                    " vec3 normal = normalize(v_normal); " +
                    " float lambert = max(dot(normal,vec3(0.,0.,1.)), 0.);" +
                    " gl_FragColor = vec4(color.xyz *lambert, 1.); }";

                this._lambertProgram.initWithShaders( { "x-shader/x-vertex" : lambertVS , "x-shader/x-fragment" : lambertFS } );
                if (!this._lambertProgram.build(this.webGLContext)) {
                    console.log(this._lambertProgram.errorLogs);
                }
            }
            return this._lambertProgram;
        }
    },

    webGLContext: {
        get: function() {
            return this._webGLContext;
        },
        set: function(value) {
            this._webGLContext = value;
            this.GLContextDidChange();
        }
    },

    resourceManager: {
        get: function() {
            if (!this._resourceManager) {
                //FIXME: this should be in init
                this._resourceManager = Object.create(ResourceManager);
                this._resourceManager.init();
            }

            return this._resourceManager;
        }
    },

    indicesDelegate: {
        value: {
            webGLContext:  {
                value: null, writable: true
            },

            handleError: function(errorCode, info) {
                // FIXME: report error
                console.log("ERROR:vertexAttributeBufferDelegate:"+errorCode+" :"+info);
            },

            //should be called only once
            convert: function (resource, ctx) {
                var gl = this.webGLContext;
                var previousBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);

                var glResource =  gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glResource);

                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, resource, gl.STATIC_DRAW);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, previousBuffer);

                return glResource;
            },

            resourceAvailable: function (glResource, ctx) {
            }
        }
    },

    setupCompressedMesh: {
        value: function(mesh, attribs, indices) {
            var primitive = mesh.primitives[0];

            var gl = this.webGLContext;
            //create indices
            var previousBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
            var glResource =  gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glResource);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, previousBuffer);

            glResource.count = indices.length;
            this.resourceManager.setResource(primitive.indices, glResource);
            primitive.indices = { "id" : primitive.indices, "count" : glResource.count }; //HACK

            //deinterleave for now, I now it is a bad and this will not be needed anymore soon
            var count = attribs.length / 8;     //8 = (3pos + 2uv + 3normals)

            var positions = new Float32Array(count * 3);
            var normals = new Float32Array(count * 3);
            var texcoords = new Float32Array(count * 2);

            var i;
            for (i = 0 ; i < count ; i++) {
                var idx = i * 8;
                positions[(i*3) + 0] = attribs[idx + 0];
                positions[(i*3) + 1] = attribs[idx + 1];
                positions[(i*3) + 2] = attribs[idx + 2];
                normals[(i*3) + 0] = attribs[idx + 5];
                normals[(i*3) + 1] = attribs[idx + 6];
                normals[(i*3) + 2] = attribs[idx + 7];
                texcoords[(i*2) + 0] = attribs[idx + 3];
                texcoords[(i*2) + 1] = attribs[idx + 4];
            }

            previousBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);

            glResource =  gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, glResource);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            glResource.componentType = gl.FLOAT;
            glResource.componentsPerAttribute = 3;

            this.resourceManager.setResource(primitive.semantics["POSITION"], glResource);
            primitive.semantics["POSITION"] = { "id" : primitive.semantics["POSITION"] , "count" : count, "byteStride" : 12}; //HACK


            glResource =  gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, glResource);
            gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
            glResource.componentType = gl.FLOAT;
            glResource.componentsPerAttribute = 3;

            this.resourceManager.setResource(primitive.semantics["NORMAL"], glResource);
            primitive.semantics["NORMAL"] = { "id" : primitive.semantics["NORMAL"], "count" : count, "byteStride" : 12}; //HACK

            glResource =  gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, glResource);
            gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
            glResource.componentType = gl.FLOAT;
            glResource.componentsPerAttribute = 2;
            this.resourceManager.setResource(primitive.semantics["TEXCOORD_0"], glResource);
            primitive.semantics["TEXCOORD_0"] = { "id" : primitive.semantics["TEXCOORD_0"], "count" : count, "byteStride" : 8}; //HACK

            gl.bindBuffer(gl.ARRAY_BUFFER, previousBuffer);


        }
    },

    setupCompressedMesh2: {
        value: function(mesh, vertexCount, positions, normals, texcoords, indices) {
            var primitive = mesh.primitives[0];
            var gl = this.webGLContext;
            //create indices
            var previousBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
            var glResource =  gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glResource);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, previousBuffer);

            glResource.count = indices.length;
            this.resourceManager.setResource(primitive.indices.id, glResource);
            primitive.indices = { "id" : primitive.indices.id, "count" : glResource.count }; //HACK

            //deinterleave for now, I now it is a bad and this will not be needed anymore soon
            var count = vertexCount;

            positions = new Float32Array(positions, 0, count * 3);
            normals = new Float32Array(normals, 0, count * 3);
            texcoords = new Float32Array(texcoords, 0, count * 2);

            previousBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);

            glResource =  gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, glResource);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            glResource.componentType = gl.FLOAT;
            glResource.componentsPerAttribute = 3;

            this.resourceManager.setResource(primitive.semantics["POSITION"].id, glResource);
            primitive.semantics["POSITION"] = { "id" : primitive.semantics["POSITION"].id , "count" : count, "byteStride" : 12}; //HACK


            glResource =  gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, glResource);
            gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
            glResource.componentType = gl.FLOAT;
            glResource.componentsPerAttribute = 3;

            this.resourceManager.setResource(primitive.semantics["NORMAL"].id, glResource);
            primitive.semantics["NORMAL"] = { "id" : primitive.semantics["NORMAL"].id, "count" : count, "byteStride" : 12}; //HACK

            glResource =  gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, glResource);
            gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
            glResource.componentType = gl.FLOAT;
            glResource.componentsPerAttribute = 2;
            this.resourceManager.setResource(primitive.semantics["TEXCOORD_0"].id, glResource);
            primitive.semantics["TEXCOORD_0"] = { "id" : primitive.semantics["TEXCOORD_0"].id, "count" : count, "byteStride" : 8}; //HACK

            gl.bindBuffer(gl.ARRAY_BUFFER, previousBuffer);


        }
    },


    vertexAttributeBufferDelegate: {
        value: {

            _componentTypeForGLType: function(gl, glType) {
                switch (glType) {
                    case "FLOAT" :
                    case "FLOAT_VEC2" :
                    case "FLOAT_VEC3" :
                    case "FLOAT_VEC4" :
                        return gl.FLOAT;
                    case "UNSIGNED_BYTE":
                        return gl.UNSIGNED_BYTE;
                    case "UNSIGNED_SHORT" :
                        return gl.UNSIGNED_SHORT;
                    default:
                        return null;
                }
            },

            _componentsPerElementForGLType: function(glType) {
                switch (glType) {
                    case "FLOAT" :
                    case "UNSIGNED_BYTE" :
                    case "UNSIGNED_SHORT" :
                        return 1;
                    case "FLOAT_VEC2" :
                        return 2;
                    case "FLOAT_VEC3" :
                        return 3;
                    case "FLOAT_VEC4" :
                        return 4;
                    default:
                        return null;
                }
            },

            webGLContext:  {
                value: null, writable: true
            },

            handleError: function(errorCode, info) {
                console.log("ERROR:vertexAttributeBufferDelegate:"+errorCode+" :"+info);
            },

            convert: function (resource, ctx) {
                var attribute = ctx;
                var gl = this.webGLContext;
                var previousBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);

                var glResource =  gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, glResource);
                //FIXME: use bufferSubData to prevent alloc
                gl.bufferData(gl.ARRAY_BUFFER, resource, gl.STATIC_DRAW);
                glResource.componentType = this._componentTypeForGLType(gl, attribute.type);
                glResource.componentsPerAttribute = this._componentsPerElementForGLType(attribute.type);
                gl.bindBuffer(gl.ARRAY_BUFFER, previousBuffer);
                return glResource;
            },

            resourceAvailable: function (glResource, ctx) {
            }
        }
    },

    textureDelegate: {
        value: {
            webGLContext:  {
                value: null, writable: true
            },

            getGLFilter: function(filter) {
                var gl = this.webGLContext;
                var glFilter = gl.LINEAR;
                if (filter === "LINEAR") {
                    glFilter = gl.LINEAR;
                } else if (filter === "NEAREST") {
                    glFilter = gl.NEAREST;
                } else if (filter === "NEAREST_MIPMAP_NEAREST") {
                    glFilter = gl.NEAREST_MIPMAP_NEAREST;
                } else if (filter === "LINEAR_MIPMAP_NEAREST") {
                    glFilter = gl.LINEAR_MIPMAP_NEAREST;
                } else if (filter === "NEAREST_MIPMAP_LINEAR") {
                    glFilter = gl.NEAREST_MIPMAP_LINEAR;
                } else if (filter === "LINEAR_MIPMAP_LINEAR") {
                    glFilter = gl.LINEAR_MIPMAP_LINEAR;
                }

                return glFilter;
            },

            getGLWrapMode: function(wrapMode) {
                var gl = this.webGLContext;
                var glWrapMode = gl.REPEAT;
                if (wrapMode === "REPEAT") {
                    glWrapMode = gl.REPEAT;
                } else if (wrapMode === "CLAMP_TO_EDGE") {
                    glWrapMode = gl.CLAMP_TO_EDGE;
                } else if (wrapMode === "MIRROR_REPEAT") {
                    glWrapMode = gl.MIRROR_REPEAT;
                }
                return glWrapMode;
            },

            handleError: function(errorCode, info) {
                // FIXME: report error
                console.log("ERROR:textureDelegate:"+errorCode+" :"+info);
            },

            //nextHighestPowerOfTwo && isPowerOfTwo borrowed from http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences
            nextHighestPowerOfTwo: function (x) {
                --x;
                for (var i = 1; i < 32; i <<= 1) {
                    x = x | x >> i;
                }
                return x + 1;
            },

            isPowerOfTwo: function(x) {
                return (x & (x - 1)) == 0;
            },

            //should be called only once
            convert: function (resource, ctx) {
                var image = ctx;
                var gl = this.webGLContext;
                var canvas = document.createElement("canvas");

                //TODO: add compressed textures
                var sampler = resource.sampler;
                var minFilter = this.getGLFilter(sampler.minFilter);
                var magFilter = this.getGLFilter(sampler.magFilter);
                var wrapS = this.getGLWrapMode(sampler.wrapS);
                var wrapT = this.getGLWrapMode(sampler.wrapT);
                if ((wrapS === gl.REPEAT) || (wrapT === gl.REPEAT)) {
                    var width = parseInt(image.width);
                    var height = parseInt(image.height);

                    if (!this.isPowerOfTwo(width)) {
                        width = this.nextHighestPowerOfTwo(width);
                    }
                    if (!this.isPowerOfTwo(height)) {
                        height = this.nextHighestPowerOfTwo(height);
                    }
                    canvas.width = width;
                    canvas.height = height;

                } else {
                    canvas.width = image.width;
                    canvas.height = image.height;
                }

                var graphicsContext = canvas.getContext("2d");
                graphicsContext.drawImage(image, 0, 0, parseInt(canvas.width), parseInt(canvas.height));
                canvas.id = image.id;
                image = canvas;

                var texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                if ((minFilter === gl.NEAREST_MIPMAP_NEAREST) ||
                    (minFilter === gl.LINEAR_MIPMAP_NEAREST) ||
                    (minFilter === gl.NEAREST_MIPMAP_LINEAR) ||
                    (minFilter === gl.LINEAR_MIPMAP_LINEAR))
                {
                    gl.generateMipmap(gl.TEXTURE_2D);
                }

                gl.bindTexture(gl.TEXTURE_2D, null);

                return texture;
            },

            resourceAvailable: function (glResource, ctx) {
            }
        }
    },

    _lastMaxEnabledArray: { value: 0, writable: true },

    _blend: { value: false },

    setState: {
        value: function(stateID, flag, force) {
            var gl = this.webGLContext;
            switch (stateID) {
                case gl.BLEND:
                    if ((this._blend !== flag) || force) {
                        if (flag) {
                            gl.enable(gl.BLEND);
                        } else {
                            gl.disable(gl.BLEND);
                        }
                        this._blend = flag;
                    }
                    break;

                default:
                    if (flag) {
                        gl.enable(stateID);
                    } else {
                        gl.disable(stateID);
                    }
                    break;
            }
        }
    },

    resetStates : {
        value: function() {
            var gl = this.webGLContext;
            if (gl && (this._lastMaxEnabledArray !== -1)) {
                for (var i = 0 ; i < this._lastMaxEnabledArray ; i++) {
                    gl.disableVertexAttribArray(i);
                }
            }
            this._lastMaxEnabledArray = -1;
            this.bindedProgram = null;
            this.setState(gl.BLEND, false);
        }
    },

    renderPrimitive: {
        value: function(primitiveDescription, pass, parameters) {
            var renderVertices = false;
            //var worldMatrix = primitiveDescription.worldViewMatrix;
            //var projectionMatrix = this.projectionMatrix;
            var value = null;
            var primitive = primitiveDescription.primitive;
            var newMaxEnabledArray = -1;
            var gl = this.webGLContext;
            var program =  this.bindedProgram;
            var i;
            var currentTexture = 0;
            if (!parameters)
                parameters = primitive.material.parameters;
            var allUniforms = program.uniformSymbols;

            for (i = 0; i < allUniforms.length ; i++) {
                value = null;
                var symbol = allUniforms[i];
                var parameter = pass.instanceProgram.uniforms[symbol];
                parameter = parameters[parameter];

                if (parameter.semantic) {
                    if (parameter.semantic == this.PROJECTION) {
                        value = this.projectionMatrix;
                    } else {
                        value = primitiveDescription[parameter.semantic];
                    }
                }

                if (value == null) {
                    if (parameter.source) {
                        //FIXME: assume WORLDMATRIX at the moment, need to clarify how to use semantic and the whole source syntax
                        if (parameter.worldViewMatrix == null) {
                            parameter.worldViewMatrix = mat4.create();
                        }

                        mat4.multiply(this.viewMatrix, parameter.source.worldTransform, parameter.worldViewMatrix);
                        value = parameter.worldViewMatrix;

                    } else {
                        value = parameter.value;
                    }
                }

                if (value != null) {
                    var uniformIsSampler2D = program.getTypeForSymbol(symbol) === gl.SAMPLER_2D;
                    if (uniformIsSampler2D) {
                        var texture = value;
                        this.textureDelegate.webGLContext = this.webGLContext;
                        var texture = this.resourceManager.getResource(texture, this.textureDelegate, this.webGLContext);
                        if (texture) {
                            gl.activeTexture(gl.TEXTURE0 + currentTexture);
                            gl.bindTexture(gl.TEXTURE_2D, texture);
                            var samplerLocation = program.getLocationForSymbol(symbol);
                            if (typeof samplerLocation !== "undefined") {
                                program.setValueForSymbol(symbol, currentTexture);
                                currentTexture++;
                            }
                        }
                    } else {
                        program.setValueForSymbol(symbol, value);
                    }
                }

            }

            program.commit(gl);

            var availableCount = 0;
            this.vertexAttributeBufferDelegate.webGLContext = this.webGLContext;

            //----- bind attributes -----
            var attributes = pass.instanceProgram.attributes;
            var allAttributes = program.attributeSymbols;
            for (i = 0 ; i < allAttributes.length ; i++) {
                var symbol = allAttributes[i];
                var parameter = attributes[symbol];
                parameter = parameters[parameter];
                var semantic = parameter.semantic;
                var accessor = primitive.semantics[semantic];

                var glResource = this.resourceManager.getResource(  accessor, this.vertexAttributeBufferDelegate, accessor);
                // this call will bind the resource when available
                if (glResource) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, glResource);
                    var attributeLocation = program.getLocationForSymbol(symbol);
                    if (typeof attributeLocation !== "undefined") {
                        if (attributeLocation > newMaxEnabledArray) {
                            newMaxEnabledArray = attributeLocation;
                        }

                        //Just enable what was not enabled before...
                        //FIXME: find root cause why it is needed to disable this optimization as it works well 99% of the time
                        //if (this._lastMaxEnabledArray < attributeLocation) {
                        gl.enableVertexAttribArray(attributeLocation);
                        //}

                        gl.vertexAttribPointer(attributeLocation,
                            glResource.componentsPerAttribute,
                            glResource.componentType, false, accessor.byteStride, 0);

                        if ( renderVertices && (semantic == "POSITION")) {
                            gl.drawArrays(gl.POINTS, 0, accessor.count);
                        }
                    }
                    availableCount++;
                } else {
                    this._lastMaxEnabledArray = -1;
                }
            }

            //-----
            var available = availableCount === allAttributes.length;
            if (!renderVertices)  {
                //Just disable what is not required here…
                if (available) {
                    for (var i = (newMaxEnabledArray + 1); i < this._lastMaxEnabledArray ; i++) {
                        gl.disableVertexAttribArray(i);
                    }
                }
                var glIndices = null;
                //FIXME should not assume 2 bytes per indices (WebGL supports one byte too…)
                this.indicesDelegate.webGLContext = this.webGLContext;
                glIndices = this.resourceManager.getResource(primitive.indices, this.indicesDelegate, primitive);
                if (glIndices && available) {
                    //if (!primitiveDescription.mesh.loaded) {
                    //    primitiveDescription.mesh.loadedPrimitivesCount++;
                    //}
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glIndices);
                    gl.drawElements(gl.TRIANGLES, primitive.indices.count, gl.UNSIGNED_SHORT, 0);
                }
            }
            this._lastMaxEnabledArray = newMaxEnabledArray;
            return available;
        }
    },

    programDelegate: {
        value: {
            handleError: function(errorCode, info) {
                // FIXME: report
                console.log("ERROR:programDelegate:"+errorCode+" :"+info);
            },

            //should be called only once
            convert: function (resource, ctx) {
                var gl = ctx.gl;
                var instanceProgram = ctx.instanceProgram;
                var glslProgram = Object.create(GLSLProgram);
                glslProgram.initWithShaders( resource );
                if (!glslProgram.build(gl, Object.keys(instanceProgram.attributes),
                                            Object.keys(instanceProgram.uniforms))) {
                    console.log(resource);
                    console.log(glslProgram.errorLogs);
                }

                return glslProgram;
            },

            resourceAvailable: function (glResource, ctx) {
            }
        }
    },

    //Create a Picking technique, to get rid of the special cases, but implemention of new design parameters
    bindRenderTarget: {
        value: function(renderTarget) {
            var gl = this.webGLContext;
            var initializing = renderTarget.FBO ? false : true;
            renderTarget.previousFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            if (!renderTarget.FBO) {
                renderTarget.FBO = gl.createFramebuffer();
                initializing = true;
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.FBO);

            var extras = renderTarget.extras;

            var shouldResize =  (gl.drawingBufferWidth != renderTarget.width) ||
                (gl.drawingBufferHeight != renderTarget.height);
            var width = gl.drawingBufferWidth;
            var height = gl.drawingBufferHeight;

            if (initializing || shouldResize) {
                renderTarget.attachments.forEach (function (attachment) {
                    if (attachment.semantic == "COLOR_ATTACHMENT0") {
                        if (extras.picking) {
                            var textureBinding = gl.getParameter(gl.TEXTURE_BINDING_2D);
                            if (initializing)
                                extras.pickingTexture = gl.createTexture();
                            if (shouldResize) {
                                gl.bindTexture(gl.TEXTURE_2D, extras.pickingTexture);
                                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                            }
                            if (initializing)
                                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, extras.pickingTexture, 0);
                            gl.bindTexture(gl.TEXTURE_2D, textureBinding);
                        } else {
                        }
                    }

                    if (attachment.semantic == "DEPTH_ATTACHMENT") {
                        if (extras.picking) {
                            var renderBufferBinding = gl.getParameter(gl.RENDERBUFFER_BINDING);
                            if (initializing) {
                                extras.pickingRenderBuffer = gl.createRenderbuffer();
                            }
                            if (shouldResize) {
                                gl.bindRenderbuffer(gl.RENDERBUFFER, extras.pickingRenderBuffer);
                                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
                            }
                            if (initializing)
                                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, extras.pickingRenderBuffer);

                            gl.bindRenderbuffer(gl.RENDERBUFFER, renderBufferBinding);
                        } else {
                        }
                    }

                }, this);
            }
            gl.clearColor(0,0,0,1.);
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        }
    },

    unbindRenderTarget: {
        value: function(renderTarget) {
            var gl = this.webGLContext;

            if (renderTarget.extras.picking) {
                if (!renderTarget.extras.pickedPixel) {
                    renderTarget.extras.pickedPixel = new Uint8Array(4); //RGBA
                }
                gl.finish();

                gl.readPixels(  renderTarget.extras.coords[0],
                    renderTarget.extras.coords[1],
                    1,1,
                    gl.RGBA,gl.UNSIGNED_BYTE, renderTarget.extras.pickedPixel);
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.previousFBO);

            var showPickingImage = false;
            if (showPickingImage) {
                renderTarget.attachments.forEach (function (attachment) {
                    if (attachment.semantic === "COLOR_ATTACHMENT0") {
                        if (renderTarget.extras.picking) {
                            this.drawTexture(renderTarget.extras.pickingTexture);
                        }
                    }
                }, this);
            }
        }
    },

    renderPrimitivesWithPass: {
        value: function(primitives, pass, parameters) {
            var count = primitives.length;
            var gl = this.webGLContext;
            if (pass.instanceProgram) {
                var ctx = { "gl" : gl, "instanceProgram" : pass.instanceProgram };
                var glProgram = this.resourceManager.getResource(pass.instanceProgram.program, this.programDelegate, ctx);
                if (glProgram) {
                    var blending = false;
                    var depthTest = true;
                    var depthMask = true;
                    var cullFaceEnable = true;
                    var states = pass.states;
                    var blendEquation = gl.FUNC_ADD;
                    var sfactor = gl.SRC_ALPHA;
                    var dfactor = gl.ONE_MINUS_SRC_ALPHA;
                    var isPickingPass = (pass.id === "__PickingPass");

                    //FIXME: make a clever handling of states, For now this is incomplete and inefficient.(but robust)
                    if (states) {
                        if (states.blendEnable)
                            blending = true;
                        if (!states.depthTestEnable)
                            depthTest = false;
                        if (!states.depthMask)
                            depthMask = false;
                        if (typeof states["cullFaceEnable"] != "undefined")
                            cullFaceEnable = states["cullFaceEnable"];
                        if(states.blendEquation) {
                            var blendFunc = states.blendFunc;
                            if (blendFunc) {
                                if (blendFunc.sfactor)
                                    sfactor = this._GLEnumFromString[blendFunc.sfactor];
                                if (blendFunc.dfactor)
                                    dfactor = this._GLEnumFromString[blendFunc.dfactor];
                            }
                        }
                    }

                    //this.setState(gl.DEPTH_TEST, depthTest);
                    this.setState(gl.CULL_FACE, cullFaceEnable);
                    //gl.depthMask(depthMask);
                    this.setState(gl.BLEND, blending);
                    if (blending) {
                        gl.blendEquation(blendEquation);
                        gl.blendFunc(sfactor, dfactor);
                    }
                    this.bindedProgram = glProgram;

                    if (isPickingPass) {
                        for (var i = 0 ; i < count ; i++) {
                            var primitive = primitives[i];
                            if (!primitive.pickingColor) {
                                if (primitive.nodeID) {
                                    //FIXME move this into the picking technique when we have it..
                                    //for picking, we need to associate a color to each node.
                                    var nodePickingColor = pass.extras.nodeIDToColor[primitive.nodeID];
                                    if (!nodePickingColor) {
                                        nodePickingColor = vec4.createFrom(Math.random(),Math.random(),Math.random(), 1.);
                                        pass.extras.nodeIDToColor[primitive.nodeID] = nodePickingColor;
                                    }
                                    primitive.pickingColor = nodePickingColor;

                                }
                            }
                            this.bindedProgram.setValueForSymbol("u_pickingColor", primitive.pickingColor);
                            this.renderPrimitive(primitive, pass, parameters);
                        }
                    } else {
                        for (var i = 0 ; i < count ; i++) {
                            this.renderPrimitive(primitives[i], pass);
                        }
                    }
                }
            }
        }
    },

    drawTexture: {
        value: function(textureName) {
            var gl = this.webGLContext;
            //save values
            var restoreDepthState = gl.isEnabled(gl.DEPTH_TEST);
            var restoreCullFace = gl.isEnabled(gl.CULL_FACE);
            var restoreBlend = gl.isEnabled(gl.BLEND);

            this.setState(gl.DEPTH_TEST, false);
            this.setState(gl.CULL_FACE, false);
            this.setState(gl.BLEND, false);

            if (!this.displayTexture) {
                this.displayTexture = {};
                this.displayTexture.program = Object.create(GLSLProgram);

                var vertexShader =  "precision highp float;" +
                    "attribute vec3 vert;"  +
                    "attribute vec2 uv;"  +
                    "uniform mat4 u_projMatrix; " +
                    "varying vec2 v_uv;"  +
                    "void main(void) { " +
                    "v_uv = uv;" +
                    "gl_Position = u_projMatrix * vec4(vert,1.0); }";

                var fragmentShader =    "precision highp float;" +
                    "uniform sampler2D u_texture;" +
                    "varying vec2 v_uv;"  +
                    " void main(void) { " +
                    " vec4 color = texture2D(u_texture, v_uv); " +
                    " gl_FragColor = color; }";

                this.displayTexture.program.initWithShaders({
                    "x-shader/x-vertex" : vertexShader ,
                    "x-shader/x-fragment" : fragmentShader
                });

                if (!this.displayTexture.program.build(gl)) {
                    console.log(this.displayTexture.program.errorLogs);
                }

                var vertices = [
                    - 1.0,-1, 0.0,      0,0,
                    1.0,-1, 0.0,        1,0,
                    -1.0, 1.0, 0.0,     0,1,
                    -1.0, 1.0, 0.0,     0,1,
                    1.0,-1, 0.0,        1,0,
                    1.0, 1.0, 0.0,      1,1];

                // Init the buffer
                this.displayTexture.vertexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, this.displayTexture.vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            }
            var program = this.displayTexture.program;
            var vertexBuffer = this.displayTexture.vertexBuffer;

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

            var orthoMatrix = mat4.ortho(-1, 1, -1.0, 1, 0, 1000);

            var vertLocation = program.getLocationForSymbol("vert");
            var hasVertex = (typeof vertLocation !== "undefined");
            if (hasVertex) {
                gl.enableVertexAttribArray(vertLocation);
                gl.vertexAttribPointer(vertLocation, 3, gl.FLOAT, false, 20, 0);
            }
            var uvLocation = program.getLocationForSymbol("uv");
            var hasUV = (typeof uvLocation !== "undefined");
            if (hasUV) {
                gl.enableVertexAttribArray(uvLocation);
                gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 20, 12);
            }

            var textureBinding = gl.getParameter(gl.TEXTURE_BINDING_2D);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureName);

            this.bindedProgram = program;

            var projectionMatrixLocation = program.getLocationForSymbol("u_projMatrix");
            if (projectionMatrixLocation) {
                program.setValueForSymbol("u_projMatrix",orthoMatrix);
            }

            var samplerLocation = program.getLocationForSymbol("u_texture");
            if (samplerLocation) {
                program.setValueForSymbol("u_texture", 0);
            }

            program.commit(gl);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            //restore values
            gl.bindTexture(gl.TEXTURE_2D, textureBinding);

            if (hasVertex)
                gl.disableVertexAttribArray(vertLocation);
            if (hasUV)
                gl.disableVertexAttribArray(uvLocation);

            this.setState(gl.DEPTH_TEST, restoreDepthState);
            this.setState(gl.CULL_FACE, restoreCullFace);
            this.setState(gl.BLEND, restoreBlend);
        }
    }
});
