let canvas = document.getElementById("webgl-canvas");

let gl = canvas.getContext("webgl2");
let program;

let id = null;

let ENABLE_PERLIN = true; // Turn on/off mountains
let ENABLE_ROUNDING = false;
let TERRAIN_DETAIL_LEVEL = 150; // Increase to improve terrain quality
let MESH_ELEVATION = 0; // Experimental feature. Better not to try this one out.
let TERRAIN_BOUNDS = 25; // How big should one terrain patch be
let PERLIN_SCALING_FACTOR = 2.5;
let NOISE_SPACER = 3;

// Viewing Volume Bounds
let RIGHT = 8;
let LEFT = -7;
let BOTTOM = -3;
let TOP = 8;
let NEAR = 15;
let FAR = -30.0;

// Flight Control Globals
let SHIFT_SENSITIVITY = 1;
let YAW = 0;
let YAW_SENSITIVITY = 0.1;
let YAW_CONTROL = true;
let YAW_ANGLE = 0;
let rot = false;
let PITCH = 0;
let PITCH_SENSITIVITY = 0.1;
let PITCH_CONTROL = true;
let PITCH_ANGLE = 0;

let ROLL = 0;
let ROLL_SENSITIVITY = 0.1;
let ROLL_CONTROL = true;
let ROLL_ANGLE = 90;

let FLYING_SPEED = 4.0;
let MAX_SPEED = 10;
let SPEED_SENSITIVITY = 1;

// Camera globals
let eye = vec3(0,10,25);
let at = vec3(0,0,-1);
let up = vec3 (0,1,0);

let view = "points";

// Choose shading type between "Phong", "Flat", and "Smooth".
let shade = "Flat";

var points = [];
var colors = [];
var matrix = [];
var temp = [];

let vPosition = null;
let vNormal = null;

// Init WebGL
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.75, 0.85, 0.8, 1.0);

gl.enable(gl.DEPTH_TEST);

//Place this clear color settings
gl.polygonOffset(1,1);

//enable or disable this setting as needed
gl.enable(gl.POLYGON_OFFSET_FILL);

if (shade === "Phong"){
    program = initShaders(gl, "vertex-shader-phong","fragment-shader-phong")
}
else if (shade === "Smooth"){
    program = initShaders(gl, "vertex-shader-smooth","fragment-shader-smooth")
}
else if (shade === "Flat"){
    program = initShaders(gl, "vertex-shader-flat","fragment-shader-flat")
}

else{
    program = initShaders(gl, "vertex-shader", "fragment-shader");
}
gl.useProgram(program);

initGPUPipeline();

gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

