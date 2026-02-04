import Foundation
import CoreMotion

class MotionManager: ObservableObject {
    private let motionManager = CMMotionManager()
    private let operationQueue = OperationQueue()
    
    @Published var roll: Double = 0.0
    @Published var pitch: Double = 0.0
    @Published var yaw: Double = 0.0
    
    @Published var translationX: Double = 0.0
    @Published var translationY: Double = 0.0
    @Published var translationZ: Double = 0.0
    
    @Published var isActive: Bool = false
    
    private var initialAttitude: CMAttitude?
    private var initialPosition: CMAccelerometerData?
    
    func start() {
        guard motionManager.isDeviceMotionAvailable else {
            print("Device motion is not available")
            return
        }
        
        motionManager.deviceMotionUpdateInterval = 1.0 / 60.0 // 60 Hz
        motionManager.showsDeviceMovementDisplay = true
        
        motionManager.startDeviceMotionUpdates(using: .xMagneticNorthZVertical, to: operationQueue) { [weak self] (motion, error) in
            guard let self = self, let motion = motion else { return }
            
            DispatchQueue.main.async {
                if self.initialAttitude == nil {
                    self.initialAttitude = motion.attitude.copy() as? CMAttitude
                }
                
                // Get relative attitude from initial position
                if let initial = self.initialAttitude {
                    motion.attitude.multiply(byInverseOf: initial)
                }
                
                // Extract Euler angles (roll, pitch, yaw)
                self.roll = motion.attitude.roll
                self.pitch = motion.attitude.pitch
                self.yaw = motion.attitude.yaw
                
                // Use user acceleration for translation (relative movement)
                // Integrate acceleration to get velocity, then position
                // For simplicity, we'll use the acceleration values directly as translation
                // In a real implementation, you'd integrate over time
                self.translationX = motion.userAcceleration.x
                self.translationY = motion.userAcceleration.y
                self.translationZ = motion.userAcceleration.z
            }
        }
        
        isActive = true
    }
    
    func stop() {
        motionManager.stopDeviceMotionUpdates()
        initialAttitude = nil
        isActive = false
    }
}
