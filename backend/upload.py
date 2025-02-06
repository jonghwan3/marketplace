import logging
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from fastapi import FastAPI, File, UploadFile
import cv2
import numpy as np
import base64
import openai
from ultralytics import YOLO
import io
from PIL import Image
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
import cloudinary.api

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Load the .env file
load_dotenv()
# OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAPI_API_KEY")
CLOUD_NAME = os.getenv("CLOUD_NAME")
API_KEY = os.getenv("API_KEY") # cloudinary
API_SECRET = os.getenv("API_SECRET") # cloudinary


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Load YOLO model
model = YOLO("yolov8m.pt")  # YOLOv8 model

def encode_image_to_base64(image):
    _, buffer = cv2.imencode(".jpg", image)
    return base64.b64encode(buffer).decode("utf-8")


cloudinary.config(
    cloud_name=CLOUD_NAME,
    api_key=API_KEY,
    api_secret=API_SECRET
)

class uploadedImage(BaseModel):
    base64_image: str  # Base64 encoded image

@app.post("/upload_image/")
async def upload_image(request: uploadedImage):
    try:
        response = cloudinary.uploader.upload(f"data:image/png;base64,{request.base64_image}")
        print("Upload Successful!")
        print("Image URL:", response["secure_url"])
        return response["secure_url"]
    except Exception as e:
        print("Error uploading image:", e)
        return None

@app.post("/detect_objects/")
async def detect_objects(file: UploadFile = File(...)):
    try:
        # Read image file
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        image = np.array(image)  # Convert PIL image to NumPy array (RGB)

        # Convert RGB to BGR for OpenCV processing
        image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        # Run YOLO object detection
        results = model(image_bgr)

        detected_objects = []
        cropped_images = []  # Store individual object images

        for result in results:
            for box in result.boxes.data:
                x1, y1, x2, y2, conf, cls = box.tolist()
                class_name = model.names[int(cls)]
                # **Exclude "person" from results**
                if class_name.lower() == "person" or conf < 0.50:
                    continue  

                detected_objects.append({
                    "class": class_name,
                    "confidence": round(conf, 2),
                    "bbox": [int(x1), int(y1), int(x2), int(y2)]
                })

                # Draw bounding box on the full image
                # cv2.rectangle(image_bgr, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                # cv2.putText(image_bgr, f"{class_name} ({conf:.2f})", (int(x1), int(y1) - 10),
                            # cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                # Crop and encode each detected object
                cropped_object = image_bgr[int(y1):int(y2), int(x1):int(x2)]
                flipped_cropped_object = cv2.flip(cropped_object, 1)
                cropped_images.append(encode_image_to_base64(flipped_cropped_object))

        return {
            "objects": detected_objects,
            "processed_image": encode_image_to_base64(image_bgr),  # Return final annotated image
            "cropped_images": cropped_images  # List of all cropped objects
        }
    
    except Exception as e:
        return {"error": str(e)}

# Define data model for incoming request
class SelectedObjectPayload(BaseModel):
    object: dict
    cropped_image: str  # Base64 encoded image

@app.post("/selected_object/")
async def receive_selected_object(payload: SelectedObjectPayload):
    try:
        selected_object = payload.object
        cropped_image_base64 = payload.cropped_image

        logger.info(f"Received object: {selected_object}")
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI assistant that identifies an image. Provide the class (model if possible), size, color, estimated price, and condition status (status should be Best, Good, Okay, Bad)."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Identify this image and return a JSON object with class, size, color, estimatedPrice, and status."},
                         {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{cropped_image_base64}"}}
                    ]
                }
            ]
        )
         # Extract Response
        result = response.choices[0].message.content
        clean_result = result.replace("```json", "").replace("```", "").strip()
        print(clean_result)  # Debugging
        return clean_result  # Return JSON response

        # Decode the base64 cropped image
        # decoded_data = base64.b64decode(cropped_image_base64)
        # image_array = np.frombuffer(decoded_data, dtype=np.uint8)
        # cropped_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        # if cropped_image is None:
        #     logger.error("Failed to decode base64 image")
        #     return {"error": "Failed to decode base64 image"}



        # Optionally save the cropped image
        # filename = f"selected_{selected_object['class']}.jpg"
        # cv2.imwrite(filename, cropped_image)
        # logger.info(f"Saved cropped image as {filename}")

        return {"message": "Received selected object successfully", "object": selected_object}
    
    except Exception as e:
        logger.error(f"Error processing selected object: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
