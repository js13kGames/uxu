
var width = window.innerWidth, 
height = window.innerHeight, 
gLoop, 
bgCellWidth = 150, 
bgCellHeight = 200, 
gTime = 0, 
c = document.getElementById('gameCanvas'), 
ctx = c.getContext('2d');
width = c.width;
height = c.height;
width = 600;
height = 720;
margin = 1.0;
c.width = width * margin;
c.height = height * margin;
camX = 0;
camY = 0;
mountainImage = new Image();
mountainImage.src = "montagne_1.png";
cloudImage = new Image();
cloudImage.src = "nuage_1.png";
mouseX = 0;
mouseY = 0;
gameStarted = false;

var filterStrength = 20;
var frameTime = 0, lastLoop = new Date, thisLoop;

// Create Linear Gradients
var lingrad = ctx.createLinearGradient(0, 0, 0, height);
lingrad.addColorStop(0, '#C0C2F5');
lingrad.addColorStop(0.5, '#FA90BE');
lingrad.addColorStop(1, '#FEDCD3');

var mouseOut = document.getElementById('mouse');

//////////////////////////////////////////////////////////////////////////////////////////////////
//
// Misc
//
//////////////////////////////////////////////////////////////////////////////////////////////////

function NormVec2D(arg) {
    var vec = {x:arg.x, y:arg.y};
    var l = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    return l;
}

function NormalizeVec2D(arg) {
    var vec = {x:arg.x, y:arg.y};
    var l = NormVec2D(vec);
    if(l>0.0001)
    {
        vec.x = vec.x / l;
        vec.y = vec.y / l;
    }
    else
    {
        vec.x = 1;
        vec.y = 0;
    }
    return vec;
}

function MulVec2D(arg, coef) {
    var vec = {x:arg.x, y:arg.y};
    vec.x *= coef;
    vec.y *= coef;
    return vec;
}

