let canvas = document.getElementById("webgl-canvas");

let gl = canvas.getContext("webgl2");
let program;

let id = null;
let ENABLE_PERLIN = true;
let ENABLE_ROUNDING = false;
let TERRAIN_DETAIL_LEVEL = 200;
let MESH_ELEVATION = 0;
let TERRAIN_BOUNDS = 25;

let RIGHT = 10;
let LEFT = -10;
let BOTTOM = 0.0;
let TOP = 10;
let NEAR = 0.1;
let FAR = 1000.0;

let SHIFT_SENSITIVITY = 1;

let PERLIN_SCALING_FACTOR = 1.0;

let YAW_SENSITIVITY = 1;
let YAW_CONTROL = true;
let YAW_ANGLE = 0;

let PITCH_SENSITIVITY = 1;
let PITCH_CONTROL = true;
let PITCH_ANGLE = 0;

let ROLL_SENSITIVITY = 1;
let ROLL_CONTROL = true;
let ROLL_ANGLE = 90 * Math.PI/180;

let FLYING_SPEED = 2.0;
let MAX_SPEED = 5;
let SPEED_SENSITIVITY = 1;

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
        console.log(e.key)

        if (YAW_ANGLE - radians(YAW_SENSITIVITY)> -Math.PI/2  &&  (e.key === "a" || e.key === "A")) {
            YAW_ANGLE = YAW_ANGLE - (YAW_CONTROL ? radians(YAW_SENSITIVITY) : 0);
            console.log(YAW_ANGLE*180/Math.PI);
        }
        else if (YAW_ANGLE + radians(YAW_SENSITIVITY) < Math.PI/2  && (e.key === "d" || e.key === "D")) {
            YAW_ANGLE = YAW_ANGLE + (YAW_CONTROL ? radians(YAW_SENSITIVITY) : 0);
            console.log(YAW_ANGLE*180/Math.PI);
        }
        else if (PITCH_ANGLE + radians(PITCH_SENSITIVITY) < Math.PI/2 && (e.key === "w" || e.key === "W")) {
            PITCH_ANGLE = PITCH_ANGLE + (PITCH_CONTROL ? radians(PITCH_SENSITIVITY) : 0);
            console.log(PITCH_ANGLE*180/Math.PI)
        }
        else if (PITCH_ANGLE - radians(PITCH_SENSITIVITY) > -Math.PI/2 && (e.key === "s" || e.key === "S")) {
            
            PITCH_ANGLE = PITCH_ANGLE - (PITCH_CONTROL ? radians(PITCH_SENSITIVITY) : 0);
            console.log(PITCH_ANGLE*180/Math.PI)
        }
        else if (ROLL_ANGLE + radians(ROLL_SENSITIVITY) <= Math.PI && (e.key === "q" || e.key === "Q")) {
            ROLL_ANGLE = ROLL_ANGLE + (ROLL_CONTROL ? radians(ROLL_SENSITIVITY) : 0);
            console.log(ROLL_ANGLE*180/Math.PI)
        }
        else if (ROLL_ANGLE- radians(ROLL_SENSITIVITY) >=0 && (e.key === "e" || e.key === "E")) {
            ROLL_ANGLE = ROLL_ANGLE - (ROLL_CONTROL ?radians(ROLL_SENSITIVITY) : 0);
            console.log(ROLL_ANGLE*180/Math.PI)
        }
    
        else if (e.key === "1" && LEFT + SHIFT_SENSITIVITY<= 0){ 
            LEFT += SHIFT_SENSITIVITY;
        }
        else if(e.key === "!" && LEFT - SHIFT_SENSITIVITY>= -30){
            LEFT -= SHIFT_SENSITIVITY;
        }
        else if (e.key === "2" && RIGHT + SHIFT_SENSITIVITY<=30 ){ 
            RIGHT += SHIFT_SENSITIVITY;
        }
        else if(e.key === "@" && RIGHT - SHIFT_SENSITIVITY>= 0){
            RIGHT -= SHIFT_SENSITIVITY;
        }
        else if (e.key === "3" && TOP + SHIFT_SENSITIVITY<= 15){ 
            TOP += SHIFT_SENSITIVITY;
        }
        else if(e.key === "#" && TOP - SHIFT_SENSITIVITY>= 2){
            TOP -= SHIFT_SENSITIVITY;
        }
        else if (e.key === "4" && BOTTOM + SHIFT_SENSITIVITY<= 4){ 
            BOTTOM += SHIFT_SENSITIVITY;
        }
        else if(e.key === "$" && BOTTOM - SHIFT_SENSITIVITY>= 0){
            BOTTOM -= SHIFT_SENSITIVITY;
        }
        else if (e.key === "5" && NEAR + SHIFT_SENSITIVITY<= 100){ 
            NEAR += SHIFT_SENSITIVITY;
        }
        else if(e.key === "%" && NEAR - SHIFT_SENSITIVITY>= 0){
            NEAR -= SHIFT_SENSITIVITY;
        }
        else if (e.key === "6" && FAR + SHIFT_SENSITIVITY<= 1000){ 
            FAR += SHIFT_SENSITIVITY;
        }
        else if(e.key==="^" && FAR - SHIFT_SENSITIVITY>=10 ){
            FAR -= SHIFT_SENSITIVITY;
        }
        
        else if (e.key === "ArrowDown" && FLYING_SPEED- SPEED_SENSITIVITY >= 0){
            FLYING_SPEED -= SPEED_SENSITIVITY;
            console.log(FLYING_SPEED)
        }
        else if (e.key === "ArrowUp" && FLYING_SPEED + SPEED_SENSITIVITY <= MAX_SPEED){
            FLYING_SPEED += SPEED_SENSITIVITY;
        }
        else if (e.key === "Escape"){
            cancelAnimationFrame(id);
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
        // console.log(temp_points);
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
var viewMatrix = lookAt(vec3(0, 3,15 ), vec3(0, 0, 0), vec3(0, 1, 0));
var projMatrix = ortho(-10.0, 10.0, 0.0, 10.0, NEAR, FAR);
var colorValue = vec4(1.0, 1.0, 1.0, 1.0);

// Send matrix data to GPU
gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, flatten(worldMatrix));
gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, flatten(viewMatrix));
gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, flatten(projMatrix));
gl.uniform4f(colorValueUniformLocation, colorValue[0], colorValue[1], colorValue[2], colorValue[3]);

