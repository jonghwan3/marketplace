import { useEffect, useRef, useState } from "react";

type DetectedObject = {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
};

type ItemDetails = {
  class: string;
  size: string;
  color: string;
  estimated_price: string;
  status: string
};


const ObjectDetectionClient = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [croppedImages, setCroppedImages] = useState<string[]>([]);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null); // State to store response

  // Start camera when component mounts
  useEffect(() => {
    const startCamera = async () => {
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      }
    };
    startCamera();
  }, []);

  // Capture a frame from the video and display it
  const captureFrame = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Convert canvas to a data URL for display
    const imageDataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(imageDataUrl); // Display captured image

    // Convert canvas to Blob and send it to the server
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");

      // Send image to server
      const response = await fetch("http://localhost:8000/detect_objects/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setDetectedObjects(data.objects);
      setProcessedImage(`data:image/jpeg;base64,${data.processed_image}`); // Display processed image
      setCroppedImages(data.cropped_images.map((img: string) => `data:image/jpeg;base64,${img}`)); // Display cropped images
    }, "image/jpeg");
  };
  // Send selected object and corresponding cropped image to the server
  const sendSelectedObject = async () => {
    if (!selectedObject) return;
  
    // Find the index of the selected object
    const index = detectedObjects.findIndex(obj => obj === selectedObject);
    if (index === -1) return;

    const base64CroppedImage = croppedImages[index].replace(/^data:image\/\w+;base64,/, "");

    const payload = {
      object: selectedObject,
      cropped_image: base64CroppedImage // Send the base64 cropped image
    };
  
    console.log("Sending selected object and cropped image:", payload);
  
    try {
      const response = await fetch("http://localhost:8000/selected_object/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json(); // Parse response JSON
      console.log("Received item details:", data);
      if (typeof data === "string") {
        const parsedData = JSON.parse(data); // Convert JSON string to object
        setItemDetails(parsedData);
      } else {
        setItemDetails(data);
      }

    } catch (error) {
      console.error("Error fetching item details:", error);
    }

  };
  const handleChange = (field: keyof ItemDetails, value: string) => {
    setItemDetails((prevDetails) => {
      // Ensure `prevDetails` is never null by providing a default fallback
      if (!prevDetails) {
        return { class: "", size: "", color: "", estimated_price: "", status: "", [field]: value };
      }

      return {
        ...prevDetails,
        [field]: value,
      };
    });
  };

  return (
    <div>
      <h2>Object Detection</h2>
      <video ref={videoRef} autoPlay playsInline width="640" height="480" />

      <button onClick={captureFrame}>Capture Frame</button>

      {/* Display captured image */}
      {capturedImage && (
        <div>
          <h3>Captured Image:</h3>
          <img src={capturedImage} alt="Captured Frame" width="640" height="480" />
        </div>
      )}

      {/* Display processed image from the server */}
      {processedImage && (
        <div>
          <h3>Processed Image:</h3>
          <img src={processedImage} alt="Processed Frame" width="640" height="480" />
        </div>
      )}

      {/* Show detected objects with cropped images */}
      {detectedObjects.length > 0 && (
        <div>
          <h3>Detected Objects:</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
          {detectedObjects.map((obj, index) => (
              <div 
                key={index} 
                style={{ 
                  textAlign: "center", 
                  border: "1px solid #ccc", 
                  padding: "10px", 
                  borderRadius: "8px" 
                }}
              >
                <img 
                  src={croppedImages[index]} 
                  alt={`Object ${index}`} 
                  style={{ 
                    display: "block", 
                    margin: "0 auto 5px", 
                    borderRadius: "5px", 
                    maxHeight: "150px",  // Set a max height (adjust as needed)
                    width: "auto" // Keep aspect ratio
                  }}
                />
                <p>{obj.class} ({(obj.confidence * 100).toFixed(2)}%)</p>
                <button onClick={() => setSelectedObject(obj)}>Select</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show selected object */}
      {selectedObject && (
        <div>
          <h3>Selected: {selectedObject.class}</h3>
          <button onClick={sendSelectedObject}>Confirm Selection</button>
        </div>
      )}
      {/* Show iPhone details when available */}
      {itemDetails && (
         <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "10px", maxWidth: "400px", backgroundColor: "#f9f9f9" }}>
         <h2 style={{ color: "#333", textAlign: "center" }}>Item Details</h2>
   
         <label><strong>Model:</strong></label>
         <input 
           type="text"
           value={itemDetails.class || ""}
           onChange={(e) => handleChange("class", e.target.value)}
           style={{ width: "100%", padding: "5px", marginBottom: "10px" }}
         />
   
         <label><strong>Size:</strong></label>
         <input 
           type="text"
           value={itemDetails.size || ""}
           onChange={(e) => handleChange("size", e.target.value)}
           style={{ width: "100%", padding: "5px", marginBottom: "10px" }}
         />
   
         <label><strong>Color:</strong></label>
         <input 
           type="text"
           value={itemDetails.color || ""}
           onChange={(e) => handleChange("color", e.target.value)}
           style={{ width: "100%", padding: "5px", marginBottom: "10px" }}
         />
   
         <label><strong>Price:</strong></label>
         <input 
           type="text"
           value={itemDetails.estimated_price || ""}
           onChange={(e) => handleChange("estimated_price", e.target.value)}
           style={{ width: "100%", padding: "5px", marginBottom: "10px" }}
         />
   
         <label><strong>Status:</strong></label>
         <input 
           type="text"
           value={itemDetails.status || ""}
           onChange={(e) => handleChange("status", e.target.value)}
           style={{ width: "100%", padding: "5px", marginBottom: "10px" }}
         />
         
         <button 
           style={{ marginTop: "10px", padding: "8px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
           Save Changes
         </button>
       </div>
      )}
    </div>
  );
};

export default ObjectDetectionClient;
