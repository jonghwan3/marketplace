import React, { useEffect, useState, useRef } from "react";
import { loginUser } from "../api/userApi";
import { getItems } from "../api/userApi";
import { getHistory } from "../api/userApi";
import { buyItem } from "../api/userApi";
import { proceedItems } from "../api/userApi";
import { uploadItem } from "../api/userApi";

import { detectItem } from "../api/userApi";
import { uploadImage } from "../api/userApi";
import { sendItem } from "../api/userApi";
import { useNavigate } from 'react-router-dom';
import ImageWithTimeout from "./ImageWithTimeout";

interface User {
    ID: number;
    Name: string;
    Email: string;
}

interface Item {
  id: number;
  picture: string;
  class: string;
  size: string;
  color: string;
  price: string;
  status: string;
  sellerName: string;
  formattedSoldAt: string;
}

type ItemInferenced = {
  class: string;
  size: string;
  color: string;
  estimatedPrice: string;
  status: string;
  picture: string;
};

type DetectedObject = {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
};

type uploadImage = {
  file: string;
}

const Spinner = () => (
  <div className="spinner"></div>
);

const Market: React.FC = () => {
  const navigate = useNavigate(); // React Router hook for navigation
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [curUser, setCurUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [cursor, setCursor] = useState(0); // Cursor-based pagination
  const [hasMore, setHasMore] = useState(true); // Flag to indicate if more data can be loaded
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Explore");
  const [cart, setCart] = useState<Item[]>([]);
  const [history, setHistory] = useState<Item[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [boughtMessage, setBoughtMessage] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [boughtAlertMessage, setBoughtAlertMessage] = useState<string[]>([]);
  const [confirmingItem, setConfirmingItem] = useState<Item | null>(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [confirmingProceed, setConfirmingProceed] = useState(false);
  // Upload
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [croppedImages, setCroppedImages] = useState<string[]>([]);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [itemInferenced, setItemInferenced] = useState<ItemInferenced | null>(null); // State to store response
  const [isLoading, setIsLoading] = useState(false);
  // Start camera when component mounts
  useEffect(() => {
    const startCamera = async () => {
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      }
    };
    startCamera();
  }, [activeTab]);
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
      const response = await detectItem(formData)
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

    try {
      setIsLoading(true);
      const response = await sendItem(payload);

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json(); // Parse response JSON
      // console.log("Received item details:", data);
      if (typeof data === "string") {
        const parsedData = JSON.parse(data); // Convert JSON string to object
        setItemInferenced(parsedData);
      } else {
        setItemInferenced(data);
      }

    } catch (error) {
      console.error("Error fetching item details:", error);
    } finally {
      setIsLoading(false);
    }

  };
  
  const uploadObject = async () => {
    try {
      if (!itemInferenced) return;
      if (!selectedObject) return;

      // Find the index of the selected object
      const index = detectedObjects.findIndex(obj => obj === selectedObject);
      if (index === -1) return;

      const base64CroppedImage = croppedImages[index].replace(/^data:image\/\w+;base64,/, "");

      const response_image = await uploadImage(base64CroppedImage || "");
      const secure_url = await response_image.json();
      if (secure_url) {
        itemInferenced.picture = secure_url;
      }

      const response = await uploadItem(itemInferenced, token || "");

      if (response.data.errors) {
        alert(response.data.errors[0]?.message || "Upload failed");
        return;
      }
      const uploadedItem = response.data.data.uploadItem;
      if (uploadedItem) {
        alert("Upload success");
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Upload failed");
    }
  };

  const handleChange = (field: keyof ItemInferenced, value: string) => {
    setItemInferenced((prevDetails) => {
      // Ensure `prevDetails` is never null by providing a default fallback
      if (!prevDetails) {
        return { class: "", size: "", color: "", estimatedPrice: "", status: "", picture: "", [field]: value };
      }

      return {
        ...prevDetails,
        [field]: value,
      };
    });
  };

  const getCurrentUser = async (token: string): Promise<void> => {
  try {
        const response = await loginUser(token);
        if (response.data.errors) {
          alert(response.data.errors[0]?.message || "Get Current user failed");
          navigate("/login");
          return;
        }
        const response_user = response.data.data.login;
        const user: User = {
          ID: response_user.id,
          Name: response_user.name,
          Email: response_user.email,
        };
        setCurUser(user);
    } catch (err: any) {
        alert(err.response?.data?.error || "Get current user failed");
        navigate("/login");
    }
  }
  // Fetch items
  const fetchItems = async () => {
    if (loading) return; 
    setLoading(true);
    try {
      const response = await getItems(cursor, token || ""); 
      const data = await response.data.data.getItems;
      if (!data || data.length === 0) {
        setHasMore(false); 
      } else {
        setItems((prevItems) => [...prevItems, ...data]); 
        const lastItem = data[data.length - 1]; 
        setCursor(lastItem.id); // Update cursor with the last item's ID
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setLoading(false);
    }
  };
  const fetchHistory = async () => {
    if (historyLoading) return; 
    setHistoryLoading(true);
    try {
      const response = await getHistory(token || ""); 
      console.log(response);
      const data = response.data.data.getHistory; 
      if (data) {
        setHistory([]);  
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setHistoryLoading(false);
    }
  };
  // Infinite scroll for lazy loading
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 100 
      ) { 
        if (activeTab === "Explore" && hasMore && !loading) {
          fetchItems();
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [activeTab, hasMore, loading]);

  useEffect(() => {
    if (activeTab === "Explore" && items.length === 0 && hasMore && !loading) {
        fetchItems();
    } 
  }, [activeTab, items.length, hasMore, loading]);

  useEffect(() => {
    if (token) {
      getCurrentUser(token);
      fetchHistory();
    } else {
      alert("You should login first");
      navigate('/login');
    }
  }, [token]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 1000); // Hide message after 1 second
      return () => clearTimeout(timer);
    }
  }, [message]);


  // Add item to cart
  const handleAddToCart = (item: Item) => {
    setMessage(`Added ${item.class} to cart!`);
    setCart((prevCart) => [...prevCart, item]);
    setItems((prevItems) => prevItems.filter((i) => i.id !== item.id));
    // Add functionality to update cart state
  };

  const handleProceed = async () => {
    try {
      const ids = cart.map(item => item.id);
      const response = await proceedItems(ids, token || "");
      if (response.data.errors) {
        if (response.data.data.proceedItems) {
          const data = response.data.data.proceedItems;
          const success_names = data.map((item: { Class: string; }) => item.Class);
          const errorMessage = response.data.errors[0]?.message || "Failed to proceed items";
          const successMessage = `You just bought: ${success_names.join(", ")}!`;
          setBoughtAlertMessage([errorMessage, successMessage]);
          fetchHistory()
        } else {
          setAlertMessage(response.data.errors[0]?.message || "Failed to proceed items");
        }
        setCart([]);
        return;
      }
      const data = response.data.data.proceedItems;
      const success_names = data.map((item: { class: string; }) => item.class);
      const success_ids = data.map((item: { id: number; }) => item.id);
      setBoughtMessage(`You just bought: ${success_names.join(", ")}!`);
      setCart((prevCart) => prevCart.filter((p) => !success_ids.includes(p.id)));
      fetchHistory()
    } catch (err) {
      console.error("Failed to proceed items", err);
    }
  };

  useEffect(() => {
    if (boughtAlertMessage.length >= 2) {
      setBoughtMessage(null);
      setAlertMessage(boughtAlertMessage[0]);
      const timer = setTimeout(() => {
        setBoughtAlertMessage([]);
        setBoughtMessage(boughtAlertMessage[1]);
      }, 2000); 
      return () => clearTimeout(timer);
    }
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 2000); // Hide message after 1 second
      return () => clearTimeout(timer);
    }
    if (boughtMessage) {
      const timer = setTimeout(() => setBoughtMessage(null), 2000); // Hide message after 1 second
      return () => clearTimeout(timer);
    }
  }, [alertMessage, boughtMessage, boughtAlertMessage]);
  const handleConfirmProceed = () => {
    setConfirmingProceed(true);
  };
  
  const handleCancelProceed = () => {
    setConfirmingProceed(false);
  };

  const handleProceedWithConfirming =() => {
    setConfirmingProceed(false);
    handleProceed(); 
  }

  const handleConfirmLogout = () => {
    setConfirmingLogout(true);
  };
  
  const handleCancelLogout = () => {
    setConfirmingLogout(false);
  };
  
  const handleProceedLogout = () => {
    setConfirmingLogout(false);
    handleLogout(); 
  };

  const handleLogout = () => {
    // Clear user session
    localStorage.removeItem("token");
    // Redirect to login page or homepage
    navigate('/login'); // Use React Router's navigate if applicable
  };

  // Buy item
  const handleBuy = async (item: Item): Promise<void> => {
    try {
      const response = await buyItem(item.id, token || "");
      if (response.data.errors) {
        setAlertMessage(response.data.errors[0]?.message || "Error while buying an item");
        setItems((prevItems) => prevItems.filter((i) => i.id !== item.id));
        setCart((prevCart) => prevCart.filter((i) => i.id !== item.id));
        return;
      }
      const response_item = response.data.data.buyItem;
      setBoughtMessage(`You just bought: ${response_item.class}!`);
      setItems((prevItems) => prevItems.filter((i) => i.id !== item.id));
      setCart((prevCart) => prevCart.filter((i) => i.id !== item.id));
      fetchHistory();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error while buying an item");
    }
  };
  const handleConfirmBuy = (item: Item) => {
    setConfirmingItem(item);
  };
  
  const handleCancelBuy = () => {
    setConfirmingItem(null);
  };

  const handleBuyWithConfirming = () => {
    if (confirmingItem) {
      handleBuy(confirmingItem);
      setConfirmingItem(null);
    }
  };

  return (
    <div className="item-page">
      {/* Notification Message */}
      {message && (
        <div className="notification">
          {message}
        </div>
      )}
      {alertMessage && (
        <div className="alert-notification">
          {alertMessage}
        </div>
      )}
      {boughtMessage && (
        <div className="bought-notification">
          {boughtMessage}
        </div>
      )}
      {confirmingItem && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Do you want to buy {confirmingItem?.class}?</h3>
            <button className="confirm" onClick={handleBuyWithConfirming}>Yes</button>
            <button className="cancel" onClick={handleCancelBuy}>No</button>
          </div>
        </div>
      )}
      {confirmingLogout && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Do you want to logout?</h3>
            <button className="confirm" onClick={handleProceedLogout}>Yes</button>
            <button className="cancel" onClick={handleCancelLogout}>No</button>
          </div>
        </div>
      )}
      {confirmingProceed && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Do you want to proceed?</h3>
            <button className="confirm" onClick={handleProceedWithConfirming}>Yes</button>
            <button className="cancel" onClick={handleCancelProceed}>No</button>
          </div>
        </div>
      )}
      {/* Left Column */}
      <div className="left-column">
        <h1>{curUser ? `Welcome, ${curUser.Name}` : "My App"}</h1>
        <nav>
          <button
            className={activeTab === "Explore" ? "active" : ""}
            onClick={() => setActiveTab("Explore")}>
            Explore
          </button>
          <button
            className={activeTab === "Cart" ? "active" : ""}
            onClick={() => setActiveTab("Cart")}>
            Cart
          </button>
          <button
            className={activeTab === "History" ? "active" : ""}
            onClick={() => setActiveTab("History")}>
            History
          </button>
          <button
            className={activeTab === "Upload" ? "active" : ""}
            onClick={() => setActiveTab("Upload")}>
            Upload
          </button>
        </nav>
        <div className="logout-container">
          <button className="logout-button" onClick={handleConfirmLogout}>Logout</button>
        </div>
      </div>
      {/* Right Column - Item List */}
      <div className="right-column">
      {activeTab === "Explore" && (
        <>
        {items.map((item) => (
          <div key={item.id} className="item-card">
            {/* <img src={item.picture || getDefaultImage(item.classes)} loading="lazy" alt={item.name} className="item-image" onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getDefaultImage(item.classes);  }}/> */}
            <ImageWithTimeout src={item.picture} alt={item.class} classes={item.class} timeoutDuration={5000} className="item-image" />
            <h2>{item.class}</h2>
            <p>Size: {item.size}</p>
            {/* <p>Color: {item.color}</p> */}
            <p>Price: {item.price}</p>
            <p>Status: {item.status}</p>
            <p>Seller: {item.sellerName}</p>
            <div className="item-actions">
              <button onClick={() => handleAddToCart(item)}>Add to Cart</button>
              <button onClick={() => handleConfirmBuy(item)}>Buy Now</button>
            </div>
          </div>
        ))}
        {loading && <p>Loading more items...</p>}
        </>
      )}
      {activeTab === "Cart" && (
        <>
        {cart.map((item) => (
          <div key={item.id} className="item-card">
            <ImageWithTimeout src={item.picture} alt={item.class} classes={item.class} timeoutDuration={5000} className="item-image" />
            <h2>{item.class}</h2>
            <p>Size: {item.size}</p>
            {/* <p>Color: {item.color}</p> */}
            <p>Price: {item.price}</p>
            <p>Status: {item.status}</p>
            <p>Seller: {item.sellerName}</p>
            <div className="item-actions">
              <button onClick={() => handleConfirmBuy(item)}>Buy Now</button>
            </div>
          </div>
        ))}
        {/* Proceed Button */}
        <div className="proceed-floating">
          <button className="proceed-button" disabled={cart.length === 0} onClick={handleConfirmProceed}>
            Proceed
          </button>
        </div>
        </>
      )}
      {activeTab === "History" && (
        <>
        {history.map((item) => (
          <div key={item.id} className="item-card">
           <ImageWithTimeout src={item.picture} alt={item.class} classes={item.class} timeoutDuration={5000} className="item-image" />
            <h2>{item.class}</h2>
            <p>Size: {item.size}</p>
            {/* <p>Color: {item.color}</p> */}
            <p>Price: {item.price}</p>
            <p>Status: {item.status}</p>
            <p>Seller: {item.sellerName}</p>
            <p>Purchased: {item.formattedSoldAt}</p>
          </div>
        ))}
        </>
      )}
      {activeTab === "Upload" && (
       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <h2>You can use webcam to upload your item</h2>
        <video ref={videoRef} autoPlay playsInline width="640" height="480" style={{ transform: "scaleX(-1)" }}/> 
        <button onClick={captureFrame} style={{ width: "66%" }}>Extract item</button>
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

          <button onClick={sendSelectedObject} disabled={isLoading} >{isLoading ? <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}><Spinner /></div> : "Estimate item"}</button>
        </div>
      )}
      {/* Show item details when available */}
      {itemInferenced && (
         <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "10px", maxWidth: "400px", backgroundColor: "#f9f9f9" }}>
         <h2 style={{ color: "#333", textAlign: "center" }}>Item Details</h2>
   
         <label><strong>Model:</strong></label>
         <input 
           type="text"
           value={itemInferenced.class || ""}
           onChange={(e) => handleChange("class", e.target.value)}
           style={{ width: "100%", padding: "5px", marginBottom: "10px" }}
         />
   
         <label><strong>Size:</strong></label>
         <input 
           type="text"
           value={itemInferenced.size || ""}
           onChange={(e) => handleChange("size", e.target.value)}
           style={{ width: "100%", padding: "5px", marginBottom: "10px" }}
         />
   
         <label><strong>Color:</strong></label>
         <input 
           type="text"
           value={itemInferenced.color || ""}
           onChange={(e) => handleChange("color", e.target.value)}
           style={{ width: "100%", padding: "5px", marginBottom: "10px" }}
         />
   
         <label><strong>Estimated Price:</strong></label>
         <input 
           type="text"
           value={itemInferenced.estimatedPrice || ""}
           onChange={(e) => handleChange("estimatedPrice", e.target.value)}
           style={{ width: "100%", padding: "5px", marginBottom: "10px" }}
         />
   
         <label><strong>Status:</strong></label>
         <input 
           type="text"
           value={itemInferenced.status || ""}
           onChange={(e) => handleChange("status", e.target.value)}
           style={{ width: "100%", padding: "5px", marginBottom: "10px" }}
         />
         
         <button 
           onClick={uploadObject}
           style={{ marginTop: "10px", padding: "8px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
           Upload
         </button>
       </div>
      )}

      </div>
      )}
      </div>
    </div>
  );
}

export default Market;