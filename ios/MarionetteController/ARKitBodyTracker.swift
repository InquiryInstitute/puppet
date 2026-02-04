import Foundation
import ARKit
import RealityKit
import simd

struct SkeletonJoint: Codable {
    let name: String
    let position: [Double] // [x, y, z]
    let rotation: [Double]? // [x, y, z, w] quaternion
    let confidence: Float
}

struct SkeletonData: Codable {
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
        
        // Map ARKit joint names to our skeleton structure
        var joints: [SkeletonJoint] = []
        
        // Root joint (hips)
        if let rootTransform = skeleton.modelTransform(for: .root) {
            let position = simd_float3(rootTransform.columns.3.x, rootTransform.columns.3.y, rootTransform.columns.3.z)
            let rotation = simd_quatf(rootTransform)
            joints.append(SkeletonJoint(
                name: "root",
                position: [Double(position.x), Double(position.y), Double(position.z)],
                rotation: [Double(rotation.vector.x), Double(rotation.vector.y), Double(rotation.vector.z), Double(rotation.vector.w)],
                confidence: 1.0
            ))
        }
        
        // Key joints for marionette mapping
        let jointMapping: [(ARSkeleton.JointName, String)] = [
            (.head, "head"),
            (.neck_1_joint, "neck"),
            (.leftShoulder_1_joint, "leftShoulder"),
            (.leftForearm_joint, "leftElbow"),
            (.leftHand_joint, "leftHand"),
            (.rightShoulder_1_joint, "rightShoulder"),
            (.rightForearm_joint, "rightElbow"),
            (.rightHand_joint, "rightHand"),
            (.spine_1_joint, "spine1"),
            (.spine_2_joint, "spine2"),
            (.spine_3_joint, "spine3"),
            (.spine_4_joint, "spine4"),
            (.spine_5_joint, "spine5"),
            (.spine_6_joint, "spine6"),
            (.spine_7_joint, "spine7"),
            (.leftUpLeg_joint, "leftHip"),
            (.leftLeg_joint, "leftKnee"),
            (.leftFoot_joint, "leftFoot"),
            (.rightUpLeg_joint, "rightHip"),
            (.rightLeg_joint, "rightKnee"),
            (.rightFoot_joint, "rightFoot"),
        ]
        
        for (arkitJoint, ourName) in jointMapping {
            if let transform = skeleton.modelTransform(for: arkitJoint) {
                let position = simd_float3(transform.columns.3.x, transform.columns.3.y, transform.columns.3.z)
                let rotation = simd_quatf(transform)
                
                // Get confidence from skeleton
                let confidence = skeleton.jointModelTransforms[Int(arkitJoint.rawValue)] != nil ? 1.0 : 0.0
                
                joints.append(SkeletonJoint(
                    name: ourName,
                    position: [Double(position.x), Double(position.y), Double(position.z)],
                    rotation: [Double(rotation.vector.x), Double(rotation.vector.y), Double(rotation.vector.z), Double(rotation.vector.w)],
                    confidence: Float(confidence)
                ))
            }
        }
        
        // Get root position and rotation
        let rootTransform = bodyAnchor.transform
        let rootPosition = simd_float3(rootTransform.columns.3.x, rootTransform.columns.3.y, rootTransform.columns.3.z)
        let rootRotation = simd_quatf(rootTransform)
        
        DispatchQueue.main.async {
            self.skeletonData = SkeletonData(
                timestamp: bodyAnchor.timestamp,
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