var CustomRandom = function(nseed) {
    
    var high = nseed = (8253729 * nseed + 2396403), 
    low = high ^ 0x49616E42;
    
    return {
        next: function(min, max) {
            
            high = (high << 16) + (high >> 16);
            high += low;
            low += high;
            var res = high;
            res = res % 65535;
            res = res / 65535.1;
            return Math.abs(res);
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////
//
// Background
//
//////////////////////////////////////////////////////////////////////////////////////////////////

var renderDisc = function(x, y, radius) {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
}

var renderBackGround = function(x, y) {
    
    {
        var rx = Math.round(x / bgCellWidth) * bgCellWidth;
        var ry = Math.round(y / bgCellHeight) * bgCellHeight;
        var cw = width / bgCellWidth;
        var ch = height / bgCellHeight;
        var i, j, k;
        for (i = -Math.round(cw / 2); i <= Math.round(cw / 2); i++) 
        {
            for (j = -Math.round(ch / 2); j <= Math.round(ch / 2); j++) 
            {
                var px = rx + i * bgCellWidth;
                var py = ry + j * bgCellHeight;
                var rng = CustomRandom(px + py * width);
                for (k = 0; k < 3; k++) 
                {
                    var radius = 2 * rng.next();
                    var dx = 100 * rng.next();
                    var dy = 100 * rng.next();
                    renderDisc(px + dx - x + width / 2, py + dy - y + height / 2, radius);
                }
                if(rng.next()>0.85)
                {
                    var sx = 52;
                    var sy = 22;
                    var scale = 1 + 1 * rng.next();
                    var sizeX = sx * scale;
                    var sizeY = sy * scale;

                    ctx.drawImage(cloudImage,px + dx - x + width / 2 - sizeX / 2, py + dy - y + height / 2, sizeX, sizeY);
                }
            }
        }
    }
    {
        var mountainCellWidth = 200;
        var rx = Math.round(x / mountainCellWidth) * mountainCellWidth;
        var cw = width / mountainCellWidth;
        var i, j, k;
        var sx = 414;
        var sy = 814;

        for (i = -Math.round(cw / 2); i <= Math.round(cw / 2); i++) 
        {
                var px = rx + i * mountainCellWidth;
                var rng = CustomRandom(px);

            var scale = 0.5 + 1 * rng.next();
            var sizeX = sx * scale;
            var sizeY = sy * scale;
            ctx.drawImage(mountainImage, px - x + width / 2 - sizeX / 2, 400-y + 100 * rng.next(), sizeX , sizeY);
        }


    }

    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.rect(0, height - y, width,  800);
    ctx.closePath();
    ctx.fill();
}


var clear = function(x, y) {
    camX = x - width / 2;
    camY = y - height / 2;


    ctx.fillStyle = "#FFFFFF";
    ctx.clearRect(0, 0, width+400, height+200);
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = lingrad;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.closePath();
    ctx.fill();
    renderBackGround(x, y);
}


//////////////////////////////////////////////////////////////////////////////////////////////////
//
// Player
//
//////////////////////////////////////////////////////////////////////////////////////////////////
/*
var updatePos = function(dt) {
    var p = {x: gTime / 10 + width / 2, y:height / 2};
    return p;
}
*/

function Player() {
    var that = this;
    that.image = new Image();
    that.image.src = "charac.png"
    that.width = 45;
    that.height = 45;
    that.X = 0;
    that.Y = 0;
    that.interval = 0;
    that.time = 0;
    that.speed = {x:0, y:0};
    that.gravity = 7;
    
    that.setPosition = function(x, y) {
        that.X = x;
        that.Y = y;
        that.speed.x = 0;
        that.speed.y = -5;
    }
    
    that.update = function(dt) {
        if(gameStarted==false)
            return;
        that.time += dt;
        var fDt = dt / 1000.0;
        var fTime = that.time / 1000.0;

        that.speed.y += that.gravity * fDt;

       if(that.Y>300)
       {
            that.speed.y = -that.speed.y;
            gameStarted = false;
        }
        
       if(that.Y<-height/2)
       {
           // 
            //that.speed.y = 1;
        }
        
       if(that.X>width/2)
            that.speed.x = -that.speed.x;
       if(that.X<-width/2)
            that.speed.x = -that.speed.x;
/*
        var maxSpeedX = 4.0;
        if(Math.abs(that.speed.x)>maxSpeedX)
            that.speed.x = maxSpeedX * that.speed.x / Math.abs(that.speed.x);
        var maxSpeedY = 5.0;
        if(Math.abs(that.speed.y)>maxSpeedY)
            that.speed.y = maxSpeedY * that.speed.y / Math.abs(that.speed.y);
*/
        that.X += that.speed.x;
        that.Y += that.speed.y;

        mouseOut.innerHTML  = "player (" + that.X + ",  = " + that.Y + ")";

        //that.Y = 100;
    }
    
    that.draw = function() {
        if(gameStarted==false)
            return;
        try {
            var x = Math.round(that.X - camX);
            var y = Math.round(that.Y - camY);
            ctx.drawImage(that.image, x, y, that.width, that.height);
        } 
        catch (e) {
        }
        ;
   
    }
}

var player = new Player();
player.setPosition(0, 100);


//////////////////////////////////////////////////////////////////////////////////////////////////
//
// Rocket
//
//////////////////////////////////////////////////////////////////////////////////////////////////

function Rocket() {
    var that = this;
    that.image = new Image();
    
    that.image.src = "bomb.png"
    that.width = 64;
    that.height = 64;
    that.X = 0;
    that.Y = 0;
    that.interval = 0;
    that.time = 0;
    that.speed = {x:0, y:0};
    that.gravity = 9;
    that.angle = 1;
    that.alive = false;
    
    that.spawn = function(x, y) {
        console.log("rocket:setPosition("+x+","+y+");")
        that.X = x;
        that.Y = y;
        that.alive = true;
    }
    
    that.update = function(dt) {
        if(!that.alive)
            return ;
        if(gameStarted==false)
            return;

        that.time += dt;
        var fDt = dt / 1000.0;
        var fTime = that.time / 1000.0;

        that.angle += fDt;

        //console.log("player position = ("+player.X+","+player.Y+");")
        //console.log("rocket position = ("+that.X+","+that.Y+");")

        var speedCoef = 2.0;
        var dirPlayer = {x:player.X - that.X, y:player.Y - that.Y};
        var dirNormed = NormalizeVec2D(dirPlayer);
        var dir = MulVec2D(dirNormed, speedCoef);

        var controlCoef = 0.3;
        that.speed.x = that.speed.x * (1.0 - controlCoef) + dir.x * controlCoef;
        that.speed.y = that.speed.y * (1.0 - controlCoef) + dir.y * controlCoef;
        that.speed = MulVec2D(NormalizeVec2D(that.speed),speedCoef);

        //mouseOut.innerHTML  = "x=" + that.speed.x + ", y=" + that.speed.y;
        that.X += that.speed.x;
        that.Y += that.speed.y;

        var distPlayer = NormVec2D(dirPlayer);
        if(distPlayer<50)
        {
            var explosionCoef = 10.0;
            /*
            var exploDir = MulVec2D(dirNormed,explosionCoef);
            if(exploDir.y>0)
                exploDir.y=0;
            player.speed.x = exploDir.x;
            player.speed.y = exploDir.y;
            */
            if(dirPlayer.x<0)
                player.speed.x = -2;
            else
                player.speed.x = 2;

            player.speed.y = -3;
            that.alive = false;
        }
    }
    
    that.draw = function() {
        if(!that.alive)
            return;
        try {
            var x = Math.round(that.X - camX);
            var y = Math.round(that.Y - camY);
            /*
            ctx.translate(x, y);
            ctx.rotate(that.angle);
            ctx.drawImage(that.image,  -that.width / 2 , -that.height / 2, that.width, that.height);
            ctx.rotate(-that.angle);
            ctx.translate(-x, -y);
            */
            ctx.drawImage(that.image,  x , y, that.width, that.height);
        } 
        catch (e) {
        }
        ;
   
    }
}


var rocket =  new Rocket();
var rockets =  new Array();
for (var i = 0; i<10; i++) {
    rockets[i] = new Rocket();
}
 


//////////////////////////////////////////////////////////////////////////////////////////////////
//
// Turret
//
//////////////////////////////////////////////////////////////////////////////////////////////////

function Turret(offset) {
    var that = this;
    that.image = new Image();
    
    that.image.src = "tower.png"
    that.width = 64;
    that.height = 64;
    that.X = 0;
    that.Y = 0;
    that.interval = 0;
    that.time = 0;
    that.spawnTimeLeft = 0;
    that.speed = {x:0, y:0};
    that.gravity = 9;
    that.angle = 1;
    that.alive = false;
    that.period = 1000;
    that.offset = offset;

    that.restart = function() {
        that.time = 0;
        that.spawnTimeLeft = offset * 100;
    }
    
    that.spawn = function(x, y) {
        console.log("Turret:setPosition("+x+","+y+");")
        that.X = x;
        that.Y = y;
        that.alive = true;
    }
    that.spawnRocket  = function() {
        if(!that.alive)
            return ;
        gSpawnRocket(that.X, that.Y);
    }
    
    that.update = function(dt) {
        if(!that.alive)
            return ;
        if(gameStarted==false)
            return;

        that.time += dt;
        that.spawnTimeLeft -= dt;
        if(that.spawnTimeLeft<0)
        {
            that.spawnTimeLeft +=  that.period;
            that.spawnRocket();
        }

        var fDt = dt / 1000.0;
        var fTime = that.time / 1000.0;
    }
    
    that.draw = function() {
        if(!that.alive)
            return;
        try {
            var x = Math.round(that.X - camX);
            var y = Math.round(that.Y - camY);
            /*
            ctx.translate(x, y);
            ctx.rotate(that.angle);
            ctx.drawImage(that.image,  -that.width / 2 , -that.height / 2, that.width, that.height);
            ctx.rotate(-that.angle);
            ctx.translate(-x, -y);
            */
            ctx.drawImage(that.image,  x , y, that.width, that.height);
        } 
        catch (e) {
        }
        ;
   
    }

}

var turrets =  new Array();
for (var i = 0; i<10; i++) {
    turrets[i] = new Turret(i);
}
 

//////////////////////////////////////////////////////////////////////////////////////////////////
//
// Event
//
//////////////////////////////////////////////////////////////////////////////////////////////////
addEventListener('keydown', function (e) {
//keysDown[e.keyCode] = true;
    //player.speed.y = -10;
}, false);


function findPos(obj) {
    var curleft = 0, curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
}


function ev_mousemove(e) {
    var pos = findPos(this);
    var x = e.pageX - pos.x;
    var y = e.pageY - pos.y;
    mouseX = x;
    mouseY = y;
    /*
    var coordinateDisplay = "x=" + x + ", y=" + y;
    console.log(coordinateDisplay);
    */
}

c.addEventListener('mousemove', ev_mousemove, false);

function gSpawnRocket(x,y) {
    for (var i = 0; i < rockets.length; i++) {
        if(rockets[i].alive==false)
        {
            rockets[i].spawn(x , y );
            return;
        }
    };
}

function gSpawnTurret(x,y) {
    for (var i = 0; i < turrets.length; i++) {
        if(turrets[i].alive==false)
        {
            turrets[i].spawn(x , y );
            return;
        }
    };
}

function startGame() {
    for (var i = 0; i < rockets.length; i++) {
        rockets[i].alive = false;
    };
    for (var i = 0; i < turrets.length; i++) {
        turrets[i].restart();
    };
    

    player.setPosition(0, 200);
    gameStarted = true;
    //gSpawnTurret(camX , height / 2);
}


function mouseClick(event) {
    mouseOut.innerHTML  = "x=" + mouseX + ", y=" + mouseY;
    //gSpawnRocket(mouseX + camX , height / 2);
    gSpawnTurret(mouseX + camX , height / 2);
}

c.addEventListener("mousedown", mouseClick, false);

//////////////////////////////////////////////////////////////////////////////////////////////////
//
// Loop
//
//////////////////////////////////////////////////////////////////////////////////////////////////

var oldCamX = 0;
var oldCamY = 0;


var GameLoop = function() {
    
    var thisFrameTime = (thisLoop = new Date) - lastLoop;
    frameTime += (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;
    
    var dt = 1000 / 100;
    gTime += dt;

    //player.setPosition(pos.x, pos.y);
    player.update(dt);
    rocket.update(dt);
    for (var i = 0; i < rockets.length; i++) {
        rockets[i].update(dt);
    };
    for (var i = 0; i < turrets.length; i++) {
        turrets[i].update(dt);
    };

    //clear(player.X, player.Y);
    /*
    oldCamX = (oldCamX + player.X) / 2;
    clear( oldCamX, 100);
    */
    //clear(0, 100);
    clear(0, player.Y);


    player.draw();
    rocket.draw();
    for (var i = 0; i < rockets.length; i++) {
        rockets[i].draw();
    };
    for (var i = 0; i < turrets.length; i++) {
        turrets[i].draw();
    };

    gLoop = setTimeout(GameLoop, dt/4);
}

GameLoop();

var fpsOut = document.getElementById('fps');
setInterval(function() {
    fpsOut.innerHTML = (1000 / frameTime).toFixed(1) + " fps";
}, 1000);

