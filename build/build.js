class Robot {
    constructor(blockSize) {
        this.robotSize = 12;
        this.initPos = createVector(72, 72);
        this.position = createVector(72, 72);
        this.blockSize = blockSize;
        this.path = [];
        this.playingTrajectory = false;
        this.trajectoryStep = 0;
        this.oldPos = createVector(0, 0);
        this.positionOffset = undefined;
    }
    show() {
        strokeWeight(1);
        rectMode(CENTER);
        fill(120, 120, 255);
        rect(this.posToScreen(this.position.x), this.posToScreen(this.position.y), this.posToScreen(this.robotSize), this.posToScreen(this.robotSize));
        fill(0, 0, 0);
        if (this.playingTrajectory) {
            this.renderTrajectory(this.path.slice(0, this.trajectoryStep + 1));
        }
        else {
            this.renderTrajectory(this.path);
            if (this.path.length > 0) {
                strokeWeight(2.5);
                line(this.posToScreen(this.position.x), this.posToScreen(this.position.y), this.posToScreen(this.path.slice(-1)[0].x), this.posToScreen(this.path.slice(-1)[0].y));
            }
        }
    }
    posToScreen(i) {
        return i * (this.blockSize / 144);
    }
    screenToPos(i) {
        return i * (144 / this.blockSize);
    }
    clipPos() {
        if (this.position.x > 144 - this.robotSize / 2)
            this.position.x = 144 - this.robotSize / 2;
        if (this.position.x < this.robotSize / 2)
            this.position.x = this.robotSize / 2;
        if (this.position.y > 144 - this.robotSize / 2)
            this.position.y = 144 - this.robotSize / 2;
        if (this.position.y < this.robotSize / 2)
            this.position.y = this.robotSize / 2;
    }
    move(x, y) {
        this.moveTo(this.position.x + x, this.position.y + y);
    }
    moveTo(x, y) {
        if (!this.playingTrajectory) {
            this.position.x = int(x);
            this.position.y = int(y);
            this.clipPos();
        }
    }
    setPoint() {
        if (this.positionOffset == undefined) {
            this.positionOffset = createVector(this.position.x, this.position.y);
        }
        let lastPoint = undefined;
        if (this.path.length > 0) {
            lastPoint = this.path.slice(-1)[0];
        }
        else {
            lastPoint = createVector(-1, -1);
        }
        if (!(lastPoint.x == this.position.x && lastPoint.y == this.position.y)) {
            this.path.push(createVector(this.position.x, this.position.y));
        }
    }
    renderTrajectory(trajectory) {
        for (let i = 0; i < trajectory.length - 1; i++) {
            const p1 = trajectory[i];
            const p2 = trajectory[i + 1];
            line(this.posToScreen(p1.x), this.posToScreen(p1.y), this.posToScreen(p2.x), this.posToScreen(p2.y));
        }
    }
    startTrajectory() {
        if (this.path.length > 0) {
            this.playingTrajectory = true;
            this.oldPos = this.position;
            this.position = this.path[this.trajectoryStep] || this.position;
            return true;
        }
        else {
            console.log("No path to playback. Try creating some points first");
            return false;
        }
    }
    stopTrajectory() {
        this.playingTrajectory = false;
        this.trajectoryStep = 0;
        this.position = this.oldPos;
    }
    stepTrajectoryForward() {
        if (this.trajectoryStep >= this.path.length - 1 || !this.playingTrajectory) {
            return;
        }
        this.trajectoryStep++;
        this.position = this.path[this.trajectoryStep];
    }
    stepTrajectoryBackward() {
        if (this.trajectoryStep <= 0 || !this.playingTrajectory) {
            return;
        }
        this.trajectoryStep--;
        this.position = this.path[this.trajectoryStep];
    }
}
const blockSize = 600;
let robot;
let loadFile;
function setup() {
    document.addEventListener("keydown", keypressed);
    createCanvas(blockSize, blockSize);
    document.body.appendChild(document.createElement("br"));
    robot = new Robot(blockSize);
    const setConfig = button("Set Config File", () => {
        loadFile = document.createElement("input");
        loadFile.type = "file";
        loadFile.click();
    });
    const playbackButton = button("Playback Trajectory", () => {
        if (robot.startTrajectory()) {
            stepForwardPlayback.style.display = "";
            stepBackwardPlayback.style.display = "";
            endPlayback.style.display = "";
        }
    });
    const stepForwardPlayback = button("Step Forward", () => { robot.stepTrajectoryForward(); });
    const stepBackwardPlayback = button("Step Backward", () => { robot.stepTrajectoryBackward(); });
    const endPlayback = button("Stop Playback", () => {
        robot.stopTrajectory();
        stepForwardPlayback.style.display = "none";
        stepBackwardPlayback.style.display = "none";
        endPlayback.style.display = "none";
    });
    loadFile = document.createElement("input");
    loadFile.display = "none";
    loadFile.type = "file";
    const exportButton = button("Export Trajectory", () => {
        if (loadFile.files.length > 0) {
            const fileReader = new FileReader();
            fileReader.onload = function (e) {
                exportToCode(JSON.parse(e.target.result.toString()), robot.path);
            };
            fileReader.readAsText(loadFile.files[0]);
        }
        else {
            console.log("You haven't selected a config file. Press the \"Set Config File\" Button First.");
        }
    });
    stepForwardPlayback.style.display = "none";
    stepBackwardPlayback.style.display = "none";
    endPlayback.style.display = "none";
    loadFile = document.createElement("input");
    loadFile.style.display = "none";
    loadFile.type = "file";
}
function draw() {
    background(200);
    fill(0, 0, 0);
    robot.show();
}
function keypressed(e) {
    if (e.key == "w") {
        robot.move(0, -1);
    }
    if (e.key == "s") {
        robot.move(0, 1);
    }
    if (e.key == "a") {
        robot.move(-1, 0);
    }
    if (e.key == "d") {
        robot.move(1, 0);
    }
    if (e.key == " ") {
        robot.setPoint();
    }
    if (e.shiftKey) {
        robot.moveTo(robot.screenToPos(mouseX), robot.screenToPos(mouseY));
    }
}
function downloadObjectAsJson(exportObj, exportName) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
function button(html, onpress) {
    const button = document.createElement("button");
    button.innerHTML = html;
    button.addEventListener("click", onpress);
    document.body.appendChild(button);
    return button;
}
function exportToCode(config, points) {
    console.log(config);
    let valid = true;
    const imports = config["imports"];
    const declarations = config["declarations"];
    const initializations = config["inits"];
    const blockingMovement = config["blockingMovement"];
    const movementFunction = config["movementfunction"];
    if (imports == undefined || typeof imports != "string") {
        console.log("imports is missing or invalid");
        valid = false;
    }
    if (declarations == undefined || typeof declarations != "string") {
        console.log("declarations is missing or invalid");
        valid = false;
    }
    if (initializations == undefined || typeof initializations != "string") {
        console.log("initializations is missing or invalid");
        valid = false;
    }
    if (blockingMovement == undefined || typeof blockingMovement != typeof true) {
        console.log("blockingMovement is missing or invalid");
        valid = false;
    }
    if (movementFunction == undefined || typeof movementFunction != "string" || !movementFunction.includes("$x") || !movementFunction.includes("$y")) {
        console.log("movementFunction is missing or invalid");
        valid = false;
    }
    if (!valid) {
        console.log("invalid");
        return;
    }
    let code = [];
    code.push("package YOUR_PACKAGE;");
    code = code.concat(imports.split("\n"));
    code.push("@Autonomous");
    code.push("public class CLASSNAME extends LinearOpMode");
    code = code.concat(declarations.split("\n"));
    code.push("@Override");
    code.push("public void runOpMode(){");
    code = code.concat(initializations.split("\n"));
    code.push("waitForStart();");
    if (blockingMovement) {
        for (const rawPoint of points.slice(1)) {
            const point = createVector(rawPoint.x - robot.positionOffset.x, rawPoint.y - robot.positionOffset.y);
            let output = movementFunction + "";
            output = output.split("$x").join(point.x.toString());
            output = output.split("$y").join(point.y.toString());
            code.push(output);
        }
    }
    else {
        console.log("Sorry, nonblocking movement is not currently supported");
    }
    code.push("}");
    code.push("}");
    console.log(code);
    return code;
}
//# sourceMappingURL=../src/src/build.js.map