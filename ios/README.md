# Marionette Controller iOS App

iOS app for controlling the marionette puppet simulation using iPhone sensors and ARKit body tracking.

## Features

- **Controller Mode**: Uses IMU sensors to detect device orientation (roll, pitch, yaw) and translation
- **Mocap Mode**: Uses ARKit body tracking to capture skeleton data for inverse kinematics mapping
- **BLE Communication**: Streams sensor data via Bluetooth Low Energy to web dashboard

## Requirements

- iOS 15.0+
- Xcode 15.0+
- Device with ARKit support (for Mocap mode)
- Bluetooth enabled

## Setup

### Option 1: Using xcodegen (Recommended)

1. Install xcodegen if not already installed:
   ```bash
   brew install xcodegen
   ```

2. Run the setup script:
   ```bash
   ./setup.sh
   ```

3. Open the generated project:
   ```bash
   open MarionetteController.xcodeproj
   ```

### Option 2: Manual Setup

1. Open Xcode
2. Create a new iOS App project
3. Set the following:
   - Product Name: MarionetteController
   - Organization Identifier: com.inquiryinstitute
   - Interface: SwiftUI
   - Language: Swift
4. Copy all Swift files from `MarionetteController/` to the project
5. Add the Info.plist with required permissions
6. Add frameworks: CoreMotion, CoreBluetooth, ARKit, RealityKit

## Building

### Build for Simulator
```bash
xcodebuild -project MarionetteController.xcodeproj \
  -scheme MarionetteController \
  -sdk iphonesimulator \
  -configuration Debug
```

### Build for Device
```bash
./build.sh Release
```

Or in Xcode:
1. Select your device or simulator
2. Press ⌘R to build and run

## Deployment

### To Device (Development)

1. Connect your iPhone via USB
2. In Xcode, select your device
3. Select your development team in Signing & Capabilities
4. Build and run (⌘R)

### To TestFlight

1. Archive the app:
   ```bash
   xcodebuild -project MarionetteController.xcodeproj \
     -scheme MarionetteController \
     -configuration Release \
     -archivePath build/MarionetteController.xcarchive \
     archive
   ```

2. Export for App Store:
   - Open Xcode Organizer (Window → Organizer)
   - Select the archive
   - Click "Distribute App"
   - Follow the prompts to upload to TestFlight

### To App Store

Follow the TestFlight steps, then:
1. In App Store Connect, submit for review
2. Fill in app information, screenshots, etc.

## Usage

1. Launch the app on your iPhone
2. Select mode: Controller or Mocap
3. Tap "Start BLE" to begin advertising
4. Open the telemetry dashboard in a web browser (Chrome/Edge/Opera)
5. Click "Connect to Device" and select "MarionetteController"
6. View real-time sensor data

## Permissions

The app requires:
- **Bluetooth**: To advertise sensor data
- **Camera**: For ARKit body tracking (Mocap mode)
- **Motion**: For IMU sensor data (Controller mode)

## Troubleshooting

### "Bluetooth is not powered on"
- Enable Bluetooth in iOS Settings

### "Body tracking is not supported"
- ARKit body tracking requires iPhone X or later
- Ensure camera permissions are granted

### Web BLE connection fails
- Ensure both devices are on the same network
- Use Chrome, Edge, or Opera (Web BLE support required)
- Check that BLE advertising is active in the app

## Project Structure

```
ios/
├── MarionetteController/
│   ├── MarionetteControllerApp.swift    # App entry point
│   ├── ContentView.swift                # Main UI
│   ├── MotionManager.swift              # IMU sensor handling
│   ├── ARKitBodyTracker.swift           # Body tracking
│   ├── BLEPeripheral.swift              # BLE advertising
│   ├── WebSocketClient.swift            # WebSocket (optional)
│   ├── ARViewContainer.swift           # AR view wrapper
│   └── Info.plist                      # App configuration
├── project.yml                         # xcodegen config
├── setup.sh                            # Setup script
├── build.sh                            # Build script
└── README.md                           # This file
```
