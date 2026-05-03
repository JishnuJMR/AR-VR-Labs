import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { gsap } from 'gsap';

// --- SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Dim ambient light so the spotlights pop


// --- THE ROOM ---
const loader = new THREE.TextureLoader();

// 1. TEXTURED FLOOR (Dark Wood or Polished Stone)
const floorTex = loader.load('https://threejs.org/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg'); // Placeholder for marble/wood
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(8, 8);

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.2 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// 2. TEXTURED WALLS (Concrete or Plaster)
const woodTexture = loader.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');

// 3. Make the texture repeat so it doesn't look stretched
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
woodTexture.repeat.set(4, 2); // Repeat 4 times horizontally, 2 times vertically

const woodMaterial = new THREE.MeshStandardMaterial({ 
    map: woodTexture,
    roughness: 0.6, // Wood isn't usually perfectly shiny
    metalness: 0.1
});

// 4. Apply to Walls
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-10, 5, 0);
scene.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(10, 5, 0);
scene.add(rightWall);

// Ceiling (Darker to hide the void)
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), woodMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.set(0, 10, 0);
scene.add(ceiling);

// --- IMPROVED TEXTURE HELPER ---
function createTextTexture(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512; 
    canvas.height = 512;
    
    // Background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text Styling
    ctx.fillStyle = 'black';
    ctx.font = 'bold 40px Arial'; // Slightly smaller font helps with longer questions
    ctx.textAlign = 'center';
    
    const maxWidth = 450; // Leave a small margin on the sides
    const lineHeight = 50;
    const x = canvas.width / 2;
    
    // --- WORD WRAPPING LOGIC ---
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line); // Push the last line

    // Calculate starting Y position to keep text centered vertically
    const totalHeight = lines.length * lineHeight;
    let y = (canvas.height - totalHeight) / 2 + lineHeight / 2;

    // Draw each line
    lines.forEach((l) => {
        ctx.fillText(l.trim(), x, y);
        y += lineHeight;
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true; // Ensures the texture refreshes
    return texture;
}
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const gltfLoader = new GLTFLoader();

// Load the Chandelier
gltfLoader.load('models/scene.gltf', (gltf) => {
    const model = gltf.scene;
    model.position.set(0, 7, 0); // Center of the ceiling
    model.scale.set(4, 4, 4); // Adjust size as needed
    scene.add(model);
    
    // Optional: Add a point light inside the chandelier 
    // to make it look like it's actually glowing
    const chandelierLight = new THREE.PointLight(0xffaa00, 30, 20);
    chandelierLight.position.set(0, 8, 0);
    scene.add(chandelierLight);
});

// Load a plant1 for the corner
gltfLoader.load('models/monstera_deliciosa_potted_mid-century_plant.glb', (gltf) => {
    const plant1 = gltf.scene;
    plant1.position.set(-9, 1.5, -8); // Corner of the room
    plant1.scale.set(2, 2.5, 2);
    scene.add(plant1);
});

gltfLoader.load('models/monstera_deliciosa_potted_mid-century_plant.glb', (gltf) => {
    const plant2 = gltf.scene;
    plant2.position.set(9, 1.5, -8); // Corner of the room
    plant2.scale.set(2, 3, 2);
    scene.add(plant2);
});


// --- CARD LOGIC ---
const cards = [];
function createCard(x, y, z, qText, aText) {
    const group = new THREE.Group();
    const geo = new THREE.PlaneGeometry(2, 2);
    
    const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: createTextTexture(qText) }));
    const back = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: createTextTexture(aText) }));
    back.rotation.y = Math.PI; 
    
    group.add(front, back);
    group.position.set(x, y, z);
    group.userData = { flipped: false, currentAxis: null };
    scene.add(group);
    cards.push(group);

    // --- ADD SPOTLIGHT FOR THIS CARD ---
    const spotLight = new THREE.SpotLight(0xffffff, 70); // Bright white
    spotLight.position.set(x, 9.5, z + 3); // Positioned near the ceiling, slightly in front of card
    spotLight.target = group; // Point at the card
    spotLight.angle = Math.PI / 8; // Narrow beam
    spotLight.penumbra = 0.3; // Soft edges
    spotLight.castShadow = true;
    scene.add(spotLight);

// 1. Create the Strip (The "Bulb")
const stripGeo = new THREE.CylinderGeometry(0.05, 0.05, 20, 16);
// We use MeshBasicMaterial because it "ignores" shadows and always looks bright
const stripMat = new THREE.MeshBasicMaterial({ color: 0x00000 }); // Cyan Neon
const ledStrip = new THREE.Mesh(stripGeo, stripMat);

ledStrip.rotation.z = Math.PI / 2;
// Positioned slightly away from the wall (-9.9) to prevent flickering
ledStrip.position.set(0, 9.8, -9.9); 
scene.add(ledStrip);

