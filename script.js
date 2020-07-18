window.addEventListener('load', init);

let scene, camera, renderer;
let context;
let forwardSpeed = 0,
  straffSpeed = 0;

function init() {
  context = document.getElementById('context');
  context.addEventListener('click', lockMouse);
  lockMouse();
  setScene();
  renderObjects("test_mapping");
  window.addEventListener('resize', windowResized);
  window.addEventListener('mousemove', mouseMoved);
  window.addEventListener('keydown', keyDowned);
  window.addEventListener('keyup', keyUpped);
}

function setScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdddddd);

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, .1, 5000);
  camera.rotation.order = "YXZ";
  camera.position.x = -1.5;
  camera.position.y = 1.7;
  camera.position.z = 1.5;
  camera.rotation.y = .2;
  camera.rotation.x = .2;

  hlight = new THREE.AmbientLight(0xffffff, .5);
  scene.add(hlight);

  var pointLight = new THREE.PointLight(0xffffff, .1);
  scene.add(pointLight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  context.appendChild(renderer.domElement);
  setSceneSize();
}

function renderObjects(sceneName) {
  let loader = new THREE.GLTFLoader();
  loader.load('models/' + sceneName + '.gltf',
    function(gltf) {
      gltf.scene.traverse(function(node) {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        } else if (node.isLight) {
          node.castShadow = true;
          node.shadow.mapSize.width = 1024;
          node.shadow.mapSize.height = 1024;
          node.shadow.camera.near = 0.5;
          node.shadow.camera.far = 500;
          node.shadow.bias = -0.005;
        }
      })
      scene.add(gltf.scene);
      animate();
    },
    function(xhr) {
      document.getElementById('loader').innerText = Math.round(xhr.loaded / xhr.total * 100) + "%";
      if (Math.round(xhr.loaded / xhr.total * 100) == 100) {
        document.getElementById('loader').style.display = "none";
      }
    });
}

function animate() {
  moveCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function setSceneSize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function windowResized() {
  setSceneSize();
}

function mouseMoved(evt) {
  camera.rotation.y -= evt.movementX / 500;
  let nextCameraRotationX = camera.rotation.x - evt.movementY / 500;
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
    straffSpeed = -.075;
  } else if (evt.key === "d") {
    straffSpeed = .075;
  }
}

function keyUpped(evt) {
  if (evt.key === "z" || evt.key === "s") {
    forwardSpeed = 0;
  } else if (evt.key === "q" || evt.key === "d") {
    straffSpeed = 0;
  }
}

function moveCamera() {
  camera.position.x = (camera.position.x) + (Math.cos(camera.rotation.y) * straffSpeed) - (Math.sin(camera.rotation.y) * forwardSpeed);
  camera.position.z = (camera.position.z) + (-Math.sin(camera.rotation.y) * straffSpeed) - (Math.cos(camera.rotation.y) * forwardSpeed);
}

function lockMouse() {
  context.requestPointerLock = context.requestPointerLock ||
    context.mozRequestPointerLock ||
    context.webkitPointerLockElement;

  context.requestPointerLock()
}