window.onload = () => {
    document.onkeydown = (e) => {
        

        if (YAW_ANGLE - (YAW_SENSITIVITY)> -90  &&  (e.key === "a" || e.key === "A")) {
            YAW_ANGLE = YAW_ANGLE - (YAW_CONTROL ? (YAW_SENSITIVITY) : 0);
            YAW += YAW_SENSITIVITY
            rot = true;

        }
        else if (YAW_ANGLE + (YAW_SENSITIVITY) < 90 && (e.key === "d" || e.key === "D")) {
            YAW_ANGLE = YAW_ANGLE + (YAW_CONTROL ? (YAW_SENSITIVITY) : 0);
            YAW -= YAW_SENSITIVITY
            rot = true;

        }
        else if (PITCH_ANGLE + (PITCH_SENSITIVITY) < 90 &&
            (e.key === "s" || e.key === "S")) 
            {
            PITCH_ANGLE = PITCH_ANGLE + (PITCH_CONTROL ? (PITCH_SENSITIVITY) : 0);
            PITCH -= PITCH_SENSITIVITY;
            rot = true;

 
        }
        else if (PITCH_ANGLE - (PITCH_SENSITIVITY) > -90 && (e.key === "w" || e.key === "W")) {
            
            PITCH_ANGLE = PITCH_ANGLE - (PITCH_CONTROL ? (PITCH_SENSITIVITY) : 0);
            PITCH += PITCH_SENSITIVITY;
            rot = true;
  
        }
        else if (ROLL_ANGLE + (ROLL_SENSITIVITY) <= 180 && (e.key === "q" || e.key === "Q")) {
            ROLL_ANGLE = ROLL_ANGLE + (ROLL_CONTROL ? (ROLL_SENSITIVITY) : 0);
            ROLL -= ROLL_SENSITIVITY;
            rot = true;

        }
        else if (ROLL_ANGLE- (ROLL_SENSITIVITY) >=0 && (e.key === "e" || e.key === "E")) {
            ROLL_ANGLE = ROLL_ANGLE - (ROLL_CONTROL ?(ROLL_SENSITIVITY) : 0);
            ROLL += ROLL_SENSITIVITY;    
            rot = true;        

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
        else if (e.key === "V" || e.key === "v" ){
            view = view === "points" ? "wireframe":
                    view === "wireframe" ? "faces" :
                    view === "faces" ? "points": "error"
            
        }
        else if (e.key === "C" || e.key === "c" ){
            view = view === "Phong" ? "Smooth":
                    view === "Smooth" ? "Flat" :
                    view === "Flat" ? "Phong": "error"
            
        }
    }
}

let i = 0;


var result = get_patch(-TERRAIN_BOUNDS, TERRAIN_BOUNDS, -TERRAIN_BOUNDS, TERRAIN_BOUNDS);
points = [...result[0]];
matrix = [...result[1]];
normals = [...result[2]];
matrix_normals = [...result[3]];
temp = [...points];
tempnor = [...normals];


var matWorldUniformLocation = gl.getUniformLocation(program, "mWorld"); // deals with rotation
var matViewUniformLocation = gl.getUniformLocation(program, "mView"); // deals with camera
var matProjUniformLocation = gl.getUniformLocation(program, "mProj"); // deals with 3D to 2D projection
var matNormalUniformLocation = gl.getUniformLocation(program,"mNorm");

var worldMatrix = mat4();
var viewMatrix = lookAt(eye,at,up);
var projMatrix = frustum(LEFT, RIGHT, BOTTOM, TOP, NEAR, FAR);
var normMatrix = normalMatrix(viewMatrix,false);

// Send matrix data to GPU
gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, flatten(worldMatrix));
gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, flatten(viewMatrix));
gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, flatten(projMatrix));
gl.uniformMatrix4fv(matNormalUniformLocation,gl.FALSE, flatten(normMatrix));


var identityMatrix = mat4();


var z_threshold = 0;
var terrain_number = 0;
var z_min = -TERRAIN_BOUNDS;
var z_max = TERRAIN_BOUNDS;


// Animation loop
var loop = function() {
    
    distance = FLYING_SPEED/60;
    
    if (rot == true){
        rotation = mult(rotateZ(ROLL),mult(rotateY(YAW),rotateX(PITCH)));
        
        rotation = mat3(rotation[0][0],rotation[0][1],rotation[0][2],
            rotation[1][0],rotation[1][1],rotation[1][2],
            rotation[2][0],rotation[2][1],rotation[2][2],);
    
        eye = mult(rotation,eye)
        at = mult(rotation,at)
        up = mult(rotation,up)  
        
        ROLL = 0;
        YAW = 0;
        PITCH = 0;
        rotation = identityMatrix;
        rot = false;
        }

    eye = add(eye, mult(distance, normalize(at)));
    eye[1] = (eye[1] < 3) ? 3 : eye[1];
    at = add(at, mult(distance, normalize(at)));

    
    // Checking to see if new terrain should be generated or not
    if (eye[2] < z_threshold) {
        
        terrain_number++;

        z_min = z_min - (2 * TERRAIN_BOUNDS);
        z_max = z_max - (2 * TERRAIN_BOUNDS);

        console.log(`Generating new terrain with (${-TERRAIN_BOUNDS}, ${TERRAIN_BOUNDS}, ${z_min}, ${z_max}).`);
        var results = get_patch(-TERRAIN_BOUNDS, TERRAIN_BOUNDS, z_min, z_max);
        console.log(`Length of new points: ${results[0].length}.`);
        console.log(`Length of new matrix: ${results[1].length}.`);
        
        points = [...points, ...results[0]];
        temp = [...points];
        
        matrix = [...matrix, ...results[1]];
        
        normals = [...normals, ...results[2]];
        tempnor = [...normals];

        matrix_normals = [...matrix_normals, ...results[3]];
        console.log("Pushing new terrain...");

        z_threshold = z_threshold - (2 * TERRAIN_BOUNDS)
    }
    
    viewMatrix = lookAt(eye, at, up);
    projMatrix = frustum(LEFT, RIGHT, BOTTOM , TOP , NEAR , FAR);
    normMatrix = normalMatrix(viewMatrix,false);

    // Send new data to GPU
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, flatten(projMatrix));              
    gl.uniformMatrix4fv(matViewUniformLocation, false, flatten(viewMatrix));
    gl.uniformMatrix4fv(matWorldUniformLocation, false, flatten(worldMatrix));
    gl.uniformMatrix4fv(matNormalUniformLocation,false,flatten(normMatrix));
    i+= 1;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   
    points = temp;
    normals = tempnor;
    sendDataToGPU();

    if (view === "faces"){
        gl.drawArrays(gl.TRIANGLES, 0, points.length);
    }
    

    else if (view === "wireframe"){
        for (let i = 0; i < matrix.length; i++) {
            normals = matrix_normals[i];
            points = matrix[i];
            sendDataToGPU();
            gl.drawArrays(gl.LINE_STRIP, 0, points.length);
        }
    }

    else if (view === "points"){
        for (let i = 0; i < matrix.length; i++) {
            normals = matrix_normals[i];
            points = matrix[i];
            sendDataToGPU();
            gl.drawArrays(gl.POINTS, 0, points.length);
        }
    }
    
    id = requestAnimationFrame(loop);
}


