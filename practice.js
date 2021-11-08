let canvas = document.getElementById("webgl-canvas");

let gl = canvas.getContext("webgl2");
let program;

let id = null;

let ENABLE_PERLIN = true;
let ENABLE_ROUNDING = false;
let TERRAIN_DETAIL_LEVEL = 200;
let MESH_ELEVATION = 0;
let TERRAIN_BOUNDS = 25;
let PERLIN_SCALING_FACTOR = 2.5;
let NOISE_SPACER = 3;

let RIGHT = 8;
let LEFT = -7;
let BOTTOM = -4;
let TOP = 10;
let NEAR = 15;
let FAR = -30.0;

let SHIFT_SENSITIVITY = 1;

let YAW_SENSITIVITY = 0.05
let YAW_CONTROL = true;
let YAW_ANGLE = 0;

let PITCH_SENSITIVITY = 0.1;
let PITCH_CONTROL = true;
let PITCH_ANGLE = 0;

let ROLL_SENSITIVITY = 0.1;
let ROLL_CONTROL = true;
let ROLL_ANGLE = 90;

let FLYING_SPEED = 4.0;
let MAX_SPEED = 10;
let SPEED_SENSITIVITY = 1;

let eye = vec3(0,10,25);
let at = vec3(0,0,-1);
let up = vec3 (0,1,0);


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

function frustum(left, right, bottom, top, near, far) {

    if (left == right) { throw "frustum(): left and right are equal";}
   
    if (bottom == top) { throw "frustum(): bottom and top are equal";}
   
    if (near == far) { throw "frustum(): near and far are equal";}
   
    let w = right - left;
   
    let h = top - bottom;
   
    let d = far - near;
   
    let result = mat4();
   
    result[0][0] = 2.0 * near / w;
   
    result[1][1] = 2.0 * near / h;
   
    result[2][2] = -(far + near) / d;
   
    result[0][2] = (right + left) / w;
   
    result[1][2] = (top + bottom) / h;
   
    result[2][3] = -2 * far * near / d;
   
    result[3][2] = -1;
   
    result[3][3] = 0.0;
   
    return result;
   
   }

