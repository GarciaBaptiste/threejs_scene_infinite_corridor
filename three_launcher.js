window.addEventListener('load', setup);
window.addEventListener('resize', onWindowResize, false);
window.addEventListener('mousemove', mouseMoved);
window.addEventListener('keydown', keyDowned);
window.addEventListener('keyup', keyUpped);

var log;
var worldScene = null;
var renderer = null;
var camera = null;
var clock = null;
let forwardSpeed = 0,
  straffeSpeed = 0;

var MODELS = ["test_material2"];

var numLoadedModels = 0;

function setup() {
  log = document.getElementById('log');
  initScene();
  initRenderer();
  loadModels();
}

function loadModels() {
  for (var i = 0; i < MODELS.length; ++i) {
    var m = MODELS[i];
    loadGltfModel(m, function () {
      ++numLoadedModels;
      if (numLoadedModels === MODELS.length) {
        document.getElementById('loader').style.display = "none";
        setupScene();
      }
    });
  }
}

function loadGltfModel(model, onLoaded) {
  var loader = new THREE.GLTFLoader();
  var modelName = "models/" + model + ".gltf";
  loader.load(modelName, function (gltf) {
    var scene = gltf.scene;
    model.scene = scene;

    gltf.scene.traverse(function (object) {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      } else if (object.isLight) {
        object.castShadow = true;
        object.shadow.mapSize.width = 512;
        object.shadow.mapSize.height = 512;
        object.shadow.camera.near = 0.5;
        object.shadow.camera.far = 500;
        object.shadow.bias = -0.005;
      }
    });
    onLoaded();
  },
    function (xhr) {
      document.getElementById('loader').innerText = "Loading model " + Math.round(xhr.loaded / xhr.total * 100) + "%";
    });
}

function animate() {
  log.innerText = camera.position.z;
  requestAnimationFrame(animate);
  moveCamera();
  renderer.render(worldScene, camera);
}

function initRenderer() {
  var container = document.getElementById('context');
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  lockMouse();
  container.addEventListener('click', lockMouse);
}

function initScene() {
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, .1, 5000);
  camera.rotation.order = "YXZ";
  camera.position.x = -1.5;
  camera.position.y = 1.7;
  camera.position.z = 1.5;
  camera.rotation.y = .2;
  camera.rotation.x = .2;

  clock = new THREE.Clock();

  worldScene = new THREE.Scene();
  worldScene.background = new THREE.Color(000000);
  // worldScene.fog = new THREE.Fog(000000, 10, 22);

  var hlight = new THREE.AmbientLight(0xffffff, 0.05);
  worldScene.add(hlight);

  var light = new THREE.PointLight(0xffffff, .25, 0, 2);
  light.position.set(5, 4, 8);
  worldScene.add(light);
  light.castShadow = true;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 1000;
  light.shadow.bias = -0.005;
  light.shadow.radius = 1;
}

function setupScene() {
  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function mouseMoved(evt) {
  camera.rotation.y -= evt.movementX / 1000;
  let nextCameraRotationX = camera.rotation.x - evt.movementY / 1000;
  if (nextCameraRotationX <= 1.7 && nextCameraRotationX >= -1.7) {
    camera.rotation.x = nextCameraRotationX;
  }
}

function keyDowned(evt) {
  if (evt.key === "z") {
    forwardSpeed = .15;
  } else if (evt.key === "s") {
    forwardSpeed = -.15;
  } else if (evt.key === "q") {
    straffeSpeed = -.075;
  } else if (evt.key === "d") {
    straffeSpeed = .075;
  }
}

function keyUpped(evt) {
  if (evt.key === "z" || evt.key === "s") {
    forwardSpeed = 0;
  } else if (evt.key === "q" || evt.key === "d") {
    straffeSpeed = 0;
  }
}

function moveCamera() {
  camera.position.x = (camera.position.x) + (Math.cos(camera.rotation.y) * straffeSpeed) - (Math.sin(camera.rotation.y) * forwardSpeed);
  camera.position.z = (camera.position.z) + (-Math.sin(camera.rotation.y) * straffeSpeed) - (Math.cos(camera.rotation.y) * forwardSpeed);
}

function lockMouse() {
  context.requestPointerLock = context.requestPointerLock ||
    context.mozRequestPointerLock ||
    context.webkitPointerLockElement;
  context.requestPointerLock()
}