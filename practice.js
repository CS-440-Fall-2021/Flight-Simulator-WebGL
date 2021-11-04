let canvas = document.getElementById("webgl-canvas");

let gl = canvas.getContext("webgl2");
let program;

let ENABLE_PERLIN = true;
let ENABLE_ROUNDING = false;
let TERRAIN_DETAIL_LEVEL = 200;
let MESH_ELEVATION = 0;
let TERRAIN_BOUNDS = 20;
let NEAR = 0.1;
let FAR = 1000.0;
let PERLIN_SCALING_FACTOR = 2.0;
let FLYING_SPEED = 1.0;
let YAW_SENSITIVITY = 1;
let YAW_CONTROL = false;

// Init WebGL
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.75, 0.85, 0.8, 1.0);

gl.enable(gl.DEPTH_TEST);
// gl.enable(gl.CULL_FACE);
// gl.frontFace(gl.CCW);
// gl.cullFace(gl.BACK);

//Place this clear color settings
gl.polygonOffset(1,1);

//enable or disable this setting as needed
gl.enable(gl.POLYGON_OFFSET_FILL);

program = initShaders(gl, "vertex-shader", "fragment-shader");
gl.useProgram(program);

gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


window.onload = () => {
    document.onkeydown = (e) => {
        if (e.key === "a" || e.key === "A") {
            angle = angle + (YAW_CONTROL ? YAW_SENSITIVITY : 0);
        }
        else if (e.key === "d" || e.key === "D") {
            angle = angle - (YAW_CONTROL ? YAW_SENSITIVITY : 0);
        }
    }
}

var points = [];
var colors = [];
var matrix = [];
var temp = [];

let i = 0;


function get_patch(x_min, x_max, z_min, z_max){
    
    var x_interval = (x_max - x_min)/TERRAIN_DETAIL_LEVEL;
    var z_interval = (z_max - z_min)/TERRAIN_DETAIL_LEVEL;
    
    var temp_points = [];

    for (let j= z_min; j < z_max; j = j + z_interval){
        for (let i = x_min; i < x_max; i = i + x_interval){
            
            a_y = ENABLE_PERLIN ? (PERLIN_SCALING_FACTOR * perlin.get(i, j)) : 0; 
            A = vec3(i, a_y, j);
            A_m = vec3(i, a_y + MESH_ELEVATION, j);
            
            b_y = ENABLE_PERLIN ? (PERLIN_SCALING_FACTOR * perlin.get(i,j + z_interval)) : 0; 
            B = vec3(i, b_y, j + z_interval);
            B_m = vec3(i, b_y + MESH_ELEVATION, j + z_interval);
            
            c_y = ENABLE_PERLIN ? (PERLIN_SCALING_FACTOR * perlin.get(i + x_interval, j + z_interval)) : 0;
            C = vec3(i + x_interval, c_y, j + z_interval);
            C_m = vec3(i + x_interval, c_y + MESH_ELEVATION, j + z_interval);
            
            d_y = ENABLE_PERLIN ? (PERLIN_SCALING_FACTOR * perlin.get(i + x_interval, j)) : 0;  
            D = vec3(i + x_interval, d_y, j);
            D_m = vec3(i + x_interval, d_y + MESH_ELEVATION, j);
            
            temp_points.push(B_m,A_m,D_m,C_m,B_m,D_m);
            points.push(A,B,D,B,C,D);
            
        }
        matrix.push(temp_points);
        console.log(temp_points);
        temp_points = [];
    }  
}

get_patch(-TERRAIN_BOUNDS, TERRAIN_BOUNDS, -TERRAIN_BOUNDS, TERRAIN_BOUNDS);
temp = points;



var matWorldUniformLocation = gl.getUniformLocation(program, "mWorld"); // deals with rotation
var matViewUniformLocation = gl.getUniformLocation(program, "mView"); // deals with camera
var matProjUniformLocation = gl.getUniformLocation(program, "mProj"); // deals with 3D to 2D projection
var colorValueUniformLocation = gl.getUniformLocation(program, "colorValue");

var worldMatrix = mat4();
var viewMatrix = lookAt(vec3(0, 3, 10), vec3(0, 0, 0), vec3(0, 1, 0));
var projMatrix = ortho(-10.0, 10.0, 0.0, 10.0, NEAR, FAR);
var colorValue = vec4(1.0, 1.0, 1.0, 1.0);

// Send matrix data to GPU
gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, flatten(worldMatrix));
gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, flatten(viewMatrix));
gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, flatten(projMatrix));
gl.uniform4f(colorValueUniformLocation, colorValue[0], colorValue[1], colorValue[2], colorValue[3]);

var motion_x = 0;
var motion_y = 0;
var motion_z = 0;
var identityMatrix = mat4();

// +ve angle means clockwise rotation
var angle = 0;

var loop = function() {
    // motion_x = i / 60;
    // motion_y = i / 60;
    motion_z = i / 60;

    worldMatrix = rotate(angle, vec3(0, 1, 0));
    viewMatrix = lookAt(vec3(0 - motion_x, 3 - motion_y, 10 - motion_z), vec3(0 - motion_x, 0 - motion_y, 0 - motion_z), vec3(0, 1, 0));
    
    gl.uniformMatrix4fv(matViewUniformLocation, false, flatten(viewMatrix)); // Send new data to GPU
    gl.uniformMatrix4fv(matWorldUniformLocation, false, flatten(worldMatrix));

    i = i + FLYING_SPEED;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Drawing Triangles
    colorValue = vec4(0.0, 0.0, 0.0, 1.0);
    gl.uniform4f(colorValueUniformLocation, colorValue[0], colorValue[1], colorValue[2], colorValue[3]);

    points = temp;
    sendDataToGPU();
    gl.drawArrays(gl.TRIANGLES, 0, points.length);


    // Drawing Mesh
    colorValue = vec4(0.75, 0.75, 0.75, 1.0);
    gl.uniform4f(colorValueUniformLocation, colorValue[0], colorValue[1], colorValue[2], colorValue[3]);

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