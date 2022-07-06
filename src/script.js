import './style.css'
import * as THREE from 'three'
import GUI from 'lil-gui'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CinematicCamera } from 'three/examples/jsm/cameras/CinematicCamera.js'

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.ambient = new THREE.AmbientLight(0xffffff, 0.1)
scene.add(scene.ambient)

// Debug
const gui = new GUI()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new CinematicCamera(60, sizes.width / sizes.height, 1, 1000)
camera.position.set(2, 1, 500)
camera.setLens(5)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Spheres
 */
const spheres = {}

spheres.count = 1500

// Lights
spheres.directionalLights = new THREE.DirectionalLight()
spheres.directionalLights.position.set(1, 1, 1).normalize()
scene.add(spheres.directionalLights)

// Geometry
spheres.geometry = new THREE.SphereGeometry(15, 32, 32)

// Object Loop
for(let i = 0; i < spheres.count; i++)
{
    const object = new THREE.Mesh(spheres.geometry, new THREE.MeshLambertMaterial({ color: '#5e5e5e' }))

    object.position.x = Math.random() * 800 - 400
    object.position.y = Math.random() * 800 - 400
    object.position.z = Math.random() * 800 - 400

    scene.add(object)
}

// Raycaster
const raycaster = new THREE.Raycaster()

// Options
const mouse = new THREE.Vector2()
let INTERSECTED
const radius = 100
let theta = 0

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})

renderer.setClearColor('#0f0f0f', 1)
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

window.addEventListener('mousemove', (_event) => {
    _event.preventDefault()

    mouse.x = (_event.clientX / sizes.width) * 2 - 1
    mouse.y = - (_event.clientY / sizes.height) * 2 + 1
})

const effectController = {
    focalLength: 15,
    fstop: 2.8,
    focalDepth: 3,
    showFocus: false
}

const matChanger = () => {
    for(const e in effectController) {
        if(e in camera.postprocessing.bokeh_uniforms) {
            camera.postprocessing.bokeh_uniforms[e].value = effectController[e]
        }
    }

    camera.postprocessing.bokeh_uniforms['znear'].value = camera.near
    camera.postprocessing.bokeh_uniforms['zfar'].value = camera.far
    camera.setLens(effectController.focalLength, camera.frameHeight, effectController.fstop, camera.coc)
    effectController['focalDepth'] = camera.postprocessing.bokeh_uniforms['focalDepth'].value
}

gui
.add(
    effectController, 
    'focalLength', 
    1, 
    135, 
    0.01 
).onChange(matChanger)

gui
.add(
    effectController, 
    'fstop', 
    1.8, 
    22, 
    0.01 
).onChange(matChanger)

gui
.add(
    effectController, 
    'focalDepth', 
    0.1, 
    100, 
    0.001 
).onChange(matChanger)

gui
.add(
    effectController, 
    'showFocus', 
    true 
).onChange(matChanger)

matChanger()

/**
 * Animate
 */
const clock = new THREE.Clock()
let lastElapsedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - lastElapsedTime
    lastElapsedTime = elapsedTime

    theta += 0.1

    camera.position.x = radius * Math.sin(THREE.MathUtils.degToRad(theta))
    camera.position.x = radius * Math.sin(THREE.MathUtils.degToRad(theta))
    camera.position.z = radius * Math.cos(THREE.MathUtils.degToRad(theta))

    camera.updateMatrixWorld()

    // Update controls
    controls.update()
    
    // Render & Find Intersection
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(scene.children, false)

    if(intersects.length > 0)
    {
        const targetDistance = intersects[0].distance

        // Method Cinematic Camera (fokusAt)
        camera.focusAt(targetDistance) 

        if(INTERSECTED != intersects[0].object) {
            if(INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex)

            INTERSECTED = intersects[0].object
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex()
            INTERSECTED.material.emissive.setHex(0xff0000)
        }
    }
    else
    {
        if(INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex)
        INTERSECTED = null
    }

    // Render
    if(camera.postprocessing.enabled) {
        camera.renderCinematic(scene, renderer)
    }
    else
    {
        scene.overrideMaterial = null

        renderer.clear()
        renderer.render(scene, camera)
    }
    
    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()