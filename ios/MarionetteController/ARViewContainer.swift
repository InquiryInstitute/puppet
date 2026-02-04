import SwiftUI
import ARKit
import RealityKit

struct ARViewContainer: UIViewControllerRepresentable {
    let bodyTracker: ARKitBodyTracker
    
    func makeUIViewController(context: Context) -> ARViewController {
        let viewController = ARViewController()
        viewController.bodyTracker = bodyTracker
        return viewController
    }
    
    func updateUIViewController(_ uiViewController: ARViewController, context: Context) {
        // Updates handled by ARViewController
    }
}

class ARViewController: UIViewController {
    var bodyTracker: ARKitBodyTracker?
    var arView: ARView?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        guard let bodyTracker = bodyTracker else { return }
        
        arView = bodyTracker.setupARView()
        if let arView = arView {
            view = arView
        }
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        bodyTracker?.stopTracking()
    }
}
