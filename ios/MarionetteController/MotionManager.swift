import Foundation
import CoreMotion

class MotionManager: ObservableObject {
    private let cmMotion = CMMotionManager()
    private let queue = OperationQueue()
    
    @Published var roll: Double = 0.0
    @Published var pitch: Double = 0.0
    @Published var yaw: Double = 0.0
    
    @Published var translationX: Double = 0.0
    @Published var translationY: Double = 0.0
    @Published var translationZ: Double = 0.0
    
    @Published var isActive: Bool = false
    @Published var errorMessage: String?
    
    private var initialAttitude: CMAttitude?
    
    func start() {
        errorMessage = nil
        
        guard cmMotion.isDeviceMotionAvailable else {
            errorMessage = "Device motion not available (use a real device, not Simulator)"
            isActive = false
            return
        }
        
        cmMotion.deviceMotionUpdateInterval = 1.0 / 60.0
        // Use gravity-only reference so it works indoors and without magnetometer
        let ref: CMAttitudeReferenceFrame = .xArbitraryZVertical
        
        cmMotion.startDeviceMotionUpdates(using: ref, to: queue) { [weak self] (motion, error) in
            guard let self = self else { return }
            
            if let error = error {
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                    self.isActive = false
                }
                return
            }
            
            guard let motion = motion else { return }
            
            DispatchQueue.main.async {
                if self.initialAttitude == nil {
                    self.initialAttitude = motion.attitude.copy() as? CMAttitude
                }
                
                if let initial = self.initialAttitude {
                    motion.attitude.multiply(byInverseOf: initial)
                }
                
                self.roll = motion.attitude.roll
                self.pitch = motion.attitude.pitch
                self.yaw = motion.attitude.yaw
                self.translationX = motion.userAcceleration.x
                self.translationY = motion.userAcceleration.y
                self.translationZ = motion.userAcceleration.z
            }
        }
        
        isActive = true
    }
    
    func stop() {
        cmMotion.stopDeviceMotionUpdates()
        initialAttitude = nil
        isActive = false
        errorMessage = nil
    }
}