var identityMatrix = mat4();

var loop = function() {
    distance = FLYING_SPEED * i / 60;

    worldMatrix = rotate(YAW_ANGLE*180/Math.PI, vec3(0, 1, 0));

    viewMatrix = 
    lookAt(
        add(vec3(0, 3, 15), mult(
            -distance,vec3(
                0,
                Math.sin(PITCH_ANGLE), 
                Math.cos(PITCH_ANGLE)
            ))), 
        add(vec3(0, 0, 0), mult(
                -distance,vec3(
                    0,
                    Math.sin(PITCH_ANGLE), 
                    Math.cos(PITCH_ANGLE)
                ))),
                vec3(
                    Math.cos(ROLL_ANGLE),
                    Math.cos(PITCH_ANGLE)*Math.sin(ROLL_ANGLE),
                    Math.sin(PITCH_ANGLE)*Math.sin(ROLL_ANGLE)));
    
    projMatrix = ortho(LEFT, RIGHT, BOTTOM , TOP , NEAR , FAR);

    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, flatten(projMatrix));              
    gl.uniformMatrix4fv(matViewUniformLocation, false, flatten(viewMatrix)); // Send new data to GPU
    gl.uniformMatrix4fv(matWorldUniformLocation, false, flatten(worldMatrix));

    i++;

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
    
    id = requestAnimationFrame(loop);
}


id = requestAnimationFrame(loop);

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