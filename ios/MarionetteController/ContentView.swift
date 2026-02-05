import SwiftUI
import CoreMotion
import ARKit

enum ControlMode: String, CaseIterable {
    case controller = "Controller"
    case mocap = "Mocap"
}

struct ContentView: View {
    @StateObject private var motionManager = MotionManager()
    @StateObject private var bodyTracker = ARKitBodyTracker()
    @StateObject private var blePeripheral = BLEPeripheral()
    @State private var controlMode: ControlMode = .controller
    @State private var showARView: Bool = false
    @State private var refreshTick: Int = 0
    
    var body: some View {
        VStack(spacing: 20) {
            // Header
            Text("Marionette Controller")
                .font(.largeTitle)
                .fontWeight(.bold)
                .padding(.top)
            
            // Mode Selector
            Picker("Mode", selection: $controlMode) {
                ForEach(ControlMode.allCases, id: \.self) { mode in
                    Text(mode.rawValue).tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .onChange(of: controlMode) { newMode in
                // Stop current mode when switching
                if motionManager.isActive {
                    motionManager.stop()
                }
                if bodyTracker.isTracking {
                    bodyTracker.stopTracking()
                    showARView = false
                }
                // Auto-start motion when entering Controller mode so orientation updates immediately
                if newMode == .controller {
                    motionManager.start()
                }
            }
            
            // BLE Advertising Status
            HStack {
                Circle()
                    .fill(blePeripheral.isAdvertising ? Color.green : Color.red)
                    .frame(width: 12, height: 12)
                Text(blePeripheral.isAdvertising ? "Advertising" : "Not Advertising")
                    .font(.headline)
            }
            .padding()
            
            // BLE Control
            HStack {
                Button(blePeripheral.isAdvertising ? "Stop BLE" : "Start BLE") {
                    if blePeripheral.isAdvertising {
                        blePeripheral.stopAdvertising()
                    } else {
                        blePeripheral.startAdvertising()
                    }
                }
                .buttonStyle(.borderedProminent)
            }
            .padding(.horizontal)
            
            // Mode-specific content
            if controlMode == .controller {
                controllerModeView
            } else {
                mocapModeView
            }
            
            // Helper text: sensors don't require BLE
            if controlMode == .controller {
                Text("Tap Start to enable sensors. BLE is optional for streaming.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Control Button (Start = enable motion/ARKit; BLE is separate)
            Button(action: {
                if controlMode == .controller {
                    if motionManager.isActive {
                        motionManager.stop()
                    } else {
                        motionManager.start()
                    }
                } else {
                    if bodyTracker.isTracking {
                        bodyTracker.stopTracking()
                        showARView = false
                    } else {
                        showARView = true
                    }
                }
            }) {
                Text(isActive ? "Stop" : "Start")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isActive ? Color.red : Color.green)
                    .cornerRadius(10)
            }
            .padding(.horizontal)
            .padding(.bottom)
        }
        .sheet(isPresented: $showARView) {
            ARViewContainer(bodyTracker: bodyTracker)
        }
        .onAppear {
            // Auto-start motion in Controller mode so orientation/translation update immediately (no BLE required)
            if controlMode == .controller && !motionManager.isActive {
                motionManager.start()
            }
        }
        .onReceive(Timer.publish(every: 0.05, on: .main, in: .common).autoconnect()) { _ in
            // Force view to refresh so orientation/translation numbers update on screen
            if controlMode == .controller && motionManager.isActive {
                refreshTick += 1
            }
        }
        .onChange(of: motionManager.roll) { _ in
            if controlMode == .controller && blePeripheral.isAdvertising {
                updateBLEIMUData()
            }
        }
        .onChange(of: motionManager.pitch) { _ in
            if controlMode == .controller && blePeripheral.isAdvertising {
                updateBLEIMUData()
            }
        }
        .onChange(of: motionManager.yaw) { _ in
            if controlMode == .controller && blePeripheral.isAdvertising {
                updateBLEIMUData()
            }
        }
        .onChange(of: motionManager.translationX) { _ in
            if controlMode == .controller && blePeripheral.isAdvertising {
                updateBLEIMUData()
            }
        }
        .onChange(of: motionManager.translationY) { _ in
            if controlMode == .controller && blePeripheral.isAdvertising {
                updateBLEIMUData()
            }
        }
        .onChange(of: motionManager.translationZ) { _ in
            if controlMode == .controller && blePeripheral.isAdvertising {
                updateBLEIMUData()
            }
        }
        .onChange(of: bodyTracker.skeletonData) { skeletonData in
            if controlMode == .mocap, let skeleton = skeletonData, blePeripheral.isAdvertising {
                blePeripheral.updateSkeletonData(skeleton)
            }
        }
    }
    
    private var isActive: Bool {
        controlMode == .controller ? motionManager.isActive : bodyTracker.isTracking
    }
    
    private var controllerModeView: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Motion active / error
            if let error = motionManager.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(.bottom, 4)
            } else {
                HStack {
                    Circle()
                        .fill(motionManager.isActive ? Color.green : Color.gray)
                        .frame(width: 8, height: 8)
                    Text(motionManager.isActive ? "Sensors active" : "Tap Start to enable sensors")
                        .font(.subheadline)
                        .foregroundColor(motionManager.isActive ? .primary : .secondary)
                }
                .padding(.bottom, 4)
            }
            
            Text("Orientation (Euler Angles)")
                .font(.headline)
            
            HStack {
                VStack(alignment: .leading) {
                    Text("Roll:")
                    Text("Pitch:")
                    Text("Yaw:")
                }
                VStack(alignment: .leading) {
                    Text(String(format: "%.2f°", motionManager.roll * 180 / .pi))
                    Text(String(format: "%.2f°", motionManager.pitch * 180 / .pi))
                    Text(String(format: "%.2f°", motionManager.yaw * 180 / .pi))
                }
            }
            .font(.system(.body, design: .monospaced))
            .id(refreshTick)
            
            Text("Translation (user acceleration)")
                .font(.headline)
                .padding(.top)
            
            HStack {
                VStack(alignment: .leading) {
                    Text("X:")
                    Text("Y:")
                    Text("Z:")
                }
                VStack(alignment: .leading) {
                    Text(String(format: "%.3f", motionManager.translationX))
                    Text(String(format: "%.3f", motionManager.translationY))
                    Text(String(format: "%.3f", motionManager.translationZ))
                }
            }
            .font(.system(.body, design: .monospaced))
            .id(refreshTick)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(10)
        .padding(.horizontal)
    }
    
    private var mocapModeView: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Body Tracking")
                .font(.headline)
            
            if bodyTracker.isTracking {
                if let skeleton = bodyTracker.skeletonData {
                    Text("Joints: \(skeleton.joints.count)")
                        .font(.subheadline)
                    Text("Tracking: Active")
                        .font(.subheadline)
                        .foregroundColor(.green)
                    
                    // Show key joint positions
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Key Joints:")
                            .font(.caption)
                            .fontWeight(.semibold)
                        ForEach(["head", "leftHand", "rightHand", "leftFoot", "rightFoot"], id: \.self) { jointName in
                            if let joint = skeleton.joints.first(where: { $0.name == jointName }) {
                                Text("\(jointName): [\(String(format: "%.2f", joint.position[0])), \(String(format: "%.2f", joint.position[1])), \(String(format: "%.2f", joint.position[2]))]")
                                    .font(.system(.caption, design: .monospaced))
                            }
                        }
                    }
                    .padding(.top, 5)
                } else {
                    Text("Waiting for skeleton data...")
                        .font(.subheadline)
                        .foregroundColor(.orange)
                }
            } else {
                Text("Tap Start to begin body tracking")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(10)
        .padding(.horizontal)
    }
    
    private func updateBLEIMUData() {
        guard motionManager.isActive else { return }
        
        blePeripheral.updateIMUData(
            roll: motionManager.roll,
            pitch: motionManager.pitch,
            yaw: motionManager.yaw,
            translationX: motionManager.translationX,
            translationY: motionManager.translationY,
            translationZ: motionManager.translationZ
        )
    }
}

#Preview {
    ContentView()
}