// 2. Add PointLights along the strip for even illumination
// We'll place 3 lights: Left, Center, and Right
const lightColors = 0xffaa00;
const intensity = 10;
const distance = 15;

const positions = [-7, 0, 7]; // X coordinates for the lights

positions.forEach(xPos => {
    const pLight = new THREE.PointLight(lightColors, intensity, distance);
    pLight.position.set(xPos, 9.5, -9.5); // Slightly below and in front of the strip
    scene.add(pLight);
    
    // Optional: Add a helper to see where the lights are during setup
    // scene.add(new THREE.PointLightHelper(pLight, 0.2)); 
});
}

// --- Function to create Side Wall Strips (Left & Right) ---
function createSideStrip(xPos) {
    const sideStripGeo = new THREE.CylinderGeometry(0.05, 0.05, 20, 16);
    const sideStripMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const strip = new THREE.Mesh(sideStripGeo, sideStripMat);

    // Rotate on X to lay it flat along the Z-axis (depth of the room)
    strip.rotation.x = Math.PI / 2;

    // Position: x is wall side, y is ceiling, z is center of room
    // Offset x slightly (9.9) so it doesn't flicker against the wall
    strip.position.set(xPos, 9.8, 0); 
    scene.add(strip);

    // Add PointLights along the Z-axis for this strip
    const zPositions = [-7, 0, 7];
    zPositions.forEach(zPos => {
        const pLight = new THREE.PointLight(0xffaa00, 10, 12);
        // Position light slightly away from the wall so it hits the floor
        const lightX = xPos > 0 ? xPos - 0.5 : xPos + 0.5;
        pLight.position.set(lightX, 9.5, zPos);
        scene.add(pLight);
    });
}

// Create the Left Strip
createSideStrip(-9.9);

// Create the Right Strip
createSideStrip(9.9);


createCard(-3, 4, -9.5, '"By failing to prepare, you are preparing to fail"', "Benjamin Franklin");
createCard(3, 4, -9.5, '"Good artists copy, great artists steal"', "Pablo Picasso");

// --- INTERACTION ---
const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => {
    if (!controls.isLocked) {
        controls.lock();
    } else {
        checkFlip();
    }
});

const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

function checkFlip() {
    raycaster.setFromCamera(center, camera);
    const intersects = raycaster.intersectObjects(cards, true);
    
    if (intersects.length > 0) {
        let cardGroup = intersects[0].object.parent;
        const backSideMesh = cardGroup.children[1]; // The 'back' plane we added in createCard

        if (!cardGroup.userData.flipped) {
            // 1. Pick Random Axis
            const axis = Math.random() > 0.5 ? 'x' : 'y';
            cardGroup.userData.currentAxis = axis;

            // 2. FIX FOR X-AXIS: If flipping on X, the back text needs to be 
            // rotated 180 on Z to prevent being upside down.
            // If Y, we keep Z rotation at 0.
            if (axis === 'x') {
                backSideMesh.rotation.z = Math.PI;
            } else {
                backSideMesh.rotation.z = 0;
            }

            // 3. Animate
            gsap.to(cardGroup.rotation, {
                [axis]: Math.PI,
                duration: 0.6,
                ease: "power2.inOut",
                onComplete: () => { cardGroup.userData.flipped = true; }
            });
        } else {
            // CLOSING: Return using the saved axis
            const axis = cardGroup.userData.currentAxis;
            
            gsap.to(cardGroup.rotation, {
                [axis]: 0,
                duration: 0.6,
                ease: "power2.inOut",
                onComplete: () => { 
                    cardGroup.userData.flipped = false;
                }
            });
        }
    }
}

// --- ANIMATION LOOP ---
const keys = {};
window.onkeydown = (e) => keys[e.code] = true;
window.onkeyup = (e) => keys[e.code] = false;

// Define room boundaries (Walls are at +/- 10)
const BOUNDARY = 9.5; 

function animate() {
    requestAnimationFrame(animate);
    
    if (controls.isLocked) {
        // Store current position to revert if we hit a wall
        const oldPosition = camera.position.clone();

        // 1. Apply Movement
        if (keys['KeyW']) controls.moveForward(0.1);
        if (keys['KeyS']) controls.moveForward(-0.1);
        if (keys['KeyA']) controls.moveRight(-0.1);
        if (keys['KeyD']) controls.moveRight(0.1);

        // 2. Collision Detection (X and Z boundaries)
        // Check X Wall Collision
        if (camera.position.x > BOUNDARY || camera.position.x < -BOUNDARY) {
            camera.position.x = oldPosition.x;
        }

        // Check Z Wall Collision (including the Glass Wall)
        if (camera.position.z > BOUNDARY || camera.position.z < -BOUNDARY) {
            camera.position.z = oldPosition.z;
        }
        
        // Ensure the player stays at eye-level and doesn't fly/sink
        camera.position.y = 1.7; 
    }
    
    renderer.render(scene, camera);
}
animate();