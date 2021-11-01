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
var A = vec3(-1.0, 0.0, 1.0);
var B = vec3(1.0, 0.0, 1.0);
var C = vec3(1.0, 0.0, -1.0);
var D = vec3(-1.0, 0.0, -1.0);
var E = vec3(0.0, 1.0, 0.0);

// vertix colors
var a = vec3(1.0, 0.0, 0.0);  // R
var b = vec3(1.0, 0.0, 0.0);  // G 
var c = vec3(1.0, 0.0, 0.0);  // R
var d = vec3(1.0, 0.0, 0.0);  // B
var e = vec3(1.0, 1.0, 0.0);  // Y




// var colors = [a, b, e, b, c, e, c, d, e, d, a, e];

// var points = [A, B, E, B, C, E, C, D, E, D, A, E];

var points = []; var colors = [];

function get_height(){
    return 3*Math.random();         // will return values in the range [3, 0)
}



function get_patch(x_min, x_max, z_min, z_max){
    var x = x_min; var z = z_min;
    var x_interval = (x_max - x_min)/100; var z_interval = (z_max - z_min)/100;
    
    var z_off = 0;
    for (let j= 0; j < 100; j ++){
        var x_off = 0;
        for (let i = 0; i < 100; i++){
            a_y = perlin.get(x, z); 
            A = vec3(x, a_y, z); a = vec3(0,0,0);
            // if (a_y <= 0.5){ 
            //     a = vec3(0, 0, 1);
            // }
            // else{
            //     a = vec3(1,0,0);
            // }
            
            b_y = perlin.get(x, z + z_interval); 
            B = vec3(x, b_y, z + z_interval); b = vec3(0,0,0);
            // if (b_y <= 0.5){ 
            //     b = vec3(0, 0, 1);
            // }
            // else{
            //     b = vec3(1,0,0);
            // }

            c_y = perlin.get(x + x_interval, z + z_interval);
            C = vec3(x + x_interval, c_y, z + z_interval); c = vec3(0,0,0);
            // if (c_y <= 0.5){ 
            //     c = vec3(0, 0, 1);
            // }
            // else{
            //     c = vec3(1,0,0);
            // }

            d_y = perlin.get(x + x_interval, z);  
            D = vec3(x + x_interval, d_y  , z); d = vec3(0,0,0);
            // if (d_y <= 0.5){ 
            //     d = vec3(0, 0, 1);
            // }
            // else{
            //     d = vec3(1,0,0);
            // }

            points.push(A,B,D,B,C,D);
            colors.push(a,b,d,b,c,d);
            x = x + x_interval;
            x_off = x_off + 0.1;
        }
        x = x_min;
        z = z + z_interval;
        z_off = z_off + 1;
    }  
    console.log(points);
}

get_patch(-2, 2, -4, 4);




// var i = 0;

sendDataToGPU();

var matWorldUniformLocation = gl.getUniformLocation(program, "mWorld"); // deals with rotation
var matViewUniformLocation = gl.getUniformLocation(program, "mView"); // deals with camera
var matProjUniformLocation = gl.getUniformLocation(program, "mProj"); // deals with 3D to 2D projection
var colorValueUniformLocation = gl.getUniformLocation(program, "colorValue");

var worldMatrix = mat4();
var viewMatrix = lookAt(vec3(0, 3, 3), vec3(0, 0, 0), vec3(0, 1, 0));
var projMatrix = perspective(45, canvas.width / canvas.height, 0.1, 1000.0);
var colorValue = 1.0;

// Send matrix data to GPU
gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, flatten(worldMatrix));
gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, flatten(viewMatrix));
gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, flatten(projMatrix));
gl.uniform1f(colorValueUniformLocation, gl.FALSE, colorValue);

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

colorValue = 1.0;
gl.uniform1f(colorValueUniformLocation, gl.FALSE, colorValue);
gl.drawArrays(gl.LINE_LOOP, 0, points.length);


function sendDataToGPU() {
    // Send vertex data to GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    // Send color data to GPU
    // gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    // var vColor = gl.getAttribLocation(program, "vColor");
    // gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vColor);
}