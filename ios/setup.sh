#!/bin/bash
# Setup script for MarionetteController iOS app

set -e

echo "Setting up MarionetteController iOS project..."

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "Error: Xcode is not installed. Please install Xcode from the App Store."
    exit 1
fi

# Check if xcodegen is installed, if not, install it
if ! command -v xcodegen &> /dev/null; then
    echo "xcodegen not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install xcodegen
    else
        echo "Error: Homebrew is not installed. Please install xcodegen manually:"
        echo "  brew install xcodegen"
        echo "Or install from: https://github.com/yonaskolb/XcodeGen"
        exit 1
    fi
fi

# Generate Xcode project
echo "Generating Xcode project..."
xcodegen generate

echo "✅ Project setup complete!"
echo ""
echo "Next steps:"
echo "1. Open MarionetteController.xcodeproj in Xcode"
echo "2. Select your development team in Signing & Capabilities"
echo "3. Connect your iOS device or select a simulator"
echo "4. Build and run (⌘R)"
