import Foundation
import ARKit
import RealityKit
import simd

struct SkeletonJoint: Codable, Equatable {
    let name: String
    let position: [Double] // [x, y, z]
    let rotation: [Double]? // [x, y, z, w] quaternion
    let confidence: Float
}

struct SkeletonData: Codable, Equatable {
    let timestamp: TimeInterval
    let joints: [SkeletonJoint]
    let rootPosition: [Double]
    let rootRotation: [Double]
}

class ARKitBodyTracker: NSObject, ObservableObject, ARSessionDelegate {
    @Published var skeletonData: SkeletonData?
    @Published var isTracking: Bool = false
    
    private var arView: ARView?
    private var bodyAnchor: ARBodyAnchor?
    
    func setupARView() -> ARView {
        let view = ARView(frame: .zero)
        
        // Check if body tracking is available
        guard ARBodyTrackingConfiguration.isSupported else {
            print("Body tracking is not supported on this device")
            return view
        }
        
        let configuration = ARBodyTrackingConfiguration()
        configuration.automaticSkeletonScaleEstimationEnabled = true
        
        view.session.run(configuration)
        view.session.delegate = self
        
        arView = view
        isTracking = true
        
        return view
    }
    
    func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        for anchor in anchors {
            if let bodyAnchor = anchor as? ARBodyAnchor {
                self.bodyAnchor = bodyAnchor
                updateSkeletonData(from: bodyAnchor)
            }
        }
    }
    
    private func updateSkeletonData(from bodyAnchor: ARBodyAnchor) {
        let skeleton = bodyAnchor.skeleton
        
        // Get all joints that ARKit provides
        // Iterate through all joint names in the skeleton definition
        var joints: [SkeletonJoint] = []
        let definition = skeleton.definition
        
        for jointNameStr in definition.jointNames {
            // Create JointName from string (non-optional initializer)
            let jointName = ARSkeleton.JointName(rawValue: jointNameStr)
            
            // Get transform for this joint
            if let transform = skeleton.modelTransform(for: jointName) {
                // Extract position and rotation from transform
                let pos = simd_float3(
                    transform.columns.3.x,
                    transform.columns.3.y,
                    transform.columns.3.z
                )
                let rot = simd_quatf(transform)
                
                // Convert to arrays
                let posArray = [Double(pos.x), Double(pos.y), Double(pos.z)]
                let rotArray = [
                    Double(rot.vector.x),
                    Double(rot.vector.y),
                    Double(rot.vector.z),
                    Double(rot.vector.w)
                ]
                
                // Create joint data
                let joint = SkeletonJoint(
                    name: jointNameStr,
                    position: posArray,
                    rotation: rotArray,
                    confidence: 1.0
                )
                joints.append(joint)
            }
        }
        
        // Get root position and rotation
        let rootTransform = bodyAnchor.transform
        let rootPosition = simd_float3(rootTransform.columns.3.x, rootTransform.columns.3.y, rootTransform.columns.3.z)
        let rootRotation = simd_quatf(rootTransform)
        
        DispatchQueue.main.async {
            self.skeletonData = SkeletonData(
                timestamp: Date().timeIntervalSince1970,
                joints: joints,
                rootPosition: [Double(rootPosition.x), Double(rootPosition.y), Double(rootPosition.z)],
                rootRotation: [Double(rootRotation.vector.x), Double(rootRotation.vector.y), Double(rootRotation.vector.z), Double(rootRotation.vector.w)]
            )
        }
    }
    
    func stopTracking() {
        arView?.session.pause()
        isTracking = false
    }
}
