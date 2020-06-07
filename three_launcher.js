window.addEventListener('load', setup);
window.addEventListener('resize', onWindowResize, false);
window.addEventListener('mousemove', mouseMoved);
window.addEventListener('keydown', keyDowned);
window.addEventListener('keyup', keyUpped);

var worldScene = null;
var renderer = null;
var camera = null;
var clock = null;
var mixers = [];
let forwardSpeed = 0,
  straffeSpeed = 0;

var MODELS = [
  { name: "scene_test_repeat" }
];

var UNITS = [{
  modelName: "scene_test_repeat",
  meshName: "Plane",
  position: { x: 0, y: 0, z: 0 },
  scale: 1
}, {
  modelName: "scene_test_repeat",
  meshName: "Plane",
  position: { x: 0, y: 0, z: 20 },
  scale: 1
}];

var numLoadedModels = 0;

function setup() {
  initScene();
  initRenderer();
  loadModels();
  animate();
}

function loadModels() {
  for (var i = 0; i < MODELS.length; ++i) {
    var m = MODELS[i];
    loadGltfModel(m, function() {
      ++numLoadedModels;
      if (numLoadedModels === MODELS.length) {
        document.getElementById('loader').style.display = "none";
        instantiateUnits();
      }
    });
  }
}

function instantiateUnits() {
  var numSuccess = 0;
  for (var i = 0; i < UNITS.length; ++i) {
    var u = UNITS[i];
    var model = getModelByName(u.modelName);
    if (model) {
      var clonedScene = model.scene.clone();
      if (clonedScene) {
        var clonedMesh = clonedScene.getObjectByName(u.meshName);
        if (clonedMesh) {
          var mixer = startAnimation(clonedMesh, model.animations, u.animationName);
          mixers.push(mixer);
          numSuccess++;
        }
        worldScene.add(clonedScene);
        if (u.position) {
          clonedScene.position.set(u.position.x, u.position.y, u.position.z);
        }
        if (u.scale) {
          clonedScene.scale.set(u.scale, u.scale, u.scale);
        }
        if (u.rotation) {
          clonedScene.rotation.x = u.rotation.x;
          clonedScene.rotation.y = u.rotation.y;
          clonedScene.rotation.z = u.rotation.z;
        }
      }
    } else {
      console.error("Can not find model", u.modelName);
    }
  }
}

function startAnimation(skinnedMesh, animations, animationName) {
  var mixer = new THREE.AnimationMixer(skinnedMesh);
  var clip = THREE.AnimationClip.findByName(animations, animationName);
  if (clip) {
    var action = mixer.clipAction(clip);
    action.play();
  }
  return mixer;
}

function getModelByName(name) {
  for (var i = 0; i < MODELS.length; ++i) {
    if (MODELS[i].name === name) {
      return MODELS[i];
    }
  }
  return null;
}

function loadGltfModel(model, onLoaded) {
  var loader = new THREE.GLTFLoader();
  var modelName = "models/" + model.name + ".gltf";
  loader.load(modelName, function(gltf) {
      var scene = gltf.scene;
      model.animations = gltf.animations;
      model.scene = scene;

      gltf.scene.traverse(function(object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        } else if (object.isLight) {
          object.castShadow = true;
          object.shadow.mapSize.width = 1024;
          object.shadow.mapSize.height = 1024;
          object.shadow.camera.near = 0.5;
          object.shadow.camera.far = 500;
          object.shadow.bias = -0.005;
        }
      });
      onLoaded();
    },
    function(xhr) {
      document.getElementById('loader').innerText = "Loading model " + Math.round(xhr.loaded / xhr.total * 100) + "%";
    });
}

function animate() {
  requestAnimationFrame(animate);
  moveCamera();
  var mixerUpdateDelta = clock.getDelta();
  for (var i = 0; i < mixers.length; ++i) {
    mixers[i].update(mixerUpdateDelta);
  }
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

  var hlight = new THREE.AmbientLight(0xffffff, .75);
  worldScene.add(hlight);

  var light = new THREE.PointLight(0xff0000, 1, 100);
  light.position.set(0, -10, 0);
  worldScene.add(light);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 500;
  light.shadow.bias = -0.005;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function mouseMoved(evt) {
  camera.rotation.y -= evt.movementX / 100;
  let nextCameraRotationX = camera.rotation.x - evt.movementY / 100;
  if (nextCameraRotationX <= 1.7 && nextCameraRotationX >= -1.7) {
    camera.rotation.x = nextCameraRotationX;
  }
}

function keyDowned(evt) {
  if (evt.key === "z") {
    forwardSpeed = .1;
  } else if (evt.key === "s") {
    forwardSpeed = -.1;
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