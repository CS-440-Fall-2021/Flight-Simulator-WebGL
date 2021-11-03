let canvas = document.getElementById("webgl-canvas");

let gl = canvas.getContext("webgl2");
let program;

let ENABLE_PERLIN = false;
let ENABLE_ROUNDING = true;
let TERRAIN_DETAIL_LEVEL = 10;

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


var points = []; var colors = []; var matrix = []; var temp = [];


function get_patch(x_min, x_max, z_min, z_max){
    var x = x_min; var z = z_min;
    var x_interval = (x_max - x_min)/TERRAIN_DETAIL_LEVEL; var z_interval = (z_max - z_min)/TERRAIN_DETAIL_LEVEL;

    console.log(x_interval);
    
    var temp_points = [];

    for (let j= 0; j < TERRAIN_DETAIL_LEVEL; j ++){
        for (let i = 0; i < TERRAIN_DETAIL_LEVEL; i++){
            
            a_y = ENABLE_PERLIN ? perlin.get(x, z) : 0; 
            A = vec3(x, a_y, z); a = vec3(0,0,0);
            
            b_y = ENABLE_PERLIN ? perlin.get(x, round(z + z_interval)) : 0; 
            B = vec3(x, b_y, round(z + z_interval)); b = vec3(0,0,0);
            
            c_y = ENABLE_PERLIN ? perlin.get(round(x + x_interval), round(z + z_interval)) : 0;
            C = vec3(round(x + x_interval), c_y, round(z + z_interval)); c = vec3(0,0,0);
            
            d_y = ENABLE_PERLIN ? perlin.get(round(x + x_interval), z) : 0;  
            D = vec3(round(x + x_interval), d_y  , z); d = vec3(0,0,0);
            
            temp_points.push(A,B,D,B,C,D);
            points.push(A,B,D,B,C,D);
            matrix.push(temp_points);
            console.log(temp_points);
            temp_points = [];

            colors.push(a,b,d,b,c,d);
            x = round(x + x_interval);
        }
        x = x_min;
        z = round(z + z_interval);
        // console.log(points);
    }  
}

get_patch(-2, 2, -4, 4);
temp = points;


sendDataToGPU();

var matWorldUniformLocation = gl.getUniformLocation(program, "mWorld"); // deals with rotation
var matViewUniformLocation = gl.getUniformLocation(program, "mView"); // deals with camera
var matProjUniformLocation = gl.getUniformLocation(program, "mProj"); // deals with 3D to 2D projection
var colorValueUniformLocation = gl.getUniformLocation(program, "colorValue");

var worldMatrix = mat4();
var viewMatrix = lookAt(vec3(0, 5, 3), vec3(0, 0, 0), vec3(0, 1, 0));
var projMatrix = perspective(45, canvas.width / canvas.height, 0.1, 1000.0);
var colorValue = vec3(1.0, 1.0, 1.0);

// Send matrix data to GPU
gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, flatten(worldMatrix));
gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, flatten(viewMatrix));
gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, flatten(projMatrix));
gl.uniform3f(colorValueUniformLocation, colorValue[0], colorValue[1], colorValue[2]);

var angle = 0;
var identityMatrix = mat4();

var loop = function() {
    // angle = i / 5 * 2 * Math.PI;

    // worldMatrix = rotate(angle, axis_of_rotation); // Rotate by angle
    // gl.uniformMatrix4fv(matWorldUniformLocation, false, flatten(worldMatrix)); // Send new data to GPU
    // i++;

    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    colorValue = vec3(0.0, 0.0, 0.0);
    gl.uniform3f(colorValueUniformLocation, colorValue[0], colorValue[1], colorValue[2]);

    points = temp;
    sendDataToGPU();
    gl.drawArrays(gl.TRIANGLES, 0, points.length);

    colorValue = vec3(1.0, 1.0, 1.0);
    gl.uniform3f(colorValueUniformLocation, colorValue[0], colorValue[1], colorValue[2]);

    temp = points;
    for (let i = 0; i < matrix.length; i++) {
        points = matrix[i];
        sendDataToGPU();
        gl.drawArrays(gl.LINE_STRIP, 0, points.length);
    }
    
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

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

function round(n) {
    if (ENABLE_ROUNDING) {
    var temp = n.toFixed(1);
    if (temp == "0.0") {
        return 0.0;
    } else {
        return parseFloat(temp);
    }
    } else {
        return n;
    }
}