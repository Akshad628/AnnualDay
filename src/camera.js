/*
 * FILE: src/camera.js
 * SYSTEM: Hardware / Input
 * RESPONSIBILITY: Acquires the webcam video stream, specifically targeting professional external cameras over built-in webcams where possible, and sets up manual focus if supported.
 * INTERACTION: Called by main.js during startExperience(). Provides the raw video element that tracker.js consumes.
 * VISUAL RESULT: Ensures the highest quality / proper field of view camera is fed to the tracking engine, preventing bad data from a low-res webcam. Doesn't render directly to the screen (video is hidden).
 */

export class CameraManager {
    /**
     * Creates a hidden HTMLVideoElement used exclusively as an invisible 
     * texture and data source for MediaPipe tracking.
     */
    constructor() {
        // Create a hidden video element to hold the stream
        this.videoElement = document.createElement("video");
        this.videoElement.style.display = "none";
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        document.body.appendChild(this.videoElement);
        this.stream = null;
    }

    /**
     * Asynchronously requests camera access, attempts to find an "Owl" camera,
     * configures constraints for 1080p, and disables autofocus.
     * 
     * WHY: Pro cameras often hunt for focus during a live gig due to stage lighting. 
     * Locking focus ensures the pose landmarks don't get glitchy due to blur.
     */
    async initialize() {
        try {
            // STEP 1 — First pass (NO permission)
            // Enumerate devices to find the specific webcam before prompting the user.
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            
            // Try label-based detection (may fail if labels are empty due to privacy restrictions prior to permission)
            let targetDevice = videoDevices.find(d => {
                return d.label.toLowerCase().includes("owl");
            });

            // STEP 2 — If NOT found → request permission
            // Once we have permission, device labels become fully readable.
            if (!targetDevice) {
                console.warn("Owl camera not found (pre-permission). Requesting access...");

                await navigator.mediaDevices.getUserMedia({ video: true });

                const devicesAfter = await navigator.mediaDevices.enumerateDevices();
                const videoDevicesAfter = devicesAfter.filter(d => d.kind === "videoinput");

                targetDevice = videoDevicesAfter.find(d => {
                    const label = d.label.toLowerCase();
                    return (
                        label.includes("owl") &&
                        label.includes("4k") &&
                        label.includes("pro")
                    );
                });
            }

            // STEP 3 — Apply constraints
            // We request an ideal resolution of 1080p to feed MediaPipe a sharp image.
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                }
            };

            if (targetDevice) {
                console.log("✅ Using Owl Camera:", targetDevice.label);
                // Bind strictly to the found device if it exists.
                constraints.video.deviceId = { exact: targetDevice.deviceId };
            } else {
                console.warn("⚠️ Owl camera NOT found. Using default.");
                console.warn("Owl camera not detected. Using default camera.");
            }

            // Request the final stream with our customized constraints.
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;

            // Wait for the video feed to be fully loaded and metadata populated 
            // so we don't feed zero-dimension frames into the tracker.
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => resolve();
            });

            await this.videoElement.play();

            // Attempt to turn off autofocus to stabilize tracking.
            const track = this.stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();

            // Check if the browser and camera allow manual focus control
            if (capabilities.focusMode && capabilities.focusMode.includes("manual")) {
                await track.applyConstraints({
                    advanced: [{ focusMode: "manual" }]
                });
                console.log("Success: Autofocus disabled.");
            } else {
                console.warn("Manual focus control is not supported by this browser/camera combination.");
            }

            console.log("Camera initialized successfully.");
            return this.videoElement;

        } catch (error) {
            console.error("Error accessing camera:", error);
        }
    }

    /**
     * Simple getter to expose the configured video element to tracker.js
     * @returns {HTMLVideoElement} The playing, hidden video element.
     */
    getVideoElement() {
        return this.videoElement;
    }
}