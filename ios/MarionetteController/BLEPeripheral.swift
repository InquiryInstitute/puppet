import Foundation
import CoreBluetooth

class BLEPeripheral: NSObject, ObservableObject, CBPeripheralManagerDelegate {
    private var peripheralManager: CBPeripheralManager!
    
    // BLE Service and Characteristics
    private let serviceUUID = CBUUID(string: "12345678-1234-1234-1234-123456789ABC")
    private let imuCharacteristicUUID = CBUUID(string: "12345678-1234-1234-1234-123456789ABD")
    private let skeletonCharacteristicUUID = CBUUID(string: "12345678-1234-1234-1234-123456789ABE")
    
    private var service: CBMutableService!
    private var imuCharacteristic: CBMutableCharacteristic!
    private var skeletonCharacteristic: CBMutableCharacteristic!
    
    @Published var isAdvertising: Bool = false
    
    var onIMUDataUpdate: ((Data) -> Void)?
    var onSkeletonDataUpdate: ((Data) -> Void)?
    
    override init() {
        super.init()
        peripheralManager = CBPeripheralManager(delegate: self, queue: nil)
    }
    
    func setupService() {
        // Create characteristics
        imuCharacteristic = CBMutableCharacteristic(
            type: imuCharacteristicUUID,
            properties: [.read, .notify],
            value: nil,
            permissions: [.readable]
        )
        
        skeletonCharacteristic = CBMutableCharacteristic(
            type: skeletonCharacteristicUUID,
            properties: [.read, .notify],
            value: nil,
            permissions: [.readable]
        )
        
        // Create service
        service = CBMutableService(type: serviceUUID, primary: true)
        service.characteristics = [imuCharacteristic, skeletonCharacteristic]
        
        // Add service to peripheral manager
        peripheralManager.add(service)
    }
    
    func startAdvertising() {
        guard peripheralManager.state == .poweredOn else {
            print("Bluetooth is not powered on")
            return
        }
        
        let advertisementData: [String: Any] = [
            CBAdvertisementDataServiceUUIDsKey: [serviceUUID],
            CBAdvertisementDataLocalNameKey: "MarionetteController"
        ]
        
        peripheralManager.startAdvertising(advertisementData)
        isAdvertising = true
    }
    
    func stopAdvertising() {
        peripheralManager.stopAdvertising()
        isAdvertising = false
    }
    
    func updateIMUData(roll: Double, pitch: Double, yaw: Double, translationX: Double, translationY: Double, translationZ: Double) {
        guard isAdvertising else { return }
        
        // Encode IMU data as JSON
        let imuData: [String: Any] = [
            "type": "imu",
            "rotation": [
                "roll": roll,
                "pitch": pitch,
                "yaw": yaw
            ],
            "translation": [
                "x": translationX,
                "y": translationY,
                "z": translationZ
            ]
        ]
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: imuData, options: [])
            imuCharacteristic.value = jsonData
            peripheralManager.updateValue(jsonData, for: imuCharacteristic, onSubscribedCentrals: nil)
        } catch {
            print("Error encoding IMU data: \(error)")
        }
    }
    
    func updateSkeletonData(_ skeleton: SkeletonData) {
        guard isAdvertising else { return }
        
        do {
            let encoder = JSONEncoder()
            let jsonData = try encoder.encode(skeleton)
            skeletonCharacteristic.value = jsonData
            peripheralManager.updateValue(jsonData, for: skeletonCharacteristic, onSubscribedCentrals: nil)
        } catch {
            print("Error encoding skeleton data: \(error)")
        }
    }
    
    // MARK: - CBPeripheralManagerDelegate
    
    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        switch peripheral.state {
        case .poweredOn:
            print("Bluetooth is powered on")
            setupService()
        case .poweredOff:
            print("Bluetooth is powered off")
        case .unauthorized:
            print("Bluetooth is unauthorized")
        case .unsupported:
            print("Bluetooth is unsupported")
        case .resetting:
            print("Bluetooth is resetting")
        @unknown default:
            print("Unknown Bluetooth state")
        }
    }
    
    func peripheralManager(_ peripheral: CBPeripheralManager, didAdd service: CBService, error: Error?) {
        if let error = error {
            print("Error adding service: \(error)")
        } else {
            print("Service added successfully")
        }
    }
    
    func peripheralManagerDidStartAdvertising(_ peripheral: CBPeripheralManager, error: Error?) {
        if let error = error {
            print("Error advertising: \(error)")
        } else {
            print("Started advertising")
        }
    }
}
