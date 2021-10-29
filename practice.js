let canvas = document.getElementById("webgl-canvas");

let gl = canvas.getContext("webgl2");
let program;

// Init WebGL
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.75, 0.85, 0.8, 1.0);

gl.enable(gl.DEPTH_TEST);
// gl.enable(gl.CULL_FACE);
// gl.frontFace(gl.CCW);
// gl.cullFace(gl.BACK);

program = initShaders(gl, "vertex-shader", "fragment-shader");
gl.useProgram(program);

gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// vertices
var A = vec3(-1.0, 0, -1.0);
var B = vec3(1.0, 0, -1.0);
var C = vec3(1.0, 0.0, 1.0);
var D = vec3(-1.0, 0.0, 1.0);

// vertix colors
var a = vec3(1.0, 0.0, 0.0);
var b = vec3(0.0, 1.0, 0.0);
var c = vec3(1.0, 0.0, 0.0);
var d = vec3(0.0, 0.0, 1.0);


var colors = [a, b, c, a, c, d];

var points = [A, B, C, A, C, D];

// var i = 0;

sendDataToGPU();

var matWorldUniformLocation = gl.getUniformLocation(program, "mWorld"); // deals with rotation
var matViewUniformLocation = gl.getUniformLocation(program, "mView"); // deals with camera
var matProjUniformLocation = gl.getUniformLocation(program, "mProj"); // deals with 3D to 2D projection

var worldMatrix = mat4();
var viewMatrix = lookAt(vec3(0, 1, -1.5), vec3(0, 0, 0), vec3(0, 1, 0));
var projMatrix = perspective(45, canvas.width / canvas.height, 0.1, 1000.0);

// Send matrix data to GPU
gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, flatten(worldMatrix));
gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, flatten(viewMatrix));
gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, flatten(projMatrix));

var angle = 0;
var identityMatrix = mat4();

var loop = function() {
    // angle = i / 5 * 2 * Math.PI;

    // worldMatrix = rotate(angle, axis_of_rotation); // Rotate by angle
    // gl.uniformMatrix4fv(matWorldUniformLocation, false, flatten(worldMatrix)); // Send new data to GPU
    // i++;

    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, points.length);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
gl.drawArrays(gl.TRIANGLE, 0, points.length);


function sendDataToGPU() {
    // Send vertex data to GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    // Send color data to GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
}