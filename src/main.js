import * as faceapi from 'face-api.js';

let isModelLoaded = false;
let stream = null;
let currentGlassesIndex = 0;

// Sample glasses images - replace these URLs with your actual glasses images
const glassesImages = [
  'https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL2pvYjk2Mi0xMDZhLnBuZw.png', // Replace with actual transparent PNG URLs
  'https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA4L2pvYjk1Mi0wNzgtbDZuNGxncWsuanBn.jpg',
  'https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA4L2pvYjk1Mi0wNzgtbDZuNGxncWsuanBn.jpg'
];

const glasses = new Image();
glasses.src = glassesImages[0];

async function loadModels() {
  const modelPath = '/models';
  
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
    isModelLoaded = true;
    document.getElementById('loading').style.display = 'none';
  } catch (error) {
    console.error('Error loading models:', error);
    alert('Error loading face detection models. Please try again.');
  }
}

async function startVideo() {
  const video = document.getElementById('video');
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Unable to access camera. Please make sure you have granted camera permissions.');
  }
}

function stopVideo() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    const video = document.getElementById('video');
    video.srcObject = null;
  }
}

async function detectFace() {
  if (!isModelLoaded) return;

  const video = document.getElementById('video');
  const canvas = document.getElementById('overlay');
  const context = canvas.getContext('2d');

  const detection = await faceapi.detectSingleFace(
    video,
    new faceapi.TinyFaceDetectorOptions()
  ).withFaceLandmarks();

  if (detection) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate glasses position based on face landmarks
    const leftEye = detection.landmarks.getLeftEye();
    const rightEye = detection.landmarks.getRightEye();

    const eyeDistance = Math.sqrt(
      Math.pow(rightEye[0].x - leftEye[0].x, 2) +
      Math.pow(rightEye[0].y - leftEye[0].y, 2)
    );

    // Position glasses based on eye positions
    const glassesWidth = eyeDistance * 1.5;
    const glassesHeight = (glassesWidth * glasses.height) / glasses.width;
    const glassesX = leftEye[0].x - glassesWidth * 0.25;
    const glassesY = leftEye[0].y - glassesHeight * 0.5;

    context.drawImage(
      glasses,
      glassesX,
      glassesY,
      glassesWidth,
      glassesHeight
    );
  }

  requestAnimationFrame(detectFace);
}

function switchGlasses() {
  currentGlassesIndex = (currentGlassesIndex + 1) % glassesImages.length;
  glasses.src = glassesImages[currentGlassesIndex];
}

// Event Listeners
document.getElementById('startButton').addEventListener('click', async () => {
  if (!stream) {
    await startVideo();
    detectFace();
    document.getElementById('startButton').textContent = 'Stop Camera';
  } else {
    stopVideo();
    document.getElementById('startButton').textContent = 'Start Camera';
  }
});

document.getElementById('switchGlasses').addEventListener('click', switchGlasses);

// Initialize
loadModels();