window.onload = () => {
    document.onkeydown = (e) => {
        

        if (YAW_ANGLE - (YAW_SENSITIVITY)> -90  &&  (e.key === "a" || e.key === "A")) {
            YAW_ANGLE = YAW_ANGLE - (YAW_CONTROL ? (YAW_SENSITIVITY) : 0);
            
            rotation = rotateY(YAW_SENSITIVITY);
            rotation = mat3(rotation[0][0],rotation[0][1],rotation[0][2],
                rotation[1][0],rotation[1][1],rotation[1][2],
                rotation[2][0],rotation[2][1],rotation[2][2],)
            
            eye = mult(rotation,eye)
            at = mult(rotation,at)
            up = mult(rotation,up)
        }
        else if (YAW_ANGLE + (YAW_SENSITIVITY) < 90 && (e.key === "d" || e.key === "D")) {
            YAW_ANGLE = YAW_ANGLE + (YAW_CONTROL ? (YAW_SENSITIVITY) : 0);
            
            rotation = rotateY(-YAW_SENSITIVITY);
            rotation = mat3(rotation[0][0],rotation[0][1],rotation[0][2],
                rotation[1][0],rotation[1][1],rotation[1][2],
                rotation[2][0],rotation[2][1],rotation[2][2],)
            
            eye = mult(rotation,eye)
            at = mult(rotation,at)
            up = mult(rotation,up)
        }
        else if (PITCH_ANGLE + (PITCH_SENSITIVITY) < 90 &&
            (e.key === "w" || e.key === "W")) 
            {
            PITCH_ANGLE = PITCH_ANGLE + (PITCH_CONTROL ? (PITCH_SENSITIVITY) : 0);

            rotation = rotateX(-PITCH_SENSITIVITY);
            rotation = mat3(rotation[0][0],rotation[0][1],rotation[0][2],
                rotation[1][0],rotation[1][1],rotation[1][2],
                rotation[2][0],rotation[2][1],rotation[2][2],)
            
            eye = mult(rotation,eye)
            at = mult(rotation,at)
            up = mult(rotation,up)  
 
        }
        else if (PITCH_ANGLE - (PITCH_SENSITIVITY) > -90 && (e.key === "s" || e.key === "S")) {
            
            PITCH_ANGLE = PITCH_ANGLE - (PITCH_CONTROL ? (PITCH_SENSITIVITY) : 0);
            
            rotation = rotateX(PITCH_SENSITIVITY);
            rotation = mat3(rotation[0][0],rotation[0][1],rotation[0][2],
                rotation[1][0],rotation[1][1],rotation[1][2],
                rotation[2][0],rotation[2][1],rotation[2][2],)
            
            eye = mult(rotation,eye)
            at = mult(rotation,at) 
            up = mult(rotation,up)  
        }
        else if (ROLL_ANGLE + (ROLL_SENSITIVITY) <= 180 && (e.key === "q" || e.key === "Q")) {
            ROLL_ANGLE = ROLL_ANGLE + (ROLL_CONTROL ? (ROLL_SENSITIVITY) : 0);
            
            rotation = rotateZ(-ROLL_SENSITIVITY);
            rotation = mat3(rotation[0][0],rotation[0][1],rotation[0][2],
                rotation[1][0],rotation[1][1],rotation[1][2],
                rotation[2][0],rotation[2][1],rotation[2][2],)
            
            eye = mult(rotation,eye)
            at = mult(rotation,at)
            up = mult(rotation,up)
        }
        else if (ROLL_ANGLE- (ROLL_SENSITIVITY) >=0 && (e.key === "e" || e.key === "E")) {
            ROLL_ANGLE = ROLL_ANGLE - (ROLL_CONTROL ?(ROLL_SENSITIVITY) : 0);
            
            rotation = rotateZ(ROLL_SENSITIVITY);
            rotation = mat3(rotation[0][0],rotation[0][1],rotation[0][2],
                rotation[1][0],rotation[1][1],rotation[1][2],
                rotation[2][0],rotation[2][1],rotation[2][2],)
            
            eye = mult(rotation,eye)
            at = mult(rotation,at)
            up = mult(rotation,up)
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
        else if(e.key === "$" && BOTTOM - SHIFT_SENSITIVITY>= -100){
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
            // console.log(FLYING_SPEED)
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
    var _points = [];
    var _matrix = [];

    for (let j= z_max; j > z_min; j = j - z_interval){
        for (let i = x_min; i < x_max; i = i + x_interval){
            
            a_y = ENABLE_PERLIN ? (PERLIN_SCALING_FACTOR * perlin.get(i/NOISE_SPACER, j/NOISE_SPACER)) : 0; 
            a_y = a_y < -1.5 ? -1.5 : a_y > 2.2 ? 2.2 : a_y
            A = vec3(i, a_y, j);
            A_m = vec3(i, a_y + MESH_ELEVATION, j);
            
            b_y = ENABLE_PERLIN ? (PERLIN_SCALING_FACTOR * perlin.get(i/NOISE_SPACER,(j + z_interval)/NOISE_SPACER)) : 0; 
            b_y = b_y < -1.5 ? -1.5 : b_y > 2.2 ? 2.2 : b_y

            B = vec3(i, b_y, j + z_interval);
            B_m = vec3(i, b_y + MESH_ELEVATION, j + z_interval);
            
            c_y = ENABLE_PERLIN ? (PERLIN_SCALING_FACTOR * perlin.get((i + x_interval)/NOISE_SPACER, (j + z_interval)/NOISE_SPACER)) : 0;
            c_y = c_y < -1.5 ? -1.5 : c_y  > 2.2 ? 2.2 : c_y
            C = vec3(i + x_interval, c_y, j + z_interval);
            C_m = vec3(i + x_interval, c_y + MESH_ELEVATION, j + z_interval);
            
            d_y = ENABLE_PERLIN ? (PERLIN_SCALING_FACTOR * perlin.get((i + x_interval)/NOISE_SPACER, j/NOISE_SPACER)) : 0;  
            d_y = d_y < -1.5 ? -1.5 : d_y  > 2.2 ? 2.2 : d_y
            D = vec3(i + x_interval, d_y, j);
            D_m = vec3(i + x_interval, d_y + MESH_ELEVATION, j);
            
            temp_points.push(B_m,A_m,D_m,C_m,B_m,D_m);
            _points.push(A,B,D,B,C,D);
            
        }
        _matrix.push(temp_points);
        // console.log(temp_points);
        temp_points = [];
    }
    return [_points, _matrix]
}

var result = get_patch(-TERRAIN_BOUNDS, TERRAIN_BOUNDS, -TERRAIN_BOUNDS, TERRAIN_BOUNDS);
points = [...result[0]];
matrix = [...result[1]];

temp = [...points];



var matWorldUniformLocation = gl.getUniformLocation(program, "mWorld"); // deals with rotation
var matViewUniformLocation = gl.getUniformLocation(program, "mView"); // deals with camera
var matProjUniformLocation = gl.getUniformLocation(program, "mProj"); // deals with 3D to 2D projection
var colorValueUniformLocation = gl.getUniformLocation(program, "colorValue");

var worldMatrix = mat4();
var viewMatrix = lookAt(eye,at,up);
var projMatrix = frustum(LEFT, RIGHT, BOTTOM, TOP, NEAR, FAR);
var colorValue = vec4(1.0, 1.0, 1.0, 1.0);

// Send matrix data to GPU
gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, flatten(worldMatrix));
gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, flatten(viewMatrix));
gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, flatten(projMatrix));
gl.uniform4f(colorValueUniformLocation, colorValue[0], colorValue[1], colorValue[2], colorValue[3]);

var identityMatrix = mat4();


var z_threshold = 0;
var terrain_number = 0;
var z_min = -TERRAIN_BOUNDS;
var z_max = TERRAIN_BOUNDS;


var loop = function() {
    
    distance = i / 60;

    updatedEye = add(eye, mult(distance, normalize(at)));
    updatedAt = add(at, mult(distance, normalize(at)));

    // console.log(updatedEye[2]);

    if (updatedEye[2] < z_threshold) {
        
        terrain_number++;

        z_min = z_min - (2 * TERRAIN_BOUNDS);
        z_max = z_max - (2 * TERRAIN_BOUNDS);

        var results = get_patch(-TERRAIN_BOUNDS, TERRAIN_BOUNDS, z_min, z_max);
        points.concat([...results[0]]);
        temp = [...points];
        matrix.concat([...results[1]]);
        console.log("Pushing new terrain...");

        z_threshold = z_threshold - (2 * TERRAIN_BOUNDS)
    }
    
    viewMatrix = lookAt(updatedEye, updatedAt, up);
    projMatrix = frustum(LEFT, RIGHT, BOTTOM , TOP , NEAR , FAR);

    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, flatten(projMatrix));              
    gl.uniformMatrix4fv(matViewUniformLocation, false, flatten(viewMatrix)); // Send new data to GPU
    gl.uniformMatrix4fv(matWorldUniformLocation, false, flatten(worldMatrix));

    i+= FLYING_SPEED;

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

    // temp = points;
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