id = requestAnimationFrame(loop);


function initGPUPipeline() {
    vPosition = gl.getAttribLocation(program, "vPosition");
    vNormal = gl.getAttribLocation(program, "vNormal");
}
  

function sendDataToGPU() {
    // Send vertex data to GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STREAM_DRAW);

    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
}

function get_patch(x_min, x_max, z_min, z_max){
    
    var x_interval = (x_max - x_min)/TERRAIN_DETAIL_LEVEL;
    var z_interval = (z_max - z_min)/TERRAIN_DETAIL_LEVEL;
    
    var temp_points = [];
    var temp_normals = [];
    var _points = [];
    var _normals = [];
    var _matrix_normals= [];
    var _matrix = [];

    for (let j= z_max; j > z_min; j = j - z_interval){
        for (let i = x_min; i < x_max; i = i + x_interval){
            
            a_y = ENABLE_PERLIN ? (PERLIN_SCALING_FACTOR * perlin.get(i/NOISE_SPACER, j/NOISE_SPACER)) : 0; 
            a_y = a_y < 0.0 ? 0.0 : a_y
            A = vec3(i, a_y, j);
            A_m = vec3(i, a_y + MESH_ELEVATION, j);
            
            b_y = ENABLE_PERLIN ? (PERLIN_SCALING_FACTOR * perlin.get(i/NOISE_SPACER,(j + z_interval)/NOISE_SPACER)) : 0; 
            b_y = b_y < 0.0 ? 0.0 : b_y

            B = vec3(i, b_y, j + z_interval);
            B_m = vec3(i, b_y + MESH_ELEVATION, j + z_interval);
            
            c_y = ENABLE_PERLIN ? (PERLIN_SCALING_FACTOR * perlin.get((i + x_interval)/NOISE_SPACER, (j + z_interval)/NOISE_SPACER)) : 0;
            c_y = c_y < 0.0 ? 0.0 : c_y
            C = vec3(i + x_interval, c_y, j + z_interval);
            C_m = vec3(i + x_interval, c_y + MESH_ELEVATION, j + z_interval);
            
            d_y = ENABLE_PERLIN ? (PERLIN_SCALING_FACTOR * perlin.get((i + x_interval)/NOISE_SPACER, j/NOISE_SPACER)) : 0;  
            d_y = d_y < 0.0 ? 0.0  : d_y
            D = vec3(i + x_interval, d_y, j);
            D_m = vec3(i + x_interval, d_y + MESH_ELEVATION, j);
            
            A_norm = cross(subtract(B, A), subtract(D, A))
            B_norm = cross(subtract(A, B), subtract(C, B))
            C_norm = cross(subtract(B,C), subtract(D,C))
            D_norm = cross(subtract(A,D),subtract(C,D))

            temp_normals.push(B_norm,A_norm,D_norm, C_norm, B_norm, D_norm);
            temp_points.push(B_m,A_m,D_m,C_m,B_m,D_m);
            _points.push(B,A,D,B,C,D);
            _normals.push(B_norm,A_norm,D_norm, C_norm, B_norm, D_norm);
            
        }
        _matrix.push(temp_points);
        _matrix_normals.push(temp_normals);
        // console.log(temp_points);
        temp_points = [];
        temp_normals = [];
    }
    return [_points, _matrix, _normals, _matrix_normals]
